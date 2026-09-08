import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/AppText';
import { GlassView } from 'expo-glass-effect';

import { Colors, Radius, Spacing } from '@/constants/theme';
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
// Segment styling follows the same "N glass pills in a row, selected one
// tinted" pattern already used for the league tabs and stat tabs elsewhere
// in this app, rather than a from-scratch sliding-thumb segmented control.
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
              <GlassView
                glassEffectStyle="regular"
                isInteractive
                tintColor={selected ? Colors.accent : undefined}
                style={[
                  styles.segment,
                  // GlassView's tintColor is iOS-only — Android/web drop it
                  // silently and fall back to a plain transparent View, so
                  // the accent fill needs an explicit non-iOS fallback.
                  selected && Platform.OS !== 'ios' && styles.segmentSelectedFallback,
                ]}
              >
                <Text style={[styles.label, selected && styles.labelSelected]}>{m.label}</Text>
              </GlassView>
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
  segment: { minHeight: 44, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  segmentSelectedFallback: { backgroundColor: Colors.accent },
  label: { color: Colors.text, fontSize: 14, fontFamily: Fonts.bold, fontWeight: '700' },
  labelSelected: { color: Colors.onAccent },
});
