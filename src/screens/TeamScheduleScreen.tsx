import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { memo, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getTeamSchedule } from '@/services/api';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { Fonts } from '@/constants/fonts';
import { formatLocalKickoff } from '@/utils/formatGameTime';
import type { ScheduleGame } from '@/types/huddl';

const RESULT_COLOR: Record<NonNullable<ScheduleGame['result']>, string> = {
  W: Colors.accent,
  L: Colors.live,
  T: Colors.textMuted,
};

// Memoized — a full season's schedule can be dozens of rows, each with an
// opponent logo; skip re-rendering rows whose data hasn't changed when the
// list re-renders for unrelated reasons (e.g. navigating back to this screen).
const ScheduleRow = memo(function ScheduleRow({ game }: { game: ScheduleGame }) {
  const timeText = game.state === 'pre' ? formatLocalKickoff(game.date) : game.detail;
  return (
    <View style={styles.row}>
      <View style={styles.rowMain}>
        <Text style={styles.rowTime}>{timeText}</Text>
        <View style={styles.rowOpponentLine}>
          <Text style={styles.rowVs}>{game.isHome ? 'vs' : '@'}</Text>
          {game.opponent.logo ? (
            <Image source={{ uri: game.opponent.logo }} style={styles.opponentLogo} contentFit="contain" />
          ) : null}
          <Text style={styles.rowOpponent} numberOfLines={1}>
            {game.opponent.name}
          </Text>
        </View>
      </View>
      {game.result ? (
        <View style={styles.resultBlock}>
          <Text style={[styles.resultBadge, { color: RESULT_COLOR[game.result] }]}>{game.result}</Text>
          <Text style={styles.scoreText}>
            {game.teamScore}–{game.opponentScore}
          </Text>
        </View>
      ) : null}
    </View>
  );
});

export function TeamScheduleScreen({
  leagueId,
  teamId,
  teamName,
  teamLogo,
}: {
  leagueId: string;
  teamId: string;
  teamName: string;
  teamLogo: string | null;
}) {
  const router = useRouter();
  const [schedule, setSchedule] = useState<ScheduleGame[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getTeamSchedule(leagueId, teamId)
      .then((games) => {
        if (!cancelled) setSchedule(games);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load schedule');
      });
    return () => {
      cancelled = true;
    };
  }, [leagueId, teamId]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={18} color={Colors.accent} />
          <Text style={styles.backBtnText}>Back</Text>
        </Pressable>
        <View style={styles.headerTitle}>
          {teamLogo ? <Image source={{ uri: teamLogo }} style={styles.headerLogo} contentFit="contain" /> : null}
          <Text style={styles.headerTitleText} numberOfLines={1} accessibilityRole="header">
            {teamName}
          </Text>
        </View>
        <View style={styles.backBtn} />
      </View>

      {schedule === null ? (
        <Text style={styles.empty} accessibilityLiveRegion="polite">
          {error ? `Could not load schedule (${error}).` : 'Loading schedule…'}
        </Text>
      ) : schedule.length === 0 ? (
        <Text style={styles.empty}>No schedule available right now.</Text>
      ) : (
        <FlatList
          data={schedule}
          keyExtractor={(g) => g.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <ScheduleRow game={item} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.s3,
    paddingVertical: Spacing.s2,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', minWidth: 56, minHeight: 44 },
  backBtnText: { color: Colors.accent, fontFamily: Fonts.semibold, fontWeight: '600', fontSize: 15 },
  headerTitle: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.s2 },
  headerLogo: { width: 22, height: 22 },
  headerTitleText: { color: Colors.text, fontSize: 16, fontFamily: Fonts.bold, fontWeight: '700' },
  list: { padding: Spacing.s4, gap: Spacing.s2 },
  empty: { color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.s6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.s3,
  },
  rowMain: { flex: 1, gap: Spacing.s1 },
  rowTime: { color: Colors.textMuted, fontSize: 12, fontFamily: Fonts.bold, fontWeight: '700' },
  rowOpponentLine: { flexDirection: 'row', alignItems: 'center', gap: Spacing.s2 },
  rowVs: { color: Colors.textMuted, fontSize: 14, fontFamily: Fonts.semibold, fontWeight: '600' },
  opponentLogo: { width: 20, height: 20 },
  rowOpponent: { color: Colors.text, fontSize: 15, fontFamily: Fonts.semibold, fontWeight: '600', flexShrink: 1 },
  resultBlock: { alignItems: 'flex-end', gap: 2 },
  resultBadge: { fontSize: 16, fontFamily: Fonts.extrabold, fontWeight: '800' },
  scoreText: { color: Colors.textMuted, fontSize: 13, fontVariant: ['tabular-nums'] },
});
