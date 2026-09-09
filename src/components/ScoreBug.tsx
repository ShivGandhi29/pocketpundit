import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/AppText';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { Fonts } from '@/constants/fonts';
import { formatKickoffDateLong, formatKickoffTime, formatKickoffZone } from '@/utils/formatGameTime';
import { teamGradientColor } from '@/utils/teamGradient';
import type { Game, GameTeam } from '@/types/huddl';

function TeamSide({ team, onPress }: { team: GameTeam; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? `View ${team.name} schedule` : undefined}
      style={({ pressed }) => [styles.side, pressed && onPress && styles.sidePressed]}
    >
      {team.logo ? <Image source={{ uri: team.logo }} style={styles.logo} contentFit="contain" /> : <View style={styles.logo} />}
      {/* Official abbreviation (e.g. "PIT"), not the full name — compact caption under the crest. */}
      <Text style={styles.teamAbbr} numberOfLines={1}>
        {team.abbreviation ?? team.name}
      </Text>
      {team.record ? (
        <Text style={styles.teamRecord} numberOfLines={1}>
          {team.record}
        </Text>
      ) : null}
    </Pressable>
  );
}

// Regulation period count by league — used so the table always shows every
// regulation quarter/period up front (even ones not reached yet mid-game)
// rather than only the columns ESPN has sent scores for so far. Leagues not
// listed here (innings-based MLB, halves-based soccer) fall back to
// whatever periods are actually present, since "always show N" doesn't mean
// the same thing for them.
const REGULATION_PERIODS: Record<string, number> = {
  nfl: 4,
  nba: 4,
  nhl: 3,
  wnba: 4,
  nbl: 4,
  afl: 4,
  nrl: 2,
  ncaaf: 4,
  ncaam: 2, // men's college ball still plays two 20-minute halves, not quarters
  ncaaw: 4, // women's college ball switched to four 10-minute quarters in 2015-16
};

function periodLabel(period: number, regulation: number): string {
  if (period <= regulation) return String(period);
  const otNumber = period - regulation;
  return otNumber === 1 ? 'OT' : `${otNumber}OT`;
}

function LinescoreTable({ game }: { game: Game }) {
  const played = game.away.linescores.length ? game.away.linescores : game.home.linescores;
  if (!played.length) return null; // nothing to show before kickoff

  const regulation = REGULATION_PERIODS[game.leagueId] ?? Math.max(...played.map((p) => p.period));
  const highestPlayed = Math.max(regulation, ...played.map((p) => p.period));
  const periodNumbers = Array.from({ length: highestPlayed }, (_, i) => i + 1);

  return (
    <View style={styles.linescore}>
      {/* Each row below restates its own period labels in its accessibility
          label, so this header row is purely a sighted-layout header —
          hiding it from the accessibility tree avoids announcing bare
          period numbers with no team context. */}
      <View style={styles.linescoreRow} importantForAccessibility="no-hide-descendants">
        <Text style={[styles.linescoreCell, styles.linescoreHeadCell]} />
        {periodNumbers.map((period) => (
          <Text key={period} style={[styles.linescoreCell, styles.linescoreHeadText]}>
            {periodLabel(period, regulation)}
          </Text>
        ))}
        <Text style={[styles.linescoreCell, styles.linescoreHeadText]}>T</Text>
      </View>
      {([
        ['away', game.away],
        ['home', game.home],
      ] as const).map(([key, team]) => {
        // Collapsed into one composed label (e.g. "Pittsburgh: Q1 7, Q2 0,
        // Total 13") rather than leaving each cell individually focusable —
        // a screen reader landing on a bare "7" has no way to tell which
        // team or period it belongs to otherwise.
        const rowLabel = [
          `${team.name}:`,
          ...periodNumbers.map(
            (period) => `${periodLabel(period, regulation)} ${team.linescores.find((l) => l.period === period)?.displayValue ?? '-'}`
          ),
          `Total ${team.score ?? '-'}`,
        ].join(', ');
        return (
          <View key={key} style={styles.linescoreRow} accessible accessibilityLabel={rowLabel}>
            <Text style={[styles.linescoreCell, styles.linescoreHeadCell, styles.linescoreAbbr]}>
              {team.abbreviation}
            </Text>
            {periodNumbers.map((period) => (
              <Text key={period} style={styles.linescoreCell}>
                {team.linescores.find((l) => l.period === period)?.displayValue ?? '-'}
              </Text>
            ))}
            <Text style={[styles.linescoreCell, styles.linescoreTotal]}>{team.score ?? '-'}</Text>
          </View>
        );
      })}
    </View>
  );
}

