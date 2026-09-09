import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/AppText';

import { PillButton } from '@/components/onboarding/PillButton';
import { GamesListSkeleton } from '@/components/Skeleton';
import { Colors, Spacing } from '@/constants/theme';
import { Fonts } from '@/constants/fonts';
import type { League } from '@/types/huddl';

// First screen of onboarding — a hero intro before the leagues/teams
// pickers, in the spirit of a dedicated sports app's welcome screen: brand
// mark, a glimpse of the league catalog, one clear next action. The
// "featured games" preview below is intentionally a decorative skeleton
// rather than fabricated scores — nothing real to show yet at this point in
// onboarding, and a static mock game would misrepresent live data.
export function WelcomeScreen({ leagues, onGetStarted }: { leagues: League[]; onGetStarted: () => void }) {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <Text style={styles.brand} accessibilityRole="header">
        Huddl
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow} contentContainerStyle={styles.chipsContent}>
        {leagues.map((league) => (
          <View key={league.id} style={styles.chip}>
            <Image source={{ uri: league.logo }} style={styles.chipLogo} />
          </View>
        ))}
      </ScrollView>

      <View style={styles.heroText}>
        <Text style={styles.tagline}>Pick your leagues and favorite teams to build a feed that's actually yours.</Text>
        <PillButton label="Get Started" onPress={onGetStarted} style={styles.getStarted} />
      </View>

      <View style={styles.preview}>
        <Text style={styles.previewLabel}>Your feed, at a glance</Text>
        <GamesListSkeleton count={3} decorative />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, paddingTop: Spacing.s5, paddingBottom: Spacing.s6 },
  brand: {
    color: Colors.text,
    fontSize: 26,
    fontFamily: Fonts.extrabold,
    fontWeight: '800',
    letterSpacing: -0.4,
    paddingHorizontal: Spacing.s4,
    marginBottom: Spacing.s4,
  },
  chipsRow: { flexGrow: 0, marginBottom: Spacing.s5 },
  chipsContent: { gap: Spacing.s2, paddingHorizontal: Spacing.s4 },
  chip: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipLogo: { width: 30, height: 30, resizeMode: 'contain' },
  heroText: { paddingHorizontal: Spacing.s4, marginBottom: Spacing.s6, gap: Spacing.s4 },
  tagline: { color: Colors.text, fontSize: 22, fontFamily: Fonts.bold, fontWeight: '700', lineHeight: 29, textAlign: 'center' },
  getStarted: { alignSelf: 'center', minWidth: 200 },
  preview: { paddingTop: Spacing.s3, borderTopWidth: 1, borderTopColor: Colors.border },
  previewLabel: {
    color: Colors.textMuted,
    fontSize: 13,
    fontFamily: Fonts.semibold,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.s3,
  },
});
