import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { Image } from 'expo-image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/AppText';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { getMotorsportEventDetail } from '@/services/api';
import { GlassIconButton } from '@/components/GlassIconButton';
import { useLocalAI } from '@/contexts/LocalAIContext';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { Fonts } from '@/constants/fonts';
import { formatLocalKickoff } from '@/utils/formatGameTime';
import type { MotorsportEvent, MotorsportEventDetail, MotorsportSession } from '@/types/huddl';

function SessionRow({ session }: { session: MotorsportSession }) {
  const isLive = session.state === 'in';
  return (
    <View style={styles.sessionRow}>
      <Text style={styles.sessionLabel}>{session.label}</Text>
      <Text style={[styles.sessionDetail, isLive && styles.sessionLive]} numberOfLines={1}>
        {session.state === 'pre' ? formatLocalKickoff(session.date) : session.detail || session.state}
      </Text>
    </View>
  );
}

function ResultRow({ result }: { result: MotorsportSession['results'][number] }) {
  return (
    <View style={[styles.resultRow, result.winner && styles.resultRowWinner]}>
      <Text style={[styles.resultPosition, result.winner && styles.resultWinnerText]}>{result.position}</Text>
      {result.countryFlag ? <Image source={{ uri: result.countryFlag }} style={styles.resultFlag} contentFit="contain" /> : null}
      <Text style={[styles.resultName, result.winner && styles.resultWinnerText]} numberOfLines={1}>
        {result.driverName}
      </Text>
      {/* Only golf carries a score (score-to-par, e.g. "-16") — motorsport
          sessions have no equivalent time/gap data from ESPN, so this stays
          hidden there rather than showing a fabricated or blank column. */}
      {result.score ? (
        <Text style={[styles.resultScore, result.winner && styles.resultWinnerText]}>{result.score}</Text>
      ) : null}
    </View>
  );
}

// Every session ESPN reports — not just the race — carries its own
// finishing order (see api.ts's sessionResults), so the qualifying grid and
// each practice session's classification are worth surfacing, not only who
// won the race. This picks which of those to show first: the race once it
// has a result, otherwise the most recently completed session, so opening
// a still-in-progress weekend lands on whatever's actually happened so far.
function defaultSessionId(sessions: MotorsportSession[]): string | null {
  const withResults = sessions.filter((s) => s.results.length > 0);
  if (withResults.length === 0) return null;
  const race = withResults.find((s) => s.label === 'Race');
  if (race) return race.id;
  return withResults[withResults.length - 1].id;
}

