import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/AppText';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { GameStatsTabs } from '@/components/GameStatsTabs';
import { GlassIconButton } from '@/components/GlassIconButton';
import { ScoreBug } from '@/components/ScoreBug';
import { useLocalAI } from '@/contexts/LocalAIContext';
import { getGamePredictor } from '@/services/api';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { Fonts } from '@/constants/fonts';
import type { Game, GamePredictor, GameTeam } from '@/types/huddl';

export function GameDetailModal({
  game,
  leagueId,
  leagueLabel,
  onClose,
}: {
  game: Game | null;
  leagueId: string;
  leagueLabel: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const ai = useLocalAI();
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [text, setText] = useState('');
  const [predictor, setPredictor] = useState<GamePredictor | null>(null);
  // The Modal stays mounted between games (just hidden), so a slow in-flight
  // analysis for a since-closed game could otherwise resolve and overwrite
  // whatever game is open by then. This tracks which game a run belongs to
  // so a stale result is dropped instead of applied.
  const requestGameId = useRef<string | null>(null);

  // Analysis is opt-in (button press), not automatic on open — each tap of a
  // game used to trigger a 3B-model generation plus four ESPN fetches
  // (standings/injuries x2) even for a quick glance at the score bug or box
  // score. Resetting to idle here just clears stale state from a
  // previously-viewed game; it does not itself trigger a run.
  useEffect(() => {
    setStatus('idle');
    setText('');
    setPredictor(null);
  }, [game?.id]);

  // Unlike the AI text, this is a plain ESPN fact (their own Matchup
  // Predictor win %) — fetched eagerly and shown regardless of whether the
  // on-device analysis has been run, not folded into the LLM's prose where
  // it might get paraphrased or dropped.
  useEffect(() => {
    if (!game || game.state === 'post') return;
    let cancelled = false;
    getGamePredictor(leagueId, game.id)
      .then((result) => {
        if (!cancelled) setPredictor(result);
      })
      .catch(() => {
        // Best-effort — a missing predictor just means the line doesn't render.
      });
    return () => {
      cancelled = true;
    };
  }, [game?.id, game?.state, leagueId]);

  function runAnalysis() {
    if (!game) return;
    const gameId = game.id;
    requestGameId.current = gameId;
    setStatus('loading');
    setText('');
    ai.analyzeMatchup({
      gameId: game.id,
      leagueId,
      leagueLabel,
      seasonStage: game.seasonStage,
      home: game.home,
      away: game.away,
      liveWinProbability: game.liveWinProbability,
    })
      .then((result) => {
        if (requestGameId.current !== gameId) return;
        setStatus('done');
        setText(result || 'No analysis returned.');
      })
      .catch((err: unknown) => {
        if (requestGameId.current !== gameId) return;
        setStatus('error');
        setText(`Analysis failed: ${err instanceof Error ? err.message : String(err)}`);
      });
  }

  function viewSchedule(team: GameTeam) {
    if (!team.id) return;
    // This Modal renders above the whole app, including navigation, so the
    // pushed route wouldn't be visible until the sheet closes — close first.
    onClose();
    router.push({
      pathname: '/team/[teamId]',
      params: { teamId: team.id, leagueId, teamName: team.name, teamLogo: team.logo ?? undefined },
    });
  }

  return (
    <Modal visible={!!game} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      {/* Modal content renders in its own native window, so it needs its own
          SafeAreaProvider rather than relying on the root one to measure it. */}
      <SafeAreaProvider>
        <SafeAreaView style={styles.sheet} edges={['top', 'bottom']}>
          <View style={styles.header}>
            <Text style={styles.headerTitle} numberOfLines={1} accessibilityRole="header">
              {leagueLabel} · {game?.shortName || ''}
            </Text>
            <GlassIconButton name="close" size={18} onPress={onClose} accessibilityLabel="Close" />
          </View>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {game ? (
              <>
                <ScoreBug
                  game={game}
                  onPressAway={() => viewSchedule(game.away)}
                  onPressHome={() => viewSchedule(game.home)}
                />
                <Text style={styles.scoreBugHint}>Tap a team to see its schedule</Text>

                {/* A prediction is only meaningful before/during a game — once
                    it's final there's nothing left to forecast, so this whole
                    section (and the model download/injuries/standings fetches
                    behind it) is skipped entirely rather than shown disabled. */}
                {game.state !== 'post' ? (
                  <>
                    <Text style={styles.analysisHeading} accessibilityRole="header">
                      ✦ On-device AI analysis
                    </Text>
                    {ai.error ? (
                      <Text style={styles.analysisError}>Local AI unavailable: {ai.error}</Text>
                    ) : !ai.isReady ? (
                      <View style={styles.loadingRow}>
                        <ActivityIndicator color={Colors.accent} accessibilityLabel="Preparing on-device model" />
                        <Text style={styles.loadingText}>
                          {ai.downloadProgress > 0
                            ? `Downloading on-device model… ${Math.round(ai.downloadProgress * 100)}%`
                            : 'Preparing on-device model…'}
                        </Text>
                      </View>
                    ) : status === 'idle' ? (
                      <Pressable
                        onPress={runAnalysis}
                        accessibilityRole="button"
                        accessibilityLabel="Analyze this matchup"
                        style={({ pressed }) => [styles.analyzeBtn, pressed && styles.analyzeBtnPressed]}
                      >
                        <Text style={styles.analyzeBtnText}>Analyze this matchup</Text>
                      </Pressable>
                    ) : status === 'loading' ? (
                      <View style={styles.loadingRow}>
                        <ActivityIndicator color={Colors.accent} accessibilityLabel="Analyzing matchup" />
                        <Text style={styles.loadingText}>Analyzing matchup on-device…</Text>
                      </View>
                    ) : (
                      <>
                        <Text style={[styles.analysisBody, status === 'error' && styles.analysisError]}>{text}</Text>
                        {status === 'done' ? (
                          // Design Guideline — Generative AI > Transparency: "clearly
                          // communicate that AI-generated content may contain errors."
                          <Text style={styles.analysisDisclaimer}>
                            AI-generated on-device — may be wrong, use as one input among others.
                          </Text>
                        ) : null}
                        <Pressable
                          onPress={runAnalysis}
                          hitSlop={8}
                          accessibilityRole="button"
                          accessibilityLabel={status === 'error' ? 'Try again' : 'Re-analyze'}
                          style={styles.reanalyzeBtn}
                        >
                          <Text style={styles.reanalyzeBtnText}>
                            {status === 'error' ? 'Try again' : 'Re-analyze'}
                          </Text>
                        </Pressable>
                      </>
                    )}
                    {/* A plain ESPN fact, not AI-generated — shown explicitly rather
                        than left to the model's prose, which might paraphrase or
                        drop the exact number. */}
                    {predictor ? (
                      <Text style={styles.predictorLine}>
                        ESPN's Matchup Predictor: {game.home.name} {Math.round(predictor.homeWinPct)}% ·{' '}
                        {game.away.name} {Math.round(predictor.awayWinPct)}%
                      </Text>
                    ) : null}
                  </>
                ) : null}

                <View style={styles.statsSection}>
                  <GameStatsTabs game={game} leagueId={leagueId} />
                </View>
              </>
            ) : null}
          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.s3,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { flex: 1, color: Colors.text, fontSize: 16, fontFamily: Fonts.bold, fontWeight: '700' },
  scrollContent: { padding: Spacing.s4 },
  scoreBugHint: { color: Colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: -Spacing.s3, marginBottom: Spacing.s4 },
  analysisHeading: { color: Colors.accent, fontSize: 15, fontFamily: Fonts.bold, fontWeight: '700', marginBottom: Spacing.s2 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.s2, minHeight: 60 },
  loadingText: { color: Colors.textMuted, fontSize: 15 },
  analysisBody: { color: Colors.text, fontSize: 15, lineHeight: 22 },
  analysisDisclaimer: { color: Colors.textMuted, fontSize: 12, marginTop: Spacing.s2 },
  analysisError: { color: Colors.live },
  analyzeBtn: {
    minHeight: 48,
    borderRadius: Radius.sm,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzeBtnPressed: { opacity: 0.85 },
  analyzeBtnText: { color: Colors.onAccent, fontFamily: Fonts.bold, fontWeight: '700', fontSize: 15 },
  reanalyzeBtn: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', marginTop: Spacing.s2 },
  reanalyzeBtnText: { color: Colors.accent, fontFamily: Fonts.semibold, fontWeight: '600', fontSize: 13 },
  predictorLine: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: Spacing.s3,
    paddingTop: Spacing.s3,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  statsSection: {
    marginTop: Spacing.s5,
    paddingTop: Spacing.s4,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
