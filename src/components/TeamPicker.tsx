import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getTeams } from '@/services/api';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { FavoriteTeam, League } from '@/types/pocketpundit';

function TeamGroup({
  league,
  favorites,
  onToggle,
}: {
  league: League;
  favorites: Map<string, FavoriteTeam>;
  onToggle: (team: FavoriteTeam) => void;
}) {
  const [teams, setTeams] = useState<FavoriteTeam[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getTeams(league.id)
      .then((result) => {
        if (!cancelled) setTeams(result.map((t) => ({ ...t, leagueId: league.id })));
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load teams');
      });
    return () => {
      cancelled = true;
    };
  }, [league.id]);

  return (
    <View style={styles.group}>
      <Text style={styles.groupHeading}>{league.label}</Text>
      {error ? (
        <Text style={styles.muted}>Could not load teams ({error}).</Text>
      ) : !teams ? (
        <ActivityIndicator color={Colors.accent} style={{ marginVertical: Spacing.s3 }} />
      ) : (
        <View style={styles.grid}>
          {teams.map((team) => {
            const isFav = favorites.has(team.id);
            return (
              <Pressable
                key={team.id}
                onPress={() => onToggle(team)}
                style={({ pressed }) => [styles.chip, isFav && styles.chipActive, pressed && styles.pressed]}
              >
                {team.logo ? <Image source={{ uri: team.logo }} style={styles.chipLogo} /> : null}
                <Text style={styles.chipLabel} numberOfLines={1}>
                  {team.abbreviation || team.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

export function TeamPicker({
  leagues,
  initialFavorites,
  onBack,
  onFinish,
}: {
  leagues: League[];
  initialFavorites: Record<string, FavoriteTeam>;
  onBack: () => void;
  onFinish: (favorites: Record<string, FavoriteTeam>) => void;
}) {
  const [favorites, setFavorites] = useState<Map<string, FavoriteTeam>>(new Map(Object.entries(initialFavorites)));
  // Motorsport leagues (drivers, not teams) have nothing to show here — the
  // caller should skip this screen entirely when only motorsport is selected,
  // but filter defensively since this component may be reused elsewhere.
  const teamLeagues = leagues.filter((l) => l.kind === 'team');

  function toggle(team: FavoriteTeam) {
    setFavorites((prev) => {
      const next = new Map(prev);
      if (next.has(team.id)) next.delete(team.id);
      else next.set(team.id, team);
      return next;
    });
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Favorite your teams</Text>
        <Text style={styles.subtitle}>Optional — their games get pinned to the top of your list.</Text>
        {teamLeagues.map((league) => (
          <TeamGroup key={league.id} league={league} favorites={favorites} onToggle={toggle} />
        ))}
      </ScrollView>
      <View style={styles.actions}>
        <Pressable style={({ pressed }) => [styles.btn, styles.btnGhost, pressed && styles.pressed]} onPress={onBack}>
          <Text style={styles.btnGhostText}>Back</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.btn, styles.btnPrimary, pressed && styles.pressed]}
          onPress={() => onFinish(Object.fromEntries(favorites))}
        >
          <Text style={styles.btnPrimaryText}>Done</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: Spacing.s4, paddingBottom: Spacing.s6 },
  title: { color: Colors.text, fontSize: 26, fontWeight: '700', letterSpacing: -0.4, marginBottom: Spacing.s1 },
  subtitle: { color: Colors.textMuted, fontSize: 15, marginBottom: Spacing.s4 },
  group: { marginBottom: Spacing.s4 },
  groupHeading: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: Spacing.s2,
  },
  muted: { color: Colors.textMuted, fontSize: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.s2 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s2,
    minHeight: 48,
    minWidth: '47%',
    paddingHorizontal: Spacing.s2,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
  },
  chipActive: { borderColor: Colors.accent, backgroundColor: Colors.surfaceRaised },
  chipLogo: { width: 22, height: 22, resizeMode: 'contain' },
  chipLabel: { color: Colors.text, fontSize: 14, flexShrink: 1 },
  actions: {
    flexDirection: 'row',
    gap: Spacing.s2,
    padding: Spacing.s4,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  btn: { flex: 1, minHeight: 48, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { backgroundColor: Colors.accent },
  btnPrimaryText: { color: Colors.onAccent, fontWeight: '700', fontSize: 15 },
  btnGhost: { borderWidth: 1, borderColor: Colors.border },
  btnGhostText: { color: Colors.text, fontWeight: '600', fontSize: 15 },
  pressed: { opacity: 0.85 },
});
