import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { LLAMA3_2_3B_SPINQUANT, useLLM, type Message } from 'react-native-executorch';

import { getMotorsportStandings, getTeamInjuries, getTeamStanding } from '@/services/api';
import type {
  GameTeam,
  MotorsportCircuit,
  MotorsportResult,
  MotorsportStandingEntry,
  MotorsportStandings,
  SeasonStage,
  TeamInjury,
  TeamStanding,
} from '@/types/pocketpundit';

const SYSTEM_PROMPT =
  'You are a concise, sharp sports analyst. Your training data has a cutoff date, so any specific facts you ' +
  "recall about rosters, injuries, trades, or coaching staff may be stale — do not state them. Base your pick " +
  'strictly on the records, standings, injuries, current score, and win-probability figures given to you in ' +
  "this message; if you don't have enough given data to justify a specific factor, speak generally about form " +
  'and matchup context instead of naming players or citing facts not provided. Pay attention to the season ' +
  'stage: preseason results are a weak predictor of team quality (rosters are experimental, starters play ' +
  'limited snaps), so hedge accordingly for preseason games rather than treating the score as a strong signal. ' +
  'Respond in 3-5 sentences: pick a likely winner, give one key factor driving the pick grounded in the ' +
  'provided data, and note one thing that could flip it. No headers, no bullet points, plain prose.';

interface AnalyzeArgs {
  leagueId: string;
  leagueLabel: string;
  seasonStage: SeasonStage;
  home: GameTeam;
  away: GameTeam;
  liveWinProbability: { home: number; away: number } | null;
}

// Racing has no two-team "matchup" — a grid of 20 drivers, not one side
// against another — so this is a separate prompt/args shape from
// analyzeMatchup rather than a forced fit into the team-sport one.
const MOTORSPORT_SYSTEM_PROMPT =
  'You are a concise, sharp motorsport analyst. Your training data has a cutoff date, so any specific facts you ' +
  'recall about current drivers, teams, or season standings may be stale — do not state them from memory. Base ' +
  'your pick strictly on the championship standings, qualifying results, and event details given to you in this ' +
  "message; if you don't have enough given data to justify a specific factor, speak generally about season form " +
  'instead of citing facts not provided. If a qualifying grid is given, weight it heavily — grid position is one ' +
  "of the strongest predictors of a race result. If it isn't given yet, say so and hedge toward championship " +
  'form instead. Respond in 3-5 sentences: pick a likely race winner (or podium contender), give one key factor ' +
  'driving the pick grounded in the provided data, and note one thing that could flip it. No headers, no bullet ' +
  'points, plain prose.';

interface AnalyzeMotorsportArgs {
  leagueId: string;
  leagueLabel: string;
  eventName: string;
  circuit: MotorsportCircuit | null;
  /** Grid order, if qualifying has already run this weekend — empty otherwise. */
  qualifyingResults: MotorsportResult[];
}

interface LocalAIContextValue {
  isReady: boolean;
  downloadProgress: number;
  error: string | null;
  analyzeMatchup: (args: AnalyzeArgs) => Promise<string>;
  analyzeMotorsportEvent: (args: AnalyzeMotorsportArgs) => Promise<string>;
}

const LocalAIContext = createContext<LocalAIContextValue | null>(null);

function teamContextLine(team: GameTeam, standing: TeamStanding | null, injuries: TeamInjury[]): string {
  const splits = [team.homeRecord && `home ${team.homeRecord}`, team.roadRecord && `road ${team.roadRecord}`]
    .filter(Boolean)
    .join(', ');
  const standingBits = standing
    ? [
        standing.streak && `streak ${standing.streak}`,
        standing.playoffSeed && `seed ${standing.playoffSeed}`,
        standing.pointDifferential && `point diff ${standing.pointDifferential}`,
      ]
        .filter(Boolean)
        .join(', ')
    : null;
  const injuryBit = injuries.length
    ? `injuries: ${injuries.map((i) => `${i.playerName}${i.position ? ` (${i.position})` : ''} - ${i.status}`).join(', ')}`
    : null;
  return [
    `${team.name} — ${team.record || 'record unavailable'}`,
    splits && `(${splits})`,
    standingBits && `[${standingBits}]`,
    injuryBit,
  ]
    .filter(Boolean)
    .join(' ');
}

