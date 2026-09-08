import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/AppText';

import { Colors, Spacing } from '@/constants/theme';
import { Fonts } from '@/constants/fonts';

// Shared title block for each onboarding step. Size/weight/tracking follow
// the Spotify-inspired "Section Title" style (24px/700, normal tracking) —
// see src/constants/onboardingTheme.ts.
export function OnboardingHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.s3 },
  title: { color: Colors.text, fontSize: 24, fontFamily: Fonts.bold, fontWeight: '700', marginBottom: Spacing.s1 },
  subtitle: { color: Colors.textMuted, fontSize: 15, lineHeight: 21 },
});
