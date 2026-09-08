import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassIconButton } from '@/components/GlassIconButton';
import { Colors, Spacing } from '@/constants/theme';
import { Fonts } from '@/constants/fonts';

export type LegalSection = { heading: string; body: string };

// Shared scrollable document shell for Privacy Policy / Terms & Conditions —
// same header pattern (chevron-back + centered title) as the other pushed
// settings screens, so the two legal pages only need to supply their own text.
export function LegalDocument({ title, updated, sections }: { title: string; updated: string; sections: LegalSection[] }) {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <GlassIconButton name="chevron-back" size={20} onPress={() => router.back()} accessibilityLabel="Back to settings" />
        <Text style={styles.headerTitle} numberOfLines={1} accessibilityRole="header">
          {title}
        </Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.updated}>Last updated {updated}</Text>
        {sections.map((section) => (
          <View key={section.heading} style={styles.section}>
            <Text style={styles.sectionHeading} accessibilityRole="header">
              {section.heading}
            </Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.s2,
    paddingVertical: Spacing.s2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerSpacer: { width: 48, height: 48 },
  headerTitle: { flex: 1, textAlign: 'center', color: Colors.text, fontSize: 17, fontFamily: Fonts.bold, fontWeight: '700' },
  scrollContent: { padding: Spacing.s4, paddingBottom: Spacing.s6 },
  updated: { color: Colors.textMuted, fontSize: 12, marginBottom: Spacing.s4 },
  section: { marginBottom: Spacing.s4 },
  sectionHeading: { color: Colors.text, fontSize: 16, fontFamily: Fonts.bold, fontWeight: '700', marginBottom: Spacing.s1 },
  sectionBody: { color: Colors.textMuted, fontSize: 14, lineHeight: 21 },
});