function buildUserMessage(
  args: AnalyzeArgs,
  standings: { home: TeamStanding | null; away: TeamStanding | null },
  injuries: { home: TeamInjury[]; away: TeamInjury[] }
): string {
  const { leagueLabel, seasonStage, home, away, liveWinProbability } = args;
  const scoreLine =
    away.score != null && home.score != null
      ? `Current score: ${away.name} ${away.score} - ${home.name} ${home.score}`
      : null;
  const probabilityLine = liveWinProbability
    ? `ESPN's live win-probability model right now: ${home.name} ${Math.round(liveWinProbability.home * 100)}%, ` +
      `${away.name} ${Math.round(liveWinProbability.away * 100)}%`
    : null;
  return [
    `${leagueLabel} matchup — ${seasonStage}.`,
    `Away: ${teamContextLine(away, standings.away, injuries.away)}`,
    `Home: ${teamContextLine(home, standings.home, injuries.home)}`,
    scoreLine,
    probabilityLine,
  ]
    .filter(Boolean)
    .join('\n');
}

function standingsLine(entries: MotorsportStandingEntry[], limit: number): string | null {
  if (!entries.length) return null;
  return entries
    .slice(0, limit)
    .map((e) => `${e.rank}. ${e.name} (${e.points} pts)`)
    .join(', ');
}

function buildMotorsportUserMessage(args: AnalyzeMotorsportArgs, standings: MotorsportStandings): string {
  const { leagueLabel, eventName, circuit, qualifyingResults } = args;
  const circuitLine = circuit ? `Circuit: ${circuit.name}${circuit.location ? ` (${circuit.location})` : ''}.` : null;
  const driversLine = standingsLine(standings.drivers, 5);
  const constructorsLine = standingsLine(standings.constructors, 5);
  const qualiLine = qualifyingResults.length
    ? `Qualifying result (grid order): ${qualifyingResults
        .slice(0, 5)
        .map((r) => `${r.position}. ${r.driverName}`)
        .join(', ')}.`
    : 'Qualifying has not been run yet for this weekend.';
  return [
    `${leagueLabel} race weekend — ${eventName}.`,
    circuitLine,
    driversLine && `Driver championship standings so far: ${driversLine}.`,
    constructorsLine && `Constructor championship standings so far: ${constructorsLine}.`,
    qualiLine,
  ]
    .filter(Boolean)
    .join('\n');
}

async function safeMotorsportStandings(leagueId: string): Promise<MotorsportStandings> {
  try {
    return await getMotorsportStandings(leagueId);
  } catch {
    return { drivers: [], constructors: [] };
  }
}

async function safeInjuries(leagueId: string, teamId: string | null): Promise<TeamInjury[]> {
  if (!teamId) return [];
  try {
    return await getTeamInjuries(leagueId, teamId);
  } catch {
    // Injuries are supplementary grounding, not required — don't block analysis on it.
    return [];
  }
}

async function safeStanding(leagueId: string, teamId: string | null): Promise<TeamStanding | null> {
  if (!teamId) return null;
  try {
    return await getTeamStanding(leagueId, teamId);
  } catch {
    return null;
  }
}

export function LocalAIProvider({ children }: { children: ReactNode }) {
  const llm = useLLM({ model: LLAMA3_2_3B_SPINQUANT });

  const value = useMemo<LocalAIContextValue>(
    () => ({
      isReady: llm.isReady,
      downloadProgress: llm.downloadProgress,
      error: llm.error?.message ?? null,
      analyzeMatchup: async (args) => {
        const { leagueId, home, away } = args;
        const [homeStanding, awayStanding, homeInjuries, awayInjuries] = await Promise.all([
          safeStanding(leagueId, home.id),
          safeStanding(leagueId, away.id),
          safeInjuries(leagueId, home.id),
          safeInjuries(leagueId, away.id),
        ]);
        const chat: Message[] = [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: buildUserMessage(
              args,
              { home: homeStanding, away: awayStanding },
              { home: homeInjuries, away: awayInjuries }
            ),
          },
        ];
        return llm.generate(chat);
      },
      analyzeMotorsportEvent: async (args) => {
        const standings = await safeMotorsportStandings(args.leagueId);
        const chat: Message[] = [
          { role: 'system', content: MOTORSPORT_SYSTEM_PROMPT },
          { role: 'user', content: buildMotorsportUserMessage(args, standings) },
        ];
        return llm.generate(chat);
      },
    }),
    [llm.isReady, llm.downloadProgress, llm.error, llm.generate]
  );

  return <LocalAIContext.Provider value={value}>{children}</LocalAIContext.Provider>;
}

export function useLocalAI(): LocalAIContextValue {
  const ctx = useContext(LocalAIContext);
  if (!ctx) throw new Error('useLocalAI must be used within LocalAIProvider');
  return ctx;
}
