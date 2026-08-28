import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';
import type { Game, GameTeam } from '@/types/pocketpundit';

function TeamRow({ team, state }: { team: GameTeam; state: Game['state'] }) {
  return (
    <View style={styles.row}>
      {team.logo ? <Image source={{ uri: team.logo }} style={styles.logo} /> : <View style={styles.logo} />}
      <Text style={styles.name} numberOfLines={1}>
        {team.name}
      </Text>
      <Text style={styles.record}>{team.record || ''}</Text>
      <Text style={styles.score}>{state === 'pre' ? '' : (team.score ?? '')}</Text>
    </View>
  );
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
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, favorite && styles.cardFavorite, pressed && styles.pressed]}
    >
      <Text style={[styles.status, isLive && styles.statusLive]}>
        {isLive ? `Live · ${game.detail}` : game.detail || 'Scheduled'}
      </Text>
      <TeamRow team={game.away} state={game.state} />
      <TeamRow team={game.home} state={game.state} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.s3,
  },
  cardFavorite: { borderColor: Colors.accentStrong },
  pressed: { opacity: 0.85 },
  status: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: Colors.textMuted,
    marginBottom: Spacing.s2,
  },
  statusLive: { color: Colors.live },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s2,
    paddingVertical: Spacing.s1,
  },
  logo: { width: 24, height: 24, resizeMode: 'contain' },
  name: { flex: 1, color: Colors.text, fontSize: 15, fontWeight: '600' },
  record: { color: Colors.textMuted, fontSize: 13 },
  score: { color: Colors.text, fontSize: 18, fontWeight: '700', minWidth: 28, textAlign: 'right' },
});
