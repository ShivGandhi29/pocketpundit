import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/AppText';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { getMotorsportEventDetail } from '@/services/api';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { Fonts } from '@/constants/fonts';
import { formatLocalKickoff } from '@/utils/formatGameTime';
import type { MotorsportEvent, MotorsportEventDetail } from '@/types/pocketpundit';

function SessionRow({ session }: { session: MotorsportEventDetail['sessions'][number] }) {
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

function ResultRow({ result }: { result: MotorsportEventDetail['results'][number] }) {
  return (
    <View style={[styles.resultRow, result.winner && styles.resultRowWinner]}>
      <Text style={[styles.resultPosition, result.winner && styles.resultWinnerText]}>{result.position}</Text>
      {result.countryFlag ? <Image source={{ uri: result.countryFlag }} style={styles.resultFlag} /> : null}
      <Text style={[styles.resultName, result.winner && styles.resultWinnerText]} numberOfLines={1}>
        {result.driverName}
      </Text>
    </View>
  );
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

  useEffect(() => {
    if (!event) return;
    let cancelled = false;
    setDetail(null);
    setError(null);
    getMotorsportEventDetail(leagueId, event.date)
      .then((result) => {
        if (!cancelled) setDetail(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load race detail');
      });
    return () => {
      cancelled = true;
    };
  }, [event, leagueId]);

  return (
    <Modal visible={!!event} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaProvider>
        <SafeAreaView style={styles.sheet} edges={['top', 'bottom']}>
          <View style={styles.header}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {leagueLabel} · {event?.name ?? ''}
            </Text>
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>Close</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {error ? (
              <Text style={styles.error}>Could not load this race ({error}).</Text>
            ) : !detail ? (
              <ActivityIndicator color={Colors.accent} style={{ marginVertical: Spacing.s4 }} />
            ) : (
              <>
                <Text style={styles.sectionHeading}>Sessions</Text>
                <View style={styles.sessionCard}>
                  {detail.sessions.map((s) => (
                    <SessionRow key={s.id} session={s} />
                  ))}
                </View>

                <Text style={styles.sectionHeading}>Results</Text>
                {detail.results.length === 0 ? (
                  <Text style={styles.empty}>Results will appear here once the race is run.</Text>
                ) : (
                  <View style={styles.resultsCard}>
                    {detail.results.map((r) => (
                      <ResultRow key={r.position} result={r} />
                    ))}
                  </View>
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
  headerTitle: { flex: 1, color: Colors.text, fontSize: 16, fontFamily: Fonts.bold, fontWeight: '700' },
  closeBtn: { paddingHorizontal: Spacing.s2, paddingVertical: Spacing.s1 },
  closeBtnText: { color: Colors.accent, fontFamily: Fonts.semibold, fontWeight: '600', fontSize: 15 },
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
  resultFlag: { width: 18, height: 18, resizeMode: 'contain' },
  resultName: { flex: 1, color: Colors.text, fontSize: 14, fontFamily: Fonts.semibold, fontWeight: '600' },
  resultWinnerText: { color: Colors.accent },
});
