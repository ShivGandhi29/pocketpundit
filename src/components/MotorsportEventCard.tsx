import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { formatLocalKickoff } from '@/utils/formatGameTime';
import type { MotorsportEvent } from '@/types/pocketpundit';

const RANGE_FORMAT = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });

export function MotorsportEventCard({ event, onPress }: { event: MotorsportEvent; onPress: () => void }) {
  const isPast = new Date(event.endDate).getTime() < Date.now();
  const dateRange = `${RANGE_FORMAT.format(new Date(event.date))} – ${RANGE_FORMAT.format(new Date(event.endDate))}`;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.info}>
        <Text style={[styles.status, isPast && styles.statusPast]}>{isPast ? 'COMPLETED' : dateRange}</Text>
        <Text style={styles.name} numberOfLines={2}>
          {event.name}
        </Text>
        {!isPast ? <Text style={styles.detail}>First session {formatLocalKickoff(event.date)}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s2,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.s3,
  },
  pressed: { opacity: 0.85 },
  info: { flex: 1, gap: 2 },
  status: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: Colors.textMuted,
  },
  statusPast: { color: Colors.accent },
  name: { color: Colors.text, fontSize: 16, fontWeight: '700' },
  detail: { color: Colors.textMuted, fontSize: 12 },
});
