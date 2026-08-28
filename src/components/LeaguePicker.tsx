import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Radius, Spacing } from '@/constants/theme';
import type { League } from '@/types/pocketpundit';

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
  // about debouncing. With the empty query, only the curated "popular"
  // leagues show; typing searches the full catalog by name.
  const visibleLeagues = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return leagues.filter((l) => l.popular);
    return leagues.filter((l) => l.label.toLowerCase().includes(trimmed));
  }, [leagues, query]);

  // Catalog order (not selection order) so the row doesn't reshuffle as the
  // user taps leagues on and off.
  const selectedLeagues = useMemo(() => leagues.filter((l) => selected.has(l.id)), [leagues, selected]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Text style={styles.title}>Pick your leagues</Text>
      <Text style={styles.subtitle}>Only matchups from these leagues will show up in your feed.</Text>

      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={Colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search for more leagues"
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
        <View style={styles.list}>
          {visibleLeagues.length === 0 ? (
            <Text style={styles.empty}>No leagues match “{query}”.</Text>
          ) : (
            visibleLeagues.map((league) => {
              const checked = selected.has(league.id);
              return (
                <Pressable
                  key={league.id}
                  onPress={() => toggle(league.id)}
                  style={({ pressed }) => [styles.row, checked && styles.rowChecked, pressed && styles.pressed]}
                >
                  <Image source={{ uri: league.logo }} style={styles.rowLogo} />
                  <Text style={styles.rowLabel}>{league.label}</Text>
                  <View style={[styles.checkbox, checked && styles.checkboxChecked]} />
                </Pressable>
              );
            })
          )}
        </View>
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
  title: { color: Colors.text, fontSize: 26, fontWeight: '700', letterSpacing: -0.4, marginBottom: Spacing.s1 },
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
  list: { gap: Spacing.s2 },
  empty: { color: Colors.textMuted, fontSize: 14, textAlign: 'center', paddingVertical: Spacing.s4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s3,
    minHeight: 56,
    paddingHorizontal: Spacing.s3,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
  },
  rowChecked: { borderColor: Colors.accent, backgroundColor: Colors.surfaceRaised },
  rowLogo: { width: 26, height: 26, resizeMode: 'contain' },
  rowLabel: { flex: 1, color: Colors.text, fontSize: 16, fontWeight: '600' },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Colors.border },
  checkboxChecked: { borderColor: Colors.accent, backgroundColor: Colors.accent },
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
  chipLabel: { color: Colors.text, fontSize: 13, fontWeight: '700' },
  continueBtn: {
    minHeight: 48,
    borderRadius: Radius.sm,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnDisabled: { opacity: 0.4 },
  continueBtnText: { color: Colors.onAccent, fontWeight: '700', fontSize: 15 },
  pressed: { opacity: 0.85 },
});
