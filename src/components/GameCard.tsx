import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/AppText';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { Fonts } from '@/constants/fonts';
import { formatKickoffDate, formatKickoffTime } from '@/utils/formatGameTime';
import type { Game, GameTeam } from '@/types/pocketpundit';

function TeamColumn({ team, showScore }: { team: GameTeam; showScore: boolean }) {
  return (
    <View style={styles.teamCol}>
      {team.logo ? <Image source={{ uri: team.logo }} style={styles.logo} /> : <View style={styles.logo} />}
      <Text style={styles.abbr} numberOfLines={1}>
        {team.abbreviation ?? team.name}
      </Text>
      {team.record ? (
        <Text style={styles.record} numberOfLines={1}>
          {team.record}
        </Text>
      ) : null}
      {showScore ? (
        <Text style={[styles.teamScore, team.winner && styles.teamScoreWinner]}>{team.score ?? '-'}</Text>
      ) : null}
    </View>
  );
}

function CenterBadge({ state }: { state: Game['state'] }) {
  if (state === 'in') {
    return (
      <View style={styles.liveBadge}>
        <Ionicons name="play" size={10} color={Colors.onAccent} />
        <Text style={styles.liveBadgeText}>LIVE</Text>
      </View>
    );
  }
  if (state === 'post') {
    return <Text style={styles.centerMuted}>FINAL</Text>;
  }
  return <Text style={styles.centerMuted}>VS</Text>;
}

export function GameCard({
  game,
  favorite,
  onPress,
}: {
  game: Game;
  favorite: boolean;
  onPress: () => void;
}) {
  const isLive = game.state === 'in';
  const isPre = game.state === 'pre';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, favorite && styles.cardFavorite, pressed && styles.pressed]}
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
        <TeamColumn team={game.away} showScore={!isPre} />
        <View style={styles.center}>
          <CenterBadge state={game.state} />
        </View>
        <TeamColumn team={game.home} showScore={!isPre} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingVertical: Spacing.s3,
    paddingHorizontal: Spacing.s3,
    alignItems: 'center',
  },
  cardFavorite: { borderColor: Colors.accentStrong },
  pressed: { opacity: 0.85 },
  headlineTime: { color: Colors.text, fontSize: 22, fontFamily: Fonts.extrabold, fontWeight: '800', letterSpacing: -0.3 },
  headlineDate: { color: Colors.textMuted, fontSize: 12, fontFamily: Fonts.semibold, fontWeight: '600', marginTop: 2, marginBottom: Spacing.s2 },
  headlineStatus: {
    color: Colors.textMuted,
    fontSize: 13,
    fontFamily: Fonts.bold, fontWeight: '700',
    marginBottom: Spacing.s2,
    textAlign: 'center',
  },
  headlineStatusLive: { color: Colors.live },
  row: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  teamCol: { flex: 1, alignItems: 'center', gap: 2 },
  logo: { width: 36, height: 36, resizeMode: 'contain', marginBottom: 2 },
  abbr: { color: Colors.text, fontSize: 13, fontFamily: Fonts.extrabold, fontWeight: '800', letterSpacing: 0.3 },
  record: { color: Colors.textMuted, fontSize: 11 },
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
