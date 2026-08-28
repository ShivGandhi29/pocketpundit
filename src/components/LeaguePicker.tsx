import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, TextInput, View, useWindowDimensions } from 'react-native';
import { Text } from '@/components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { Fonts } from '@/constants/fonts';
import type { League } from '@/types/pocketpundit';

const GRID_COLUMNS = 3;
const GRID_GAP = Spacing.s2;

// Fixed display order (not alphabetical) — major North American leagues
// first since they're the most-searched-for, soccer grouped together since
// it's the deepest catalog, motorsport last since it's structurally the
// most different from the rest.
const SPORT_ORDER: League['sport'][] = [
  'football',
  'basketball',
  'baseball',
  'hockey',
  'soccer',
  'australian-football',
  'rugby',
  'golf',
  'motorsport',
];
const SPORT_LABELS: Record<League['sport'], string> = {
  football: 'American Football',
  basketball: 'Basketball',
  baseball: 'Baseball',
  hockey: 'Hockey',
  soccer: 'Soccer',
  'australian-football': 'Australian Football',
  rugby: 'Rugby',
  golf: 'Golf',
  motorsport: 'Motorsport',
};

export function LeaguePicker({
  leagues,
  preselected,
  onContinue,
}: {
  leagues: League[];
  preselected: string[];
  onContinue: (selectedIds: string[]) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(preselected));
  const [query, setQuery] = useState('');
  // Percentage widths don't account for `gap` in React Native's flexbox, so
  // a naive "100/3 %" tile silently wraps to 2-per-row once the gaps eat into
  // the remaining space. Computing the exact pixel width against the window
  // (minus the container's own horizontal padding) guarantees 3 columns fit.
  const { width: windowWidth } = useWindowDimensions();
  const tileWidth = (windowWidth - Spacing.s4 * 2 - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Pure client-side filter over the in-memory league list — no network
  // request involved at all, so there's no per-keystroke API call to worry
  // about debouncing. Shows the full catalog by default; typing narrows it.
  const visibleLeagues = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return leagues;
    return leagues.filter((l) => l.label.toLowerCase().includes(trimmed));
  }, [leagues, query]);

  // Catalog order (not selection order) so the row doesn't reshuffle as the
  // user taps leagues on and off.
  const selectedLeagues = useMemo(() => leagues.filter((l) => selected.has(l.id)), [leagues, selected]);

  const groupedLeagues = useMemo(() => {
    return SPORT_ORDER.map((sport) => ({
      sport,
      leagues: visibleLeagues.filter((l) => l.sport === sport),
    })).filter((group) => group.leagues.length > 0);
  }, [visibleLeagues]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Text style={styles.title}>Pick your leagues</Text>
      <Text style={styles.subtitle}>Only matchups from these leagues will show up in your feed.</Text>

      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={Colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search leagues"
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.searchInput}
        />
        {query.length > 0 ? (
          <Pressable onPress={() => setQuery('')} hitSlop={14}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {visibleLeagues.length === 0 ? (
          <Text style={styles.empty}>No leagues match “{query}”.</Text>
        ) : (
          groupedLeagues.map((group) => (
            <View key={group.sport} style={styles.sportGroup}>
              <Text style={styles.sportHeading}>{SPORT_LABELS[group.sport]}</Text>
              <View style={styles.grid}>
                {group.leagues.map((league) => {
                  const checked = selected.has(league.id);
                  return (
                    <Pressable
                      key={league.id}
                      onPress={() => toggle(league.id)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: checked }}
                      style={({ pressed }) => [
                        styles.tile,
                        { width: tileWidth },
                        checked && styles.tileChecked,
                        pressed && styles.pressed,
                      ]}
                    >
                      <View style={styles.tileLogoWrap}>
                        <View style={styles.tileLogoBackdrop}>
                          <Image source={{ uri: league.logo }} style={styles.tileLogo} />
                        </View>
                        {checked ? (
                          <View style={styles.tileCheckBadge}>
                            <Ionicons name="checkmark" size={11} color={Colors.onAccent} />
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.tileLabel} numberOfLines={2}>
                        {league.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.footer}>
        {selectedLeagues.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.selectedRow}
            contentContainerStyle={styles.selectedRowContent}
          >
            {selectedLeagues.map((league) => (
              <Pressable
                key={league.id}
                onPress={() => toggle(league.id)}
                hitSlop={4}
                style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
              >
                <View style={styles.chipLogoBackdrop}>
                  <Image source={{ uri: league.logo }} style={styles.chipLogo} />
                </View>
                <Text style={styles.chipLabel} numberOfLines={1}>
                  {league.shortLabel}
                </Text>
                <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        <Pressable
          disabled={selected.size === 0}
          onPress={() => onContinue(Array.from(selected))}
          style={({ pressed }) => [
            styles.continueBtn,
            selected.size === 0 && styles.continueBtnDisabled,
            pressed && selected.size > 0 && styles.pressed,
          ]}
        >
          <Text style={styles.continueBtnText}>
            {selected.size === 0 ? 'Continue' : `Continue (${selected.size})`}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.s4 },
  title: { color: Colors.text, fontSize: 26, fontFamily: Fonts.bold, fontWeight: '700', letterSpacing: -0.4, marginBottom: Spacing.s1 },
  subtitle: { color: Colors.textMuted, fontSize: 15, marginBottom: Spacing.s3 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s2,
    minHeight: 44,
    paddingHorizontal: Spacing.s3,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    marginBottom: Spacing.s3,
  },
  searchInput: { flex: 1, color: Colors.text, fontSize: 15, paddingVertical: 0 },
  scrollContent: { paddingBottom: Spacing.s6 },
  empty: { color: Colors.textMuted, fontSize: 14, textAlign: 'center', paddingVertical: Spacing.s4 },
  sportGroup: { marginBottom: Spacing.s4 },
  sportHeading: {
    color: Colors.textMuted,
    fontSize: 13,
    fontFamily: Fonts.bold, fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: Spacing.s2,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP },
  tile: {
    minHeight: 96,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.s2,
    paddingVertical: Spacing.s3,
    paddingHorizontal: Spacing.s1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
  },
  tileChecked: { borderColor: Colors.accent, backgroundColor: Colors.surfaceRaised },
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
  tileLabel: { color: Colors.text, fontSize: 12, fontFamily: Fonts.bold, fontWeight: '700', textAlign: 'center' },
  footer: {
    paddingTop: Spacing.s3,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  // Explicit height on the ScrollView's own style (not just contentContainerStyle)
  // — otherwise a horizontal scroller stretches to fill this flex-column footer.
  selectedRow: { height: 44, flexGrow: 0, marginBottom: Spacing.s3 },
  selectedRowContent: { gap: Spacing.s2, paddingRight: Spacing.s1 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 44,
    paddingHorizontal: Spacing.s2,
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.accent,
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
  continueBtn: {
    minHeight: 48,
    borderRadius: Radius.sm,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnDisabled: { opacity: 0.4 },
  continueBtnText: { color: Colors.onAccent, fontFamily: Fonts.bold, fontWeight: '700', fontSize: 15 },
  pressed: { opacity: 0.85 },
});
