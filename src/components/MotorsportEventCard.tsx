import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/AppText';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { Fonts } from '@/constants/fonts';
import { FLAG_COLORS, US_STATE_FLAG_COLORS } from '@/constants/flagColors';
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
    event.locationName ? `Round ${event.round}, ${event.locationName}` : event.name,
    state === 'past' ? `completed, ${dateRange}` : state === 'live' ? `live now, ${dateRange}` : `${dateRange}, starts ${formatKickoffTime(event.date)}`,
  ].join(', ');

  // Live always glows this app's live-state red, and a completed weekend
  // stays flat so it visually recedes behind what's next — unchanged. An
  // upcoming race with a derived location gets a genuine two-tone gradient
  // instead of one generic accent wash fading to gray: a real national flag
  // for F1, or — new — a US state flag for NASCAR when the event names one
  // ("... at Kansas"). Both run through the same contrast-safe blend
  // GameCard's team-color split uses. A NASCAR race named after a city or
  // track ("at Bristol") has no flag in either table, so it falls back to
  // the plain accent wash rather than guessing a color.
  const flagColors = event.locationName ? (FLAG_COLORS[event.locationName] ?? US_STATE_FLAG_COLORS[event.locationName]) : undefined;
  const gradientColors: [string, string] =
    state === 'live'
      ? [teamGradientColor(Colors.live), Colors.surface]
      : state === 'pre'
        ? flagColors
          ? [teamGradientColor(flagColors[0]), teamGradientColor(flagColors[1])]
          : [teamGradientColor(Colors.accent), Colors.surface]
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

        {event.locationName ? (
          <View style={styles.roundRow}>
            {/* Only ever a real national flag (F1) — NASCAR's US-state
                locations get a color gradient, not a fabricated flag icon. */}
            {event.locationFlag ? (
              <Image
                source={{ uri: event.locationFlag }}
                style={[styles.flag, featured && styles.flagFeatured]}
                contentFit="cover"
                accessibilityElementsHidden
                importantForAccessibility="no"
              />
            ) : null}
            <Text style={[styles.roundLabel, featured && styles.roundLabelFeatured]}>Round {event.round}</Text>
          </View>
        ) : null}

        {/* A derived location exists for F1 ("Spanish Grand Prix" → "Spain")
            and for NASCAR when its own event name trails off with "at
            {place}" ("... at Kansas" → "Kansas") — see deriveLocation in
            api.ts. Golf and events matching neither pattern ("Daytona 500")
            have nothing to put here, so the event's own name takes the
            heading spot instead of being stuck in a small caption below the
            time — that name is the only identifying info those have. */}
        <Text
          style={[styles.location, featured && styles.locationFeatured]}
          numberOfLines={event.locationName ? 1 : 2}
        >
          {event.locationName ?? event.name}
        </Text>

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
        {event.locationName ? (
          <Text style={[styles.name, featured && styles.nameFeatured]} numberOfLines={2}>
            {event.name}
          </Text>
        ) : null}
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
  location: { color: Colors.text, fontSize: 20, fontFamily: Fonts.extrabold, fontWeight: '800', letterSpacing: -0.3, marginBottom: Spacing.s2 },
  locationFeatured: { fontSize: 34, marginBottom: Spacing.s3 },
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
