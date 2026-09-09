import { Ionicons } from '@expo/vector-icons';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, TextInput, View, useWindowDimensions } from 'react-native';
import { Text } from '@/components/AppText';
import { GlassView } from 'expo-glass-effect';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { PillButton } from '@/components/onboarding/PillButton';
import { getTeams } from '@/services/api';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { Fonts } from '@/constants/fonts';
import { teamGradientColor } from '@/utils/teamGradient';
import { favoriteKey } from '@/utils/favorites';
import type { FavoriteTeam, League } from '@/types/huddl';

const GRID_COLUMNS = 3;
const GRID_GAP = Spacing.s3;
// Slack at the row's outer edges, same reasoning as LeaguePicker's grid —
// the ScrollView's horizontal bounds are fixed, so a row computed to
// exactly fill that width leaves the edge tiles' Liquid Glass press-bloom
// nowhere to go before it hits the ScrollView's own clipping bounds.
const ROW_EDGE_SLACK = Spacing.s2;

// Memoized so favoriting one team doesn't re-render every other tile in
// every group — `isFav` and `onToggle` are the only props that change
// meaning, and both are cheap primitive/stable comparisons for memo.
const TeamTile = memo(function TeamTile({
  team,
  isFav,
  tileWidth,
  onToggle,
}: {
  team: FavoriteTeam;
  isFav: boolean;
  tileWidth: number;
  onToggle: (team: FavoriteTeam) => void;
}) {
  return (
    <Pressable onPress={() => onToggle(team)} accessibilityRole="button" accessibilityState={{ selected: isFav }}>
      {({ pressed }) => (
        <View
          style={[styles.tile, { width: tileWidth, backgroundColor: teamGradientColor(team.color ?? null) }, pressed && styles.pressed]}
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
        </View>
      )}
    </Pressable>
  );
});

