import { GlassView } from 'expo-glass-effect';
import { Image } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/AppText';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { getMotorsportEventDetail } from '@/services/api';
import { GlassIconButton } from '@/components/GlassIconButton';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { Fonts } from '@/constants/fonts';
import { formatLocalKickoff } from '@/utils/formatGameTime';
import type { MotorsportEvent, MotorsportEventDetail, MotorsportSession } from '@/types/pocketpundit';

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
  const [detail, setDetail] = useState<MotorsportEventDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (!event) return;
    let cancelled = false;
    setDetail(null);
    setError(null);
    setActiveSessionId(null);
    getMotorsportEventDetail(leagueId, event.date)
      .then((result) => {
        if (cancelled) return;
        setDetail(result);
        setActiveSessionId(defaultSessionId(result.sessions));
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load race detail');
      });
    return () => {
      cancelled = true;
    };
  }, [event, leagueId]);

  const sessionsWithResults = useMemo(() => detail?.sessions.filter((s) => s.results.length > 0) ?? [], [detail]);
  const activeSession = sessionsWithResults.find((s) => s.id === activeSessionId) ?? null;

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
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {error ? (
              <Text style={styles.error}>Could not load this race ({error}).</Text>
            ) : !detail ? (
              <ActivityIndicator
                color={Colors.accent}
                style={{ marginVertical: Spacing.s4 }}
                accessibilityLabel="Loading race detail"
              />
            ) : (
              <>
                <Text style={styles.sectionHeading} accessibilityRole="header">
                  Sessions
                </Text>
                <View style={styles.sessionCard}>
                  {detail.sessions.map((s) => (
                    <SessionRow key={s.id} session={s} />
                  ))}
                </View>

                <Text style={styles.sectionHeading} accessibilityRole="header">
                  Results
                </Text>
                {sessionsWithResults.length === 0 ? (
                  <Text style={styles.empty}>Results will appear here once a session is run.</Text>
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
                                glassEffectStyle="regular"
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitleWrap: { flex: 1, marginRight: Spacing.s2 },
  headerTitle: { color: Colors.text, fontSize: 16, fontFamily: Fonts.bold, fontWeight: '700' },
  headerCircuit: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  scrollContent: { padding: Spacing.s4 },
  error: { color: Colors.live, fontSize: 14, textAlign: 'center', marginVertical: Spacing.s4 },
  empty: { color: Colors.textMuted, fontSize: 14 },
  sectionHeading: { color: Colors.accent, fontSize: 15, fontFamily: Fonts.bold, fontWeight: '700', marginBottom: Spacing.s2 },
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  resultRowWinner: { backgroundColor: `${Colors.accent}1a` },
  resultPosition: { width: 24, color: Colors.textMuted, fontSize: 14, fontFamily: Fonts.bold, fontWeight: '700', textAlign: 'center' },
  resultFlag: { width: 18, height: 18 },
  resultName: { flex: 1, color: Colors.text, fontSize: 14, fontFamily: Fonts.semibold, fontWeight: '600' },
  resultWinnerText: { color: Colors.accent },
});
