import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { memo, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getTeamSchedule, getTeams } from '@/services/api';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { Fonts } from '@/constants/fonts';
import { formatKickoffDate, formatKickoffTime } from '@/utils/formatGameTime';
import { teamGradientColor } from '@/utils/teamGradient';
import type { ScheduleGame, Team } from '@/types/huddl';

// A schedule row's two sides — same shape GameCard's TeamColumn expects,
// but built from a Team lookup (for color/abbreviation) merged with
// ScheduleGame's own score/result rather than a full GameTeam object,
// since the schedule endpoint itself doesn't carry team color at all
// (live-checked: /teams/{id}/schedule competitors have no color field,
// unlike the scoreboard/summary endpoints GameCard's own data comes from).
interface ScheduleSide {
  name: string;
  abbreviation: string | null;
  logo: string | null;
  color: string | null;
  score: string | null;
  winner: boolean;
}

function teamColumn(side: ScheduleSide, showScore: boolean) {
  return (
    <View style={styles.teamCol}>
      {side.logo ? <Image source={{ uri: side.logo }} style={styles.logo} contentFit="contain" /> : <View style={styles.logo} />}
      <Text style={styles.abbr} numberOfLines={1}>
        {side.abbreviation ?? side.name}
      </Text>
      {showScore ? <Text style={[styles.teamScore, side.winner && styles.teamScoreWinner]}>{side.score ?? '-'}</Text> : null}
    </View>
  );
}

// Memoized — a full season's schedule can be dozens of rows, each with a
// native gradient layer and two logo images; skip re-rendering rows whose
// data hasn't changed when the list re-renders for unrelated reasons.
const ScheduleRow = memo(function ScheduleRow({ away, home, game }: { away: ScheduleSide; home: ScheduleSide; game: ScheduleGame }) {
  const isPre = game.state === 'pre';
  const isLive = game.state === 'in';
  const label = `${away.name} at ${home.name}, ${
    isPre
      ? `${formatKickoffTime(game.date)} ${formatKickoffDate(game.date)}`
      : isLive
        ? `Live, ${game.detail}`
        : game.detail || 'Final'
  }${isPre ? '' : `, ${away.abbreviation ?? away.name} ${away.score ?? '-'}, ${home.abbreviation ?? home.name} ${home.score ?? '-'}`}`;

  return (
    <View accessible accessibilityLabel={label}>
      {/* Same team-color gradient split as GameCard/ScoreBug — away to home,
          left to right — so a team's schedule reads as the same visual
          language as the rest of the app, not a plain flat list. */}
      <LinearGradient
        colors={[teamGradientColor(away.color), teamGradientColor(home.color)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.card}
      >
        {isPre ? (
          <>
            <Text style={styles.headlineTime}>{formatKickoffTime(game.date)}</Text>
            <Text style={styles.headlineDate}>{formatKickoffDate(game.date)}</Text>
          </>
        ) : (
          <Text style={[styles.headlineStatus, isLive && styles.headlineStatusLive]} numberOfLines={1}>
            {isLive ? `Live · ${game.detail}` : game.detail || 'Final'}
          </Text>
        )}

        <View style={styles.row}>
          {teamColumn(away, !isPre)}
          <View style={styles.center}>
            {isLive ? (
              <View style={styles.liveBadge}>
                <Ionicons name="play" size={10} color={Colors.onAccent} />
                <Text style={styles.liveBadgeText}>Live</Text>
              </View>
            ) : (
              <Text style={styles.centerMuted}>vs</Text>
            )}
          </View>
          {teamColumn(home, !isPre)}
        </View>
      </LinearGradient>
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
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setSchedule(null);
    setTeams(null);
    setError(null);
    // One extra request for the whole league's team list (colors +
    // abbreviations for every opponent at once) rather than fanning out a
    // request per schedule row — the schedule endpoint itself has neither.
    Promise.all([getTeamSchedule(leagueId, teamId), getTeams(leagueId)])
      .then(([games, teamList]) => {
        if (!cancelled) {
          setSchedule(games);
          setTeams(teamList);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load schedule');
      });
    return () => {
      cancelled = true;
    };
  }, [leagueId, teamId]);

  const teamsById = useMemo(() => new Map((teams ?? []).map((t) => [t.id, t])), [teams]);
  const myTeam: ScheduleSide = useMemo(() => {
    const found = teamsById.get(teamId);
    return {
      name: teamName,
      abbreviation: found?.abbreviation ?? null,
      logo: found?.logo ?? teamLogo,
      color: found?.color ?? null,
      score: null,
      winner: false,
    };
  }, [teamsById, teamId, teamName, teamLogo]);

  const rows = useMemo(() => {
    if (!schedule) return [];
    return schedule.map((game) => {
      const opponentTeam = teamsById.get(game.opponent.id ?? '');
      const opponent: ScheduleSide = {
        name: game.opponent.name,
        abbreviation: opponentTeam?.abbreviation ?? game.opponent.abbreviation,
        logo: opponentTeam?.logo ?? game.opponent.logo,
        color: opponentTeam?.color ?? null,
        score: game.opponentScore,
        winner: game.result === 'L',
      };
      const mine: ScheduleSide = { ...myTeam, score: game.teamScore, winner: game.result === 'W' };
      const away = game.isHome ? opponent : mine;
      const home = game.isHome ? mine : opponent;
      return { game, away, home };
    });
  }, [schedule, teamsById, myTeam]);

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
          data={rows}
          keyExtractor={(r) => r.game.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <ScheduleRow game={item.game} away={item.away} home={item.home} />}
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
  list: { padding: Spacing.s4, gap: Spacing.s3 },
  empty: { color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.s6 },
  card: {
    borderRadius: Radius.md,
    paddingVertical: Spacing.s3,
    paddingHorizontal: Spacing.s3,
    alignItems: 'center',
  },
  headlineTime: { color: Colors.text, fontSize: 22, fontFamily: Fonts.extrabold, fontWeight: '800', letterSpacing: -0.3 },
  headlineDate: { color: Colors.textMuted, fontSize: 12, fontFamily: Fonts.semibold, fontWeight: '600', marginTop: 2, marginBottom: Spacing.s2 },
  headlineStatus: {
    color: Colors.textMuted,
    fontSize: 13,
    fontFamily: Fonts.bold,
    fontWeight: '700',
    marginBottom: Spacing.s2,
    textAlign: 'center',
  },
  headlineStatusLive: { color: Colors.live },
  row: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  teamCol: { flex: 1, alignItems: 'center', gap: 2 },
  logo: { width: 60, height: 60, marginBottom: 4 },
  abbr: { color: Colors.text, fontSize: 13, fontFamily: Fonts.extrabold, fontWeight: '800', letterSpacing: 0.3 },
  teamScore: { color: Colors.text, fontSize: 20, fontFamily: Fonts.extrabold, fontWeight: '800', fontVariant: ['tabular-nums'], marginTop: 2 },
  teamScoreWinner: { color: Colors.accent },
  center: { width: 72, alignItems: 'center', justifyContent: 'center' },
  centerMuted: { color: Colors.textMuted, fontSize: 12, fontFamily: Fonts.bold, fontWeight: '700', letterSpacing: 0.5 },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.live,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.s2,
    paddingVertical: 4,
  },
  liveBadgeText: { color: Colors.onAccent, fontSize: 11, fontFamily: Fonts.extrabold, fontWeight: '800', letterSpacing: 0.5 },
});
