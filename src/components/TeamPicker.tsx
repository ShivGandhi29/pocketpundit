import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Text } from '@/components/AppText';
import { GlassView } from 'expo-glass-effect';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getTeams } from '@/services/api';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { Fonts } from '@/constants/fonts';
import type { FavoriteTeam, League } from '@/types/pocketpundit';

const GRID_COLUMNS = 3;
const GRID_GAP = Spacing.s3;
// Slack at the row's outer edges, same reasoning as LeaguePicker's grid —
// the ScrollView's horizontal bounds are fixed, so a row computed to
// exactly fill that width leaves the edge tiles' Liquid Glass press-bloom
// nowhere to go before it hits the ScrollView's own clipping bounds.
const ROW_EDGE_SLACK = Spacing.s2;

function TeamGroup({
  league,
  favorites,
  onToggle,
  tileWidth,
}: {
  league: League;
  favorites: Map<string, FavoriteTeam>;
  onToggle: (team: FavoriteTeam) => void;
  tileWidth: number;
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
              <Pressable key={team.id} onPress={() => onToggle(team)} accessibilityRole="button" accessibilityState={{ selected: isFav }}>
                {({ pressed }) => (
                  <GlassView
                    glassEffectStyle="regular"
                    isInteractive
                    tintColor={isFav ? Colors.accent : undefined}
                    style={[styles.tile, { width: tileWidth }, pressed && styles.pressed]}
                  >
                    <View style={styles.tileLogoWrap}>
                      <View style={styles.tileLogoBackdrop}>
                        {team.logo ? <Image source={{ uri: team.logo }} style={styles.tileLogo} /> : null}
                      </View>
                      {isFav ? (
                        <View style={styles.tileCheckBadge}>
                          <Ionicons name="checkmark" size={11} color={Colors.onAccent} />
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.tileLabel} numberOfLines={2}>
                      {team.name}
                    </Text>
                  </GlassView>
                )}
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
  const { width: windowWidth } = useWindowDimensions();
  const tileWidth =
    (windowWidth - Spacing.s4 * 2 - GRID_GAP * (GRID_COLUMNS - 1) - ROW_EDGE_SLACK) / GRID_COLUMNS;

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
          <TeamGroup key={league.id} league={league} favorites={favorites} onToggle={toggle} tileWidth={tileWidth} />
        ))}
      </ScrollView>
      <View style={styles.actions}>
        <Pressable style={styles.btnFlex} onPress={onBack}>
          {({ pressed }) => (
            <GlassView glassEffectStyle="regular" isInteractive style={[styles.btn, pressed && styles.pressed]}>
              <Text style={styles.btnGhostText}>Back</Text>
            </GlassView>
          )}
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
  title: { color: Colors.text, fontSize: 26, fontFamily: Fonts.bold, fontWeight: '700', letterSpacing: -0.4, marginBottom: Spacing.s1 },
  subtitle: { color: Colors.textMuted, fontSize: 15, marginBottom: Spacing.s4 },
  group: { marginBottom: Spacing.s4 },
  groupHeading: {
    color: Colors.textMuted,
    fontSize: 13,
    fontFamily: Fonts.bold, fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: Spacing.s2,
  },
  muted: { color: Colors.textMuted, fontSize: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP },
  tile: {
    minHeight: 96,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.s2,
    paddingVertical: Spacing.s3,
    paddingHorizontal: Spacing.s1,
    borderRadius: Radius.md,
  },
  tileLogoWrap: { width: 44, height: 44 },
  tileLogoBackdrop: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLogo: { width: 30, height: 30, resizeMode: 'contain' },
  tileCheckBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.accent,
    borderWidth: 2,
    borderColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: { color: Colors.text, fontSize: 12, fontFamily: Fonts.semibold, fontWeight: '600', textAlign: 'center' },
  actions: {
    flexDirection: 'row',
    gap: Spacing.s2,
    padding: Spacing.s4,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  btnFlex: { flex: 1 },
  btn: { flex: 1, minHeight: 48, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { backgroundColor: Colors.accent },
  btnPrimaryText: { color: Colors.onAccent, fontFamily: Fonts.bold, fontWeight: '700', fontSize: 15 },
  btnGhostText: { color: Colors.text, fontFamily: Fonts.semibold, fontWeight: '600', fontSize: 15 },
  pressed: { opacity: 0.85 },
});
