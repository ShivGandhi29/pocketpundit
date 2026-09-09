import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/AppText';

import { Colors, Spacing } from '@/constants/theme';
import { Fonts } from '@/constants/fonts';

export type CalendarMode = 'yesterday' | 'today' | 'upcoming';

const MODES: { id: CalendarMode; label: string }[] = [
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'today', label: 'Today' },
  { id: 'upcoming', label: 'Upcoming' },
];

// Apple Sports (see apple.com/newsroom, Feb 2024) replaces a per-day
// calendar grid with exactly three relative buckets: what just finished,
// what's on right now, and what's next — not an arbitrary date picker.
// The active segment is marked by its text turning accent-colored, not a
// filled pill behind it — no chrome around any of the three, so the row
// never reads as three separate buttons/circles sitting side by side.
export function DateStrip({ mode, onSelectMode }: { mode: CalendarMode; onSelectMode: (mode: CalendarMode) => void }) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {MODES.map((m) => {
          const selected = m.id === mode;
          return (
            <Pressable
              key={m.id}
              onPress={() => onSelectMode(m.id)}
              accessibilityRole="tab"
              accessibilityLabel={m.label}
              accessibilityState={{ selected }}
              style={styles.segmentFlex}
            >
              <View style={styles.segment}>
                <Text style={[styles.label, selected && styles.labelSelected]}>{m.label}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: Spacing.s4, paddingVertical: Spacing.s2 },
  row: { flexDirection: 'row', gap: Spacing.s2 },
  segmentFlex: { flex: 1 },
  segment: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  label: { color: Colors.textMuted, fontSize: 14, fontFamily: Fonts.bold, fontWeight: '700' },
  labelSelected: { color: Colors.accent },
});
