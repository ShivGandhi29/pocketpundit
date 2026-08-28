import { FlatList, Pressable, StyleSheet } from 'react-native';
import { Text } from '@/components/AppText';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { Fonts } from '@/constants/fonts';
import type { SeasonWeek } from '@/types/pocketpundit';

const MONTH_DAY = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });

export function WeekStrip({
  weeks,
  selectedIndex,
  onSelect,
}: {
  weeks: SeasonWeek[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <FlatList
      style={styles.listContainer}
      horizontal
      data={weeks}
      keyExtractor={(w, i) => `${w.seasonTypeValue}-${w.weekValue}-${i}`}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.list}
      initialScrollIndex={Math.max(0, selectedIndex - 2)}
      getItemLayout={(_, index) => ({ length: 88, offset: 88 * index, index })}
      renderItem={({ item, index }) => {
        const selected = index === selectedIndex;
        return (
          <Pressable onPress={() => onSelect(index)} style={[styles.pill, selected && styles.pillSelected]}>
            <Text style={[styles.weekLabel, selected && styles.textSelected]} numberOfLines={1}>
              {item.shortLabel}
            </Text>
            <Text style={[styles.weekDate, selected && styles.textSelected]} numberOfLines={1}>
              {MONTH_DAY.format(new Date(item.startDate))}
            </Text>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  // See DateStrip.tsx for why this needs an explicit height — a horizontal
  // FlatList doesn't self-size on the cross axis and stretches to fill the
  // flex column otherwise.
  listContainer: { flexGrow: 0, height: 84 },
  list: { gap: Spacing.s2, paddingHorizontal: Spacing.s4, paddingVertical: Spacing.s2 },
  pill: {
    width: 80,
    paddingVertical: Spacing.s2,
    paddingHorizontal: Spacing.s1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: 2,
  },
  pillSelected: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  weekLabel: { color: Colors.text, fontSize: 13, fontFamily: Fonts.bold, fontWeight: '700', textAlign: 'center' },
  weekDate: { color: Colors.textMuted, fontSize: 11, fontFamily: Fonts.semibold, fontWeight: '600', textAlign: 'center' },
  textSelected: { color: Colors.onAccent },
});