function TeamGroup({
  league,
  favorites,
  onToggle,
  tileWidth,
  query,
}: {
  league: League;
  favorites: Map<string, FavoriteTeam>;
  onToggle: (team: FavoriteTeam) => void;
  tileWidth: number;
  /** Trimmed, lowercased search text. */
  query: string;
}) {
  const [teams, setTeams] = useState<FavoriteTeam[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  // The first row is always visible — no tap needed to see it — so a
  // league's grid opens capped to its first 3 teams; the down-arrow below
  // reveals the rest. Reset while searching, since capping to 3 would hide
  // the very team the search is trying to surface.
  const [showAll, setShowAll] = useState(false);
  const searching = query.length > 0;
  const favoritedCount = useMemo(
    () => Array.from(favorites.values()).filter((t) => t.leagueId === league.id).length,
    [favorites, league.id]
  );

  useEffect(() => {
    if (teams || error) return;
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
  }, [league.id, teams, error]);

  const visibleTeams = useMemo(() => {
    if (!teams) return null;
    if (!searching) return teams;
    return teams.filter((t) => t.name.toLowerCase().includes(query));
  }, [teams, searching, query]);

  // Once this group's teams have loaded, a search with zero matches hides
  // the whole group rather than leaving an empty shell — same as LeaguePicker
  // dropping sport groups with no matching leagues. Still loading (visibleTeams
  // null) always shows through so the group doesn't flicker away and back.
  if (searching && visibleTeams && visibleTeams.length === 0) return null;

  const cappedTeams = !visibleTeams || searching || showAll ? visibleTeams : visibleTeams.slice(0, GRID_COLUMNS);
  const hasMore = !searching && visibleTeams && visibleTeams.length > GRID_COLUMNS;

  return (
    <View style={styles.group}>
      <View style={styles.groupHeader}>
        <Text style={styles.groupHeading} accessibilityRole="header">
          {league.label}
        </Text>
        {favoritedCount > 0 ? (
          <View style={styles.groupBadge}>
            <Text style={styles.groupBadgeText}>{favoritedCount}</Text>
          </View>
        ) : null}
      </View>
      {error ? (
        <Text style={styles.muted}>Could not load teams ({error}).</Text>
      ) : !visibleTeams ? (
        <ActivityIndicator
          color={Colors.accent}
          style={{ marginVertical: Spacing.s3 }}
          accessibilityLabel={`Loading ${league.label} teams`}
        />
      ) : (
        <>
          <View style={styles.grid}>
            {cappedTeams?.map((team) => (
              <TeamTile
                key={team.id}
                team={team}
                isFav={favorites.has(favoriteKey(team.leagueId, team.id))}
                tileWidth={tileWidth}
                onToggle={onToggle}
              />
            ))}
          </View>
          {hasMore ? (
            <Pressable
              onPress={() => setShowAll((v) => !v)}
              accessibilityRole="button"
              accessibilityState={{ expanded: showAll }}
              accessibilityLabel={showAll ? `Show fewer ${league.label} teams` : `Show all ${league.label} teams`}
              style={styles.showMoreRow}
              hitSlop={8}
            >
              <Ionicons name={showAll ? 'chevron-up' : 'chevron-down'} size={20} color={Colors.textMuted} />
            </Pressable>
          ) : null}
        </>
      )}
    </View>
  );
}

export function TeamPicker({
  leagues,
  initialFavorites,
  onBack,
  onFinish,
  backLabel = 'Back',
}: {
  leagues: League[];
  initialFavorites: Record<string, FavoriteTeam>;
  onBack: () => void;
  onFinish: (favorites: Record<string, FavoriteTeam>) => void;
  /** Onboarding uses this as a wizard "Back" step; opened standalone from
   * Settings there's no previous step, so the caller passes "Cancel" instead. */
  backLabel?: string;
}) {
  const [favorites, setFavorites] = useState<Map<string, FavoriteTeam>>(new Map(Object.entries(initialFavorites)));
  const [query, setQuery] = useState('');
  // Motorsport leagues (drivers, not teams) have nothing to show here — the
  // caller should skip this screen entirely when only motorsport is selected,
  // but filter defensively since this component may be reused elsewhere.
  const teamLeagues = leagues.filter((l) => l.kind === 'team');
  const { width: windowWidth } = useWindowDimensions();
  const tileWidth =
    (windowWidth - Spacing.s4 * 2 - GRID_GAP * (GRID_COLUMNS - 1) - ROW_EDGE_SLACK) / GRID_COLUMNS;
  const trimmedQuery = query.trim().toLowerCase();

  // Stable identity (empty deps — the updater-function form of setFavorites
  // never needs the current `favorites` value in scope) so TeamTile's memo
  // isn't defeated by a new onToggle reference on every render.
  const toggle = useCallback((team: FavoriteTeam) => {
    setFavorites((prev) => {
      const next = new Map(prev);
      const key = favoriteKey(team.leagueId, team.id);
      if (next.has(key)) next.delete(key);
      else next.set(key, team);
      return next;
    });
  }, []);

  // Insertion order (the order teams were favorited), same reasoning as
  // LeaguePicker's selected row — nothing here needs catalog order since a
  // favorite is a flat set, not a grouped one.
  const selectedTeams = useMemo(() => Array.from(favorites.values()), [favorites]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.headerArea}>
        <OnboardingHeader title="Favorite your teams" subtitle="Optional — their games get pinned to the top of your list." />
        {teamLeagues.length > 0 ? (
          <GlassView glassEffectStyle="clear" style={styles.searchRow}>
            <Ionicons name="search" size={18} color={Colors.textMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search teams"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.searchInput}
            />
            {query.length > 0 ? (
              <Pressable onPress={() => setQuery('')} hitSlop={14} accessibilityRole="button" accessibilityLabel="Clear search">
                <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
              </Pressable>
            ) : null}
          </GlassView>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {teamLeagues.length === 0 ? (
          <Text style={styles.muted}>Add a league with teams first, then come back here to pick favorites.</Text>
        ) : (
          teamLeagues.map((league) => (
            <TeamGroup
              key={league.id}
              league={league}
              favorites={favorites}
              onToggle={toggle}
              tileWidth={tileWidth}
              query={trimmedQuery}
            />
          ))
        )}
      </ScrollView>

      <View style={styles.footer}>
        {selectedTeams.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.selectedRow}
            contentContainerStyle={styles.selectedRowContent}
          >
            {selectedTeams.map((team) => (
              <Pressable
                key={favoriteKey(team.leagueId, team.id)}
                onPress={() => toggle(team)}
                hitSlop={4}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${team.name}`}
              >
                {({ pressed }) => (
                  <GlassView
                    glassEffectStyle="clear"
                    isInteractive
                    tintColor={Colors.accent}
                    style={[styles.chip, pressed && styles.pressed]}
                  >
                    <View style={styles.chipLogoBackdrop}>
                      {team.logo ? <Image source={{ uri: team.logo }} style={styles.chipLogo} /> : null}
                    </View>
                    <Text style={styles.chipLabel} numberOfLines={1}>
                      {team.abbreviation ?? team.name}
                    </Text>
                    <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
                  </GlassView>
                )}
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        <View style={styles.actions}>
          <PillButton variant="outline" label={backLabel} onPress={onBack} style={styles.actionBtn} />
          <PillButton label="Done" onPress={() => onFinish(Object.fromEntries(favorites))} style={styles.actionBtn} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerArea: { paddingHorizontal: Spacing.s4, paddingTop: Spacing.s4 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s2,
    minHeight: 44,
    paddingHorizontal: Spacing.s3,
    borderRadius: Radius.sm,
    marginBottom: Spacing.s3,
  },
  searchInput: { flex: 1, color: Colors.text, fontSize: 15, paddingVertical: 0 },
  scrollContent: { padding: Spacing.s4, paddingTop: 0, paddingBottom: Spacing.s6 },
  group: { marginBottom: Spacing.s4 },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s2,
    marginBottom: Spacing.s2,
  },
  groupHeading: {
    color: Colors.textMuted,
    fontSize: 13,
    fontFamily: Fonts.bold,
    fontWeight: '700',
  },
  groupBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupBadgeText: { color: Colors.onAccent, fontSize: 11, fontFamily: Fonts.bold, fontWeight: '700' },
  muted: { color: Colors.textMuted, fontSize: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP },
  showMoreRow: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.s2, minHeight: 44 },
  tile: {
    // Fixed height (not minHeight) so every tile is identical regardless of
    // whether its team name wraps to one line or two — otherwise a row mixes
    // short and long names at different heights. Sized for the worst case
    // (44px logo + gap + a full two-line label + vertical padding) so a long
    // name never clips; short names just leave a little breathing room.
    height: 114,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Explicit lineHeight (not left to the font's default metrics) so the
  // fixed tile height above can budget for exactly two lines without
  // clipping a long team name or leaving slack under a short one.
  tileLabel: { color: Colors.text, fontSize: 12, lineHeight: 15, fontFamily: Fonts.semibold, fontWeight: '600', textAlign: 'center' },
  footer: {
    paddingHorizontal: Spacing.s4,
    paddingTop: Spacing.s3,
    paddingBottom: Spacing.s4,
  },
  // Explicit height on the ScrollView's own style (not just contentContainerStyle)
  // — otherwise a horizontal scroller stretches to fill this flex-column footer.
  // Taller than the 44px chip itself so its Liquid Glass press-bloom isn't
  // clipped by a row sized exactly to the chip's resting height.
  selectedRow: { height: 52, flexGrow: 0, marginBottom: Spacing.s3 },
  selectedRowContent: { gap: Spacing.s2, paddingRight: Spacing.s1 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 44,
    paddingHorizontal: Spacing.s2,
    borderRadius: Radius.pill,
  },
  chipLogoBackdrop: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipLogo: { width: 14, height: 14, resizeMode: 'contain' },
  chipLabel: { color: Colors.text, fontSize: 13, fontFamily: Fonts.bold, fontWeight: '700' },
  actions: {
    flexDirection: 'row',
    gap: Spacing.s2,
  },
  actionBtn: { flex: 1 },
  pressed: { opacity: 0.85 },
});
