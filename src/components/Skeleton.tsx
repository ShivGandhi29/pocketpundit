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
function usePulse() {
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(reducedMotion ? 0.6 : 0.35);

  useEffect(() => {
    if (reducedMotion) return;
    opacity.value = withRepeat(withTiming(0.75, { duration: 700 }), -1, true);
  }, [reducedMotion, opacity]);

  return useAnimatedStyle(() => ({ opacity: opacity.value }));
}

function SkeletonBlock({ style, pulse }: { style: ViewStyle; pulse: ReturnType<typeof usePulse> }) {
  return <Animated.View style={[styles.block, style, pulse]} />;
}

export function GameCardSkeleton() {
  const pulse = usePulse();
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

export function GamesListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View style={styles.list} accessibilityLabel="Loading games" accessibilityRole="progressbar">
      {Array.from({ length: count }).map((_, i) => (
        <GameCardSkeleton key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { backgroundColor: Colors.textMuted, borderRadius: Radius.sm },
  list: { padding: Spacing.s4, paddingTop: 0, gap: Spacing.s3 },
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
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
