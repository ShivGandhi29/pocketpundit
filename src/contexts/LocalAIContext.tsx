import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { LLAMA3_2_3B_SPINQUANT, useLLM, type Message } from 'react-native-executorch';

import { getTeamInjuries, getTeamStanding } from '@/services/api';
import type { GameTeam, SeasonStage, TeamInjury, TeamStanding } from '@/types/pocketpundit';

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

interface LocalAIContextValue {
  isReady: boolean;
  downloadProgress: number;
  error: string | null;
  analyzeMatchup: (args: AnalyzeArgs) => Promise<string>;
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