export function ScoreBug({
  game,
  onPressAway,
  onPressHome,
}: {
  game: Game;
  onPressAway?: () => void;
  onPressHome?: () => void;
}) {
  const statusText = game.state === 'pre' ? null : game.detail;
  const kickoffZone = game.state === 'pre' ? formatKickoffZone(game.date) : null;
  return (
    // Vertical split down the middle — away's color on the left blending
    // into home's on the right — rather than a flat single-color card, per
    // the original ESPN-style gradient score bug this was always aiming for.
    <LinearGradient
      colors={[teamGradientColor(game.away.color), teamGradientColor(game.home.color)]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.container}
    >
      <Text style={styles.seasonStage}>{game.seasonStage}</Text>
      <View style={styles.row}>
        <TeamSide team={game.away} onPress={onPressAway} />
        <View style={styles.center}>
          {game.state !== 'pre' ? (
            <>
              <Text style={styles.score}>{game.away.score}</Text>
              <Text style={[styles.status, game.state === 'in' && styles.statusLive]} numberOfLines={1}>
                {statusText}
              </Text>
              <Text style={styles.score}>{game.home.score}</Text>
            </>
          ) : (
            <>
              <Text style={styles.preTime}>{formatKickoffTime(game.date)}</Text>
              <Text style={styles.preDate} numberOfLines={1}>
                {formatKickoffDateLong(game.date)}
                {kickoffZone ? ` · ${kickoffZone}` : ''}
              </Text>
            </>
          )}
        </View>
        <TeamSide team={game.home} onPress={onPressHome} />
      </View>
      <LinescoreTable game={game} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.md,
    paddingVertical: Spacing.s3,
    marginBottom: Spacing.s4,
    overflow: 'hidden',
  },
  seasonStage: {
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: Fonts.bold, fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.s2,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  side: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: Spacing.s2,
    paddingVertical: Spacing.s2,
    minHeight: 132,
  },
  sidePressed: { opacity: 0.85 },
  logo: { width: 60, height: 60, marginBottom: 4 },
  teamAbbr: { color: Colors.text, fontSize: 13, fontFamily: Fonts.extrabold, fontWeight: '800', letterSpacing: 0.3 },
  teamRecord: { color: Colors.textMuted, fontSize: 11, textAlign: 'center' },
  center: { alignItems: 'center', paddingHorizontal: Spacing.s2, minWidth: 88 },
  score: { color: Colors.text, fontSize: 26, fontFamily: Fonts.extrabold, fontWeight: '800', fontVariant: ['tabular-nums'] },
  status: { color: Colors.textMuted, fontSize: 11, fontFamily: Fonts.bold, fontWeight: '700', marginVertical: 2, textAlign: 'center' },
  statusLive: { color: Colors.live },
  // Same big/small hierarchy as GameCard's pre-game headline (time carries
  // the visual weight the score will have once the game starts; date is
  // secondary) rather than one dense "Sun, Sep 13 at 9:00 AM GMT+10" line.
  preTime: {
    color: Colors.text,
    fontSize: 22,
    fontFamily: Fonts.extrabold,
    fontWeight: '800',
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
  },
  preDate: { color: Colors.textMuted, fontSize: 12, fontFamily: Fonts.semibold, fontWeight: '600', marginTop: 2, textAlign: 'center' },
  statusPre: { color: Colors.textMuted, fontSize: 12, fontFamily: Fonts.semibold, fontWeight: '600', textAlign: 'center' },
  linescore: { marginTop: Spacing.s3, paddingHorizontal: Spacing.s3, gap: 2 },
  linescoreRow: { flexDirection: 'row', justifyContent: 'center' },
  linescoreCell: {
    width: 28,
    textAlign: 'center',
    color: Colors.text,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    paddingVertical: 2,
  },
  linescoreHeadCell: { width: 40, textAlign: 'left' },
  linescoreHeadText: { color: Colors.textMuted, fontFamily: Fonts.bold, fontWeight: '700' },
  linescoreAbbr: { color: Colors.text, fontFamily: Fonts.bold, fontWeight: '700' },
  linescoreTotal: { fontFamily: Fonts.extrabold, fontWeight: '800' },
});
