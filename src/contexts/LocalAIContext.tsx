import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { LLAMA3_2_3B_SPINQUANT, useLLM, type Message } from 'react-native-executorch';

import type { GameTeam } from '@/types/pocketpundit';

const SYSTEM_PROMPT =
  'You are a concise, sharp sports analyst. Your training data has a cutoff date, so any specific facts you ' +
  "recall about rosters, injuries, trades, or coaching staff may be stale — do not state them. Base your pick " +
  "strictly on the records, current score, and win-probability figures given to you in this message; if you " +
  "don't have enough given data to justify a specific factor, speak generally about form and matchup context " +
  'instead of naming players or citing facts not provided. Respond in 3-5 sentences: pick a likely winner, give ' +
  'one key factor driving the pick grounded in the provided data, and note one thing that could flip it. No ' +
  'headers, no bullet points, plain prose.';

interface AnalyzeArgs {
  leagueLabel: string;
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

function buildUserMessage({ leagueLabel, home, away, liveWinProbability }: AnalyzeArgs): string {
  const recordLine = (team: GameTeam) => {
    const splits = [team.homeRecord && `home ${team.homeRecord}`, team.roadRecord && `road ${team.roadRecord}`]
      .filter(Boolean)
      .join(', ');
    return [team.record, splits && `(${splits})`].filter(Boolean).join(' ');
  };
  const scoreLine =
    away.score != null && home.score != null
      ? `Current score: ${away.name} ${away.score} - ${home.name} ${home.score}`
      : null;
  const probabilityLine = liveWinProbability
    ? `ESPN's live win-probability model right now: ${home.name} ${Math.round(liveWinProbability.home * 100)}%, ` +
      `${away.name} ${Math.round(liveWinProbability.away * 100)}%`
    : null;
  return [
    `${leagueLabel} matchup.`,
    `Away: ${away.name} — ${recordLine(away) || 'record unavailable'}`,
    `Home: ${home.name} — ${recordLine(home) || 'record unavailable'}`,
    scoreLine,
    probabilityLine,
  ]
    .filter(Boolean)
    .join('\n');
}

export function LocalAIProvider({ children }: { children: ReactNode }) {
  const llm = useLLM({ model: LLAMA3_2_3B_SPINQUANT });

  const value = useMemo<LocalAIContextValue>(
    () => ({
      isReady: llm.isReady,
      downloadProgress: llm.downloadProgress,
      error: llm.error?.message ?? null,
      analyzeMatchup: (args) => {
        const chat: Message[] = [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserMessage(args) },
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
