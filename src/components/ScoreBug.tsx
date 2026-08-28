import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { formatLocalKickoff } from '@/utils/formatGameTime';
import type { Game, GameTeam } from '@/types/pocketpundit';

// Low-opacity team-color wash behind each side, echoing ESPN's gradient
// score-bug without needing a gradient library (avoids pulling in a new
// native dependency for a purely decorative touch).
function tint(color: string | null): string {
  return color ? `${color}26` : 'transparent'; // ~15% alpha
}

function TeamSide({ team, onPress }: { team: GameTeam; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.side, { backgroundColor: tint(team.color) }, pressed && onPress && styles.sidePressed]}
    >
      {team.logo ? <Image source={{ uri: team.logo }} style={styles.logo} /> : <View style={styles.logo} />}
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
      <View style={styles.linescoreRow}>
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
      ] as const).map(([key, team]) => (
        <View key={key} style={styles.linescoreRow}>
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
      ))}
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
  const statusText = game.state === 'pre' ? formatLocalKickoff(game.date) : game.detail;
  return (
    <View style={styles.container}>
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
            <Text style={styles.statusPre} numberOfLines={2}>
              {statusText}
            </Text>
          )}
        </View>
        <TeamSide team={game.home} onPress={onPressHome} />
      </View>
      <LinescoreTable game={game} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.md,
    paddingVertical: Spacing.s3,
    marginBottom: Spacing.s4,
    overflow: 'hidden',
  },
  seasonStage: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
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
    minHeight: 88,
  },
  sidePressed: { opacity: 0.85 },
  logo: { width: 36, height: 36, resizeMode: 'contain', marginBottom: 2 },
  teamAbbr: { color: Colors.text, fontSize: 13, fontWeight: '800', letterSpacing: 0.3 },
  teamRecord: { color: Colors.textMuted, fontSize: 11, textAlign: 'center' },
  center: { alignItems: 'center', paddingHorizontal: Spacing.s2, minWidth: 88 },
  score: { color: Colors.text, fontSize: 26, fontWeight: '800', fontVariant: ['tabular-nums'] },
  status: { color: Colors.textMuted, fontSize: 11, fontWeight: '700', marginVertical: 2, textAlign: 'center' },
  statusLive: { color: Colors.live },
  statusPre: { color: Colors.textMuted, fontSize: 12, fontWeight: '600', textAlign: 'center' },
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
  linescoreHeadText: { color: Colors.textMuted, fontWeight: '700' },
  linescoreAbbr: { color: Colors.text, fontWeight: '700' },
  linescoreTotal: { fontWeight: '800' },
});
