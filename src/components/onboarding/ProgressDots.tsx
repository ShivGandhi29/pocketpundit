import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/AppText';

import { ButtonLabel } from '@/constants/onboardingTheme';
import { Colors, Spacing } from '@/constants/theme';
import { Fonts } from '@/constants/fonts';

// Step indicator for the onboarding flow, extracted out of OnboardingFlow so
// it can carry its own styling pass. The pip row was already pill/circle
// geometry; the caption now uses the same uppercase, wide-tracked voice as
// PillButton for a consistent "systematic label" feel across the flow.
export function ProgressDots({ total, current }: { total: number; current: number }) {
  if (total < 2) return null;
  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[styles.dot, i === current && styles.dotActive]} />
      ))}
      <Text style={styles.label}>
        Step {current + 1} of {total}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: Spacing.s3,
    paddingHorizontal: Spacing.s4,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.border },
  dotActive: { backgroundColor: Colors.accent, width: 18 },
  label: {
    marginLeft: Spacing.s2,
    color: Colors.textMuted,
    fontSize: 11,
    letterSpacing: ButtonLabel.letterSpacing,
    textTransform: ButtonLabel.textTransform,
    fontFamily: Fonts.semibold,
    fontWeight: '600',
  },
});
