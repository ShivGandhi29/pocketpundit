import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { LLAMA3_2_1B_SPINQUANT, useLLM, type Message } from 'react-native-executorch';

import type { GameTeam } from '@/types/pocketpundit';

const SYSTEM_PROMPT =
  'You are a concise, sharp sports analyst. Respond in 3-5 sentences: pick a likely winner, give one ' +
  'key factor driving the pick, and note one thing that could flip it. No headers, no bullet points, plain prose.';

interface AnalyzeArgs {
  leagueLabel: string;
  home: GameTeam;
  away: GameTeam;
}

interface LocalAIContextValue {
  isReady: boolean;
  downloadProgress: number;
  error: string | null;
  analyzeMatchup: (args: AnalyzeArgs) => Promise<string>;
}

const LocalAIContext = createContext<LocalAIContextValue | null>(null);

function buildUserMessage({ leagueLabel, home, away }: AnalyzeArgs): string {
  const homeRecord = home.record ? ` (${home.record})` : '';
  const awayRecord = away.record ? ` (${away.record})` : '';
  const scoreLine =
    away.score != null && home.score != null
      ? `Current score: ${away.name} ${away.score} - ${home.name} ${home.score}`
      : null;
  return [
    `${leagueLabel} matchup.`,
    `Away: ${away.name}${awayRecord}`,
    `Home: ${home.name}${homeRecord}`,
    scoreLine,
  ]
    .filter(Boolean)
    .join('\n');
}

export function LocalAIProvider({ children }: { children: ReactNode }) {
  const llm = useLLM({ model: LLAMA3_2_1B_SPINQUANT });

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