export function MotorsportDetailModal({
  event,
  leagueId,
  leagueLabel,
  onClose,
}: {
  event: MotorsportEvent | null;
  leagueId: string;
  leagueLabel: string;
  onClose: () => void;
}) {
  // PGA is currently the only golf entry sharing this shared motorsport
  // architecture (same calendar/leaderboard data shape) — a plain id check
  // rather than a shared lookup, matching the same check in LocalAIContext.
  const isGolf = leagueId === 'pga';
  const [detail, setDetail] = useState<MotorsportEventDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const ai = useLocalAI();
  const [aiStatus, setAiStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [aiText, setAiText] = useState('');
  // Same reasoning as GameDetailModal's requestGameId — this Modal stays
  // mounted between events, so a slow in-flight analysis for a since-closed
  // race could otherwise resolve and overwrite whatever's open by then.
  const requestEventId = useRef<string | null>(null);

  useEffect(() => {
    if (!event) return;
    let cancelled = false;
    setDetail(null);
    setError(null);
    setActiveSessionId(null);
    setAiStatus('idle');
    setAiText('');
    getMotorsportEventDetail(leagueId, event.date)
      .then((result) => {
        if (cancelled) return;
        setDetail(result);
        setActiveSessionId(defaultSessionId(result.sessions));
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : `Could not load ${isGolf ? 'tournament' : 'race'} detail`);
      });
    return () => {
      cancelled = true;
    };
  }, [event, leagueId]);

  const sessionsWithResults = useMemo(() => detail?.sessions.filter((s) => s.results.length > 0) ?? [], [detail]);
  const activeSession = sessionsWithResults.find((s) => s.id === activeSessionId) ?? null;

  function runAnalysis() {
    if (!event || !detail) return;
    const eventId = event.id;
    requestEventId.current = eventId;
    setAiStatus('loading');
    setAiText('');
    const qualifyingResults = detail.sessions.find((s) => s.label === 'Qual')?.results ?? [];
    ai.analyzeMotorsportEvent({
      leagueId,
      leagueLabel,
      eventName: event.name,
      circuit: detail.circuit,
      qualifyingResults,
    })
      .then((result) => {
        if (requestEventId.current !== eventId) return;
        setAiStatus('done');
        setAiText(result || 'No analysis returned.');
      })
      .catch((err: unknown) => {
        if (requestEventId.current !== eventId) return;
        setAiStatus('error');
        setAiText(`Analysis failed: ${err instanceof Error ? err.message : String(err)}`);
      });
  }

  // The model download is ~2.5GB and, once granted, happens only once per
  // device (cached afterward) — but that first time deserves an explicit
  // heads-up rather than silently eating someone's data/storage.
  function handleAnalyzePress() {
    if (ai.modelDownloadConsented) {
      runAnalysis();
      return;
    }
    Alert.alert(
      'Download on-device AI model?',
      `Analyzing a ${isGolf ? 'tournament' : 'race weekend'} runs a language model on your device instead of a server. It needs a one-time download of about 2.5GB, cached afterward so this only happens once. The ${isGolf ? 'tournament' : 'race'} data and the analysis itself stay on your device and are never sent anywhere. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Download', onPress: () => ai.requestModelDownload() },
      ]
    );
  }

  return (
    <Modal visible={!!event} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaProvider>
        <SafeAreaView style={styles.sheet} edges={['top', 'bottom']}>
          <View style={styles.header}>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.headerTitle} numberOfLines={1} accessibilityRole="header">
                {leagueLabel} · {event?.name ?? ''}
              </Text>
              {detail?.circuit ? (
                <Text style={styles.headerCircuit} numberOfLines={1}>
                  {detail.circuit.name}
                  {detail.circuit.location ? ` · ${detail.circuit.location}` : ''}
                </Text>
              ) : null}
            </View>
            <GlassIconButton name="close" size={18} onPress={onClose} accessibilityLabel="Close" />
          </View>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {error ? (
              <Text style={styles.error}>Could not load this {isGolf ? 'tournament' : 'race'} ({error}).</Text>
            ) : !detail ? (
              <ActivityIndicator
                color={Colors.accent}
                style={{ marginVertical: Spacing.s4 }}
                accessibilityLabel={`Loading ${isGolf ? 'tournament' : 'race'} detail`}
              />
            ) : (
              <>
                {/* Same reasoning as GameDetailModal: a prediction is only
                    meaningful before the race is decided — once it's final
                    there's nothing left to forecast. */}
                {detail.state !== 'post' ? (
                  <>
                    <View style={styles.analysisHeadingRow} accessible accessibilityRole="header">
                      <Ionicons name="sparkles" size={14} color={Colors.accent} />
                      <Text style={styles.analysisHeading}>On-device AI analysis</Text>
                    </View>
                    {ai.error ? (
                      <Text style={styles.analysisError}>Local AI unavailable: {ai.error}</Text>
                    ) : ai.modelDownloadConsented && !ai.isReady ? (
                      <View style={styles.loadingRow}>
                        <ActivityIndicator color={Colors.accent} accessibilityLabel="Preparing on-device model" />
                        <Text style={styles.loadingText}>
                          {ai.downloadProgress > 0
                            ? `Downloading on-device model… ${Math.round(ai.downloadProgress * 100)}%`
                            : 'Preparing on-device model…'}
                        </Text>
                      </View>
                    ) : aiStatus === 'idle' ? (
                      <Pressable
                        onPress={handleAnalyzePress}
                        accessibilityRole="button"
                        accessibilityLabel={`Analyze this ${isGolf ? 'tournament' : 'race'}`}
                        style={({ pressed }) => [styles.analyzeBtn, pressed && styles.analyzeBtnPressed]}
                      >
                        <Text style={styles.analyzeBtnText}>Analyze this {isGolf ? 'tournament' : 'race'}</Text>
                      </Pressable>
                    ) : aiStatus === 'loading' ? (
                      <View style={styles.loadingRow}>
                        <ActivityIndicator color={Colors.accent} accessibilityLabel={`Analyzing ${isGolf ? 'tournament' : 'race'}`} />
                        <Text style={styles.loadingText}>
                          Analyzing {isGolf ? 'tournament' : 'race weekend'} on-device…
                        </Text>
                      </View>
                    ) : (
                      <>
                        <Text style={[styles.analysisBody, aiStatus === 'error' && styles.analysisError]}>{aiText}</Text>
                        {aiStatus === 'done' ? (
                          <Text style={styles.analysisDisclaimer}>
                            AI-generated on-device — may be wrong, use as one input among others.
                          </Text>
                        ) : null}
                        <Pressable
                          onPress={runAnalysis}
                          hitSlop={8}
                          accessibilityRole="button"
                          accessibilityLabel={aiStatus === 'error' ? 'Try again' : 'Re-analyze'}
                          style={styles.reanalyzeBtn}
                        >
                          <Text style={styles.reanalyzeBtnText}>{aiStatus === 'error' ? 'Try again' : 'Re-analyze'}</Text>
                        </Pressable>
                      </>
                    )}
                  </>
                ) : null}

                {/* Golf has exactly one competition per tournament (live-
                    checked — no separate FP1/FP2/Qual/Race split the way
                    motorsport has), so a "Sessions" list showing that one
                    row is pure noise; the leaderboard below is the only
                    thing there is to show. */}
                {!isGolf ? (
                  <>
                    <Text style={[styles.sectionHeading, styles.sectionHeadingSpaced]} accessibilityRole="header">
                      Sessions
                    </Text>
                    <View style={styles.sessionCard}>
                      {detail.sessions.map((s) => (
                        <SessionRow key={s.id} session={s} />
                      ))}
                    </View>
                  </>
                ) : null}

                <Text style={[styles.sectionHeading, isGolf && styles.sectionHeadingSpaced]} accessibilityRole="header">
                  {isGolf ? 'Leaderboard' : 'Results'}
                </Text>
                {sessionsWithResults.length === 0 ? (
                  <Text style={styles.empty}>
                    {isGolf
                      ? 'The leaderboard will appear once the tournament begins.'
                      : 'Results will appear here once a session is run.'}
                  </Text>
                ) : (
                  <>
                    {sessionsWithResults.length > 1 ? (
                      <View style={styles.sessionTabRow}>
                        {sessionsWithResults.map((s) => {
                          const selected = s.id === activeSessionId;
                          return (
                            <Pressable
                              key={s.id}
                              onPress={() => setActiveSessionId(s.id)}
                              accessibilityRole="tab"
                              accessibilityLabel={s.label}
                              accessibilityState={{ selected }}
                            >
                              <GlassView
                                glassEffectStyle="clear"
                                isInteractive
                                tintColor={selected ? Colors.accent : undefined}
                                style={[styles.sessionTab, selected && Platform.OS !== 'ios' && styles.sessionTabSelectedFallback]}
                              >
                                <Text style={[styles.sessionTabText, selected && styles.sessionTabTextSelected]}>{s.label}</Text>
                              </GlassView>
                            </Pressable>
                          );
                        })}
                      </View>
                    ) : null}
                    {activeSession ? (
                      <View style={styles.resultsCard}>
                        {activeSession.results.map((r) => (
                          <ResultRow key={r.position} result={r} />
                        ))}
                      </View>
                    ) : null}
                  </>
                )}
              </>
            )}
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
  },
  headerTitleWrap: { flex: 1, marginRight: Spacing.s2 },
  headerTitle: { color: Colors.text, fontSize: 16, fontFamily: Fonts.bold, fontWeight: '700' },
  headerCircuit: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  scrollContent: { padding: Spacing.s4 },
  error: { color: Colors.live, fontSize: 14, textAlign: 'center', marginVertical: Spacing.s4 },
  empty: { color: Colors.textMuted, fontSize: 14 },
  sectionHeading: { color: Colors.accent, fontSize: 15, fontFamily: Fonts.bold, fontWeight: '700', marginBottom: Spacing.s2 },
  sectionHeadingSpaced: { marginTop: Spacing.s5, paddingTop: Spacing.s4 },
  analysisHeadingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.s2 },
  analysisHeading: { color: Colors.accent, fontSize: 15, fontFamily: Fonts.bold, fontWeight: '700' },
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
  sessionCard: {
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.md,
    padding: Spacing.s3,
    marginBottom: Spacing.s4,
    gap: Spacing.s1,
  },
  sessionRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.s1 },
  sessionLabel: { color: Colors.text, fontSize: 14, fontFamily: Fonts.bold, fontWeight: '700' },
  sessionDetail: { color: Colors.textMuted, fontSize: 13, flexShrink: 1, textAlign: 'right' },
  sessionLive: { color: Colors.live, fontFamily: Fonts.bold, fontWeight: '700' },
  sessionTabRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.s2, marginBottom: Spacing.s3 },
  sessionTab: { minHeight: 40, paddingHorizontal: Spacing.s3, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  sessionTabSelectedFallback: { backgroundColor: Colors.accent },
  sessionTabText: { color: Colors.text, fontSize: 13, fontFamily: Fonts.semibold, fontWeight: '600' },
  sessionTabTextSelected: { color: Colors.onAccent },
  resultsCard: {
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s2,
    paddingVertical: Spacing.s2,
    paddingHorizontal: Spacing.s3,
  },
  resultRowWinner: { backgroundColor: `${Colors.accent}1a` },
  resultPosition: { width: 24, color: Colors.textMuted, fontSize: 14, fontFamily: Fonts.bold, fontWeight: '700', textAlign: 'center' },
  resultFlag: { width: 18, height: 18 },
  resultName: { flex: 1, color: Colors.text, fontSize: 14, fontFamily: Fonts.semibold, fontWeight: '600' },
  resultScore: { color: Colors.textMuted, fontSize: 14, fontFamily: Fonts.bold, fontWeight: '700', fontVariant: ['tabular-nums'] },
  resultWinnerText: { color: Colors.accent },
});
