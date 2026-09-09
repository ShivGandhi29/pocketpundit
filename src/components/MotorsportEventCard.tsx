import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/AppText';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { Fonts } from '@/constants/fonts';
import { formatKickoffTime } from '@/utils/formatGameTime';
import { teamGradientColor } from '@/utils/teamGradient';
import type { MotorsportEvent } from '@/types/huddl';

const RANGE_FORMAT = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });

type WeekendState = 'pre' | 'live' | 'past';

function weekendState(event: MotorsportEvent): WeekendState {
  const now = Date.now();
  const start = new Date(event.date).getTime();
  const end = new Date(event.endDate).getTime();
  if (now < start) return 'pre';
  if (now <= end) return 'live';
  return 'past';
}

// Memoized with a stable `onOpen` callback expected from the caller (see
// MatchupsScreen's useCallback) — same reasoning as GameCard.
export const MotorsportEventCard = memo(function MotorsportEventCard({
  event,
  onOpen,
  featured = false,
}: {
  event: MotorsportEvent;
  onOpen: (event: MotorsportEvent) => void;
  /** The "Next Race" card — roughly double-sized so it reads as the one
   * thing on this screen you actually came here for. */
  featured?: boolean;
}) {
  const state = weekendState(event);
  const dateRange = `${RANGE_FORMAT.format(new Date(event.date))} – ${RANGE_FORMAT.format(new Date(event.endDate))}`;
  const label = [
    event.countryName ? `Round ${event.round}, ${event.countryName}` : event.name,
    state === 'past' ? `completed, ${dateRange}` : state === 'live' ? `live now, ${dateRange}` : `${dateRange}, starts ${formatKickoffTime(event.date)}`,
  ].join(', ');

  // Same idea as GameCard's two-team gradient split — a color wash fading
  // into the card's own dark surface — but with one subject instead of two,
  // since a race weekend doesn't have "sides." Upcoming glows accent green,
  // live glows red (this app's live-state color everywhere else), and a
  // completed weekend stays flat so it visually recedes behind what's next.
  const washColor = state === 'live' ? Colors.live : state === 'pre' ? Colors.accent : null;
  const gradientColors: [string, string] = washColor
    ? [teamGradientColor(washColor), Colors.surface]
    : [Colors.surface, Colors.surface];

  return (
    <Pressable
      onPress={() => onOpen(event)}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.card, featured && styles.cardFeatured]}
      >
        {featured && state === 'pre' ? (
          <View style={styles.nextBadge}>
            <Text style={styles.nextBadgeText}>Next</Text>
          </View>
        ) : null}

        {event.countryName ? (
          <View style={styles.roundRow}>
            {event.countryFlag ? (
              <Image
                source={{ uri: event.countryFlag }}
                style={[styles.flag, featured && styles.flagFeatured]}
                contentFit="cover"
                accessibilityElementsHidden
                importantForAccessibility="no"
              />
            ) : null}
            <Text style={[styles.roundLabel, featured && styles.roundLabelFeatured]}>Round {event.round}</Text>
          </View>
        ) : null}

        {event.countryName ? (
          <Text style={[styles.country, featured && styles.countryFeatured]} numberOfLines={1}>
            {event.countryName}
          </Text>
        ) : null}

        {state === 'pre' ? (
          <>
            <Text style={[styles.headlineTime, featured && styles.headlineTimeFeatured]}>{formatKickoffTime(event.date)}</Text>
            <Text style={[styles.headlineDate, featured && styles.headlineDateFeatured]}>{dateRange}</Text>
          </>
        ) : (
          <Text
            style={[styles.headlineStatus, featured && styles.headlineStatusFeatured, state === 'live' && styles.headlineStatusLive]}
            numberOfLines={1}
          >
            {state === 'live' ? `Live · ${dateRange}` : `Completed · ${dateRange}`}
          </Text>
        )}
        <Text style={[styles.name, featured && styles.nameFeatured]} numberOfLines={2}>
          {event.name}
        </Text>
      </LinearGradient>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.md,
    paddingVertical: Spacing.s3,
    paddingHorizontal: Spacing.s3,
    alignItems: 'center',
  },
  // Roughly double the resting card's footprint — bigger padding plus
  // bigger type, not a literal 2x on every metric (a doubled caption would
  // look broken, not premium).
  cardFeatured: {
    paddingVertical: Spacing.s6,
    paddingHorizontal: Spacing.s5,
  },
  pressed: { opacity: 0.85 },
  nextBadge: {
    position: 'absolute',
    top: Spacing.s4,
    right: Spacing.s4,
    backgroundColor: Colors.accent,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.s3,
    paddingVertical: 4,
  },
  nextBadgeText: { color: Colors.onAccent, fontSize: 12, fontFamily: Fonts.bold, fontWeight: '700' },
  roundRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  flag: { width: 16, height: 11, borderRadius: 2 },
  flagFeatured: { width: 20, height: 14, borderRadius: 3 },
  roundLabel: { color: Colors.textMuted, fontSize: 12, fontFamily: Fonts.semibold, fontWeight: '600' },
  roundLabelFeatured: { fontSize: 14 },
  country: { color: Colors.text, fontSize: 20, fontFamily: Fonts.extrabold, fontWeight: '800', letterSpacing: -0.3, marginBottom: Spacing.s2 },
  countryFeatured: { fontSize: 34, marginBottom: Spacing.s3 },
  headlineTime: { color: Colors.text, fontSize: 22, fontFamily: Fonts.extrabold, fontWeight: '800', letterSpacing: -0.3 },
  headlineTimeFeatured: { fontSize: 40 },
  headlineDate: {
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: Fonts.semibold,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: Spacing.s2,
  },
  headlineDateFeatured: { fontSize: 15, marginBottom: Spacing.s3 },
  headlineStatus: {
    color: Colors.textMuted,
    fontSize: 13,
    fontFamily: Fonts.bold,
    fontWeight: '700',
    marginBottom: Spacing.s2,
    textAlign: 'center',
  },
  headlineStatusFeatured: { fontSize: 20, marginBottom: Spacing.s3 },
  headlineStatusLive: { color: Colors.live },
  name: { color: Colors.textMuted, fontSize: 13, fontFamily: Fonts.semibold, fontWeight: '600', textAlign: 'center' },
  nameFeatured: { fontSize: 16 },
});
