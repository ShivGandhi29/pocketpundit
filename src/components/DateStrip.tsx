import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/AppText';

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
        <Pressable onPress={() => onSelectDate(addDays(selectedDate, -7))} hitSlop={12} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.monthLabel}>{MONTH_YEAR.format(selectedDate)}</Text>
        <Pressable onPress={() => onSelectDate(addDays(selectedDate, 7))} hitSlop={12} style={styles.navBtn}>
          <Ionicons name="chevron-forward" size={20} color={Colors.text} />
        </Pressable>
        {!isOnToday ? (
          <Pressable
            onPress={() => onSelectDate(today)}
            hitSlop={10}
            accessibilityLabel="Jump to today"
            style={styles.todayBtn}
          >
            <Ionicons name="today-outline" size={20} color={Colors.accent} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.week}>
        {weekDays.map((day) => {
          const selected = isSameLocalDay(day, selectedDate);
          const isToday = isSameLocalDay(day, today);
          return (
            <Pressable key={day.toISOString()} onPress={() => onSelectDate(day)} style={styles.dayCol}>
              <Text style={styles.weekday}>{WEEKDAY.format(day).toUpperCase()}</Text>
              <View style={[styles.dayCircle, selected && styles.dayCircleSelected]}>
                <Text style={[styles.dayNumber, selected && styles.textSelected]}>{day.getDate()}</Text>
              </View>
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
    height: 32,
  },
  navBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  // Absolutely positioned so it doesn't disturb the centered chevron/month
  // group — it only appears once the user has navigated away from today.
  todayBtn: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 32, alignItems: 'center', justifyContent: 'center' },
  monthLabel: { color: Colors.text, fontSize: 16, fontFamily: Fonts.bold, fontWeight: '700', minWidth: 148, textAlign: 'center' },
  week: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center', gap: 4, width: 40 },
  weekday: { color: Colors.textMuted, fontSize: 11, fontFamily: Fonts.bold, fontWeight: '700', letterSpacing: 0.3 },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleSelected: { backgroundColor: Colors.accent },
  dayNumber: { color: Colors.text, fontSize: 15, fontFamily: Fonts.bold, fontWeight: '700' },
  textSelected: { color: Colors.onAccent },
  todayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.accent },
});
