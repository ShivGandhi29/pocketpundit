import { useEffect } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Colors, Radius, Spacing } from '@/constants/theme';

// Shared pulse driver so every block on screen breathes in sync, one shared
// value instead of one animation per block. Reduce Motion swaps the pulse for
// a fixed mid-opacity fill — Design Guideline (Motion): don't make repetitive
// automatic animation the only state, and respect the system setting.
//
// `animate` is separate from Reduce Motion: a skeleton used for genuine
// loading should pulse (it's telling someone "this is actively fetching"),
// but the same shape reused as a decorative mockup — e.g. the welcome
// screen's "your feed, at a glance" preview, which never resolves into real
// content — has to stay static. An eternally-pulsing "loading" skeleton
// that's never actually loading reads as broken, not decorative.
function usePulse(animate: boolean) {
  const reducedMotion = useReducedMotion();
  const shouldAnimate = animate && !reducedMotion;
  const opacity = useSharedValue(shouldAnimate ? 0.35 : 0.5);

  useEffect(() => {
    if (!shouldAnimate) return;
    opacity.value = withRepeat(withTiming(0.75, { duration: 700 }), -1, true);
  }, [shouldAnimate, opacity]);

  return useAnimatedStyle(() => ({ opacity: opacity.value }));
}

function SkeletonBlock({ style, pulse }: { style: ViewStyle; pulse: ReturnType<typeof usePulse> }) {
  return <Animated.View style={[styles.block, style, pulse]} />;
}

export function GameCardSkeleton({ animate = true }: { animate?: boolean }) {
  const pulse = usePulse(animate);
  return (
    <View style={styles.card}>
      <SkeletonBlock pulse={pulse} style={styles.headlineTime} />
      <SkeletonBlock pulse={pulse} style={styles.headlineDate} />
      <View style={styles.row}>
        <View style={styles.teamCol}>
          <SkeletonBlock pulse={pulse} style={styles.logo} />
          <SkeletonBlock pulse={pulse} style={styles.abbr} />
        </View>
        <SkeletonBlock pulse={pulse} style={styles.center} />
        <View style={styles.teamCol}>
          <SkeletonBlock pulse={pulse} style={styles.logo} />
          <SkeletonBlock pulse={pulse} style={styles.abbr} />
        </View>
      </View>
    </View>
  );
}

export function GamesListSkeleton({
  count = 4,
  decorative = false,
}: {
  count?: number;
  /** True for a static mockup illustration (e.g. onboarding preview) rather
   * than a real loading state — stops the pulse and drops it out of the
   * accessibility tree instead of announcing a progress bar that never
   * finishes. */
  decorative?: boolean;
}) {
  return (
    <View
      style={styles.list}
      accessibilityElementsHidden={decorative}
      importantForAccessibility={decorative ? 'no-hide-descendants' : 'auto'}
      accessibilityLabel={decorative ? undefined : 'Loading games'}
      accessibilityRole={decorative ? undefined : 'progressbar'}
    >
      {Array.from({ length: count }).map((_, i) => (
        <GameCardSkeleton key={i} animate={!decorative} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { backgroundColor: Colors.textMuted, borderRadius: Radius.sm },
  list: { padding: Spacing.s4, paddingTop: 0, gap: Spacing.s3 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingVertical: Spacing.s3,
    paddingHorizontal: Spacing.s3,
    alignItems: 'center',
  },
  headlineTime: { width: 64, height: 20, marginBottom: 6 },
  headlineDate: { width: 84, height: 12, marginBottom: Spacing.s2 },
  row: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  teamCol: { flex: 1, alignItems: 'center', gap: 6 },
  logo: { width: 36, height: 36, borderRadius: 18 },
  abbr: { width: 40, height: 12 },
  center: { width: 24, height: 12 },
});
