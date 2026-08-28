import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/AppText';
import { GlassView } from 'expo-glass-effect';

import { GlassIconButton } from '@/components/GlassIconButton';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { Fonts } from '@/constants/fonts';
import { addDays, dateWithOffset, isSameLocalDay } from '@/utils/formatGameTime';

const WEEKDAY = new Intl.DateTimeFormat(undefined, { weekday: 'short' });
const MONTH_YEAR = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' });

export function DateStrip({
  selectedDate,
  onSelectDate,
}: {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}) {
  const today = useMemo(() => dateWithOffset(0), []);
  const isOnToday = isSameLocalDay(selectedDate, today);

  // A fixed Sun-Sat week containing the selected day, calendar-grid style —
  // the chevrons page a week at a time and land on the same weekday, rather
  // than free-scrolling through an arbitrary rolling window of dates.
  const weekDays = useMemo(() => {
    const weekStart = addDays(selectedDate, -selectedDate.getDay());
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [selectedDate]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <GlassIconButton
          name="chevron-back"
          size={20}
          onPress={() => onSelectDate(addDays(selectedDate, -7))}
          accessibilityLabel="Previous week"
          hitSlop={8}
        />
        <Text style={styles.monthLabel}>{MONTH_YEAR.format(selectedDate)}</Text>
        <GlassIconButton
          name="chevron-forward"
          size={20}
          onPress={() => onSelectDate(addDays(selectedDate, 7))}
          accessibilityLabel="Next week"
          hitSlop={8}
        />
        {!isOnToday ? (
          <View style={styles.todayBtn}>
            <GlassIconButton
              name="today-outline"
              size={18}
              color={Colors.accent}
              onPress={() => onSelectDate(today)}
              accessibilityLabel="Jump to today"
              hitSlop={8}
            />
          </View>
        ) : null}
      </View>

      <View style={styles.week}>
        {weekDays.map((day) => {
          const selected = isSameLocalDay(day, selectedDate);
          const isToday = isSameLocalDay(day, today);
          return (
            <Pressable key={day.toISOString()} onPress={() => onSelectDate(day)} style={styles.dayCol}>
              <Text style={styles.weekday}>{WEEKDAY.format(day).toUpperCase()}</Text>
              <GlassView
                glassEffectStyle="regular"
                isInteractive
                tintColor={selected ? Colors.accent : undefined}
                style={styles.dayCircle}
              >
                <Text style={[styles.dayNumber, selected && styles.textSelected]}>{day.getDate()}</Text>
              </GlassView>
              {/* Fixed-size View with toggled opacity, not a toggled text
                  glyph — a dot swapped in via text content measures a
                  different line-height than its siblings and shifts layout. */}
              <View style={[styles.todayDot, { opacity: isToday ? 1 : 0 }]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.s4,
    paddingVertical: Spacing.s2,
    gap: Spacing.s2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.s3,
    // Tall enough for GlassIconButton's 48px touch area, not just its 40px
    // resting glass circle — a box sized to the circle clips the Liquid
    // Glass press-bloom animation at the top/bottom edges.
    height: 48,
  },
  // Absolutely positioned so it doesn't disturb the centered chevron/month
  // group — it only appears once the user has navigated away from today.
  todayBtn: { position: 'absolute', right: 0, top: 0, bottom: 0, justifyContent: 'center' },
  monthLabel: { color: Colors.text, fontSize: 16, fontFamily: Fonts.bold, fontWeight: '700', minWidth: 148, textAlign: 'center' },
  week: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center', gap: 4, width: 42 },
  weekday: { color: Colors.textMuted, fontSize: 11, fontFamily: Fonts.bold, fontWeight: '700', letterSpacing: 0.3 },
  // Bigger than the day number strictly needs — the glass element's own
  // bounds clip its interactive press-bloom, so it needs headroom around its
  // content rather than being sized tightly to it.
  dayCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: { color: Colors.text, fontSize: 15, fontFamily: Fonts.bold, fontWeight: '700' },
  textSelected: { color: Colors.onAccent },
  todayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.accent },
});
