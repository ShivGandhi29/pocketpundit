import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassIconButton } from '@/components/GlassIconButton';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { Fonts } from '@/constants/fonts';

const APP_VERSION = '1.0.0'; // keep in sync with the "version" field in app.json

function SettingsRow({
  icon,
  label,
  onPress,
  isLast,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  isLast?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.row, !isLast && styles.rowDivider, pressed && styles.rowPressed]}
    >
      <View style={styles.rowIconWrap}>
        <Ionicons name={icon} size={18} color={Colors.text} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
    </Pressable>
  );
}

export default function SettingsHome() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <GlassIconButton name="close" size={18} onPress={() => router.back()} accessibilityLabel="Close settings" />
        <Text style={styles.headerTitle} accessibilityRole="header">
          Settings
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.groupHeading} accessibilityRole="header">
          Preferences
        </Text>
        <View style={styles.group}>
          <SettingsRow icon="trophy-outline" label="Leagues & Teams" onPress={() => router.push('/settings/leagues')} isLast />
        </View>

        <Text style={styles.groupHeading} accessibilityRole="header">
          Legal
        </Text>
        <View style={styles.group}>
          <SettingsRow icon="shield-checkmark-outline" label="Privacy Policy" onPress={() => router.push('/settings/privacy')} />
          <SettingsRow icon="document-text-outline" label="Terms & Conditions" onPress={() => router.push('/settings/terms')} isLast />
        </View>

        {__DEV__ ? (
          <>
            <Text style={styles.groupHeading} accessibilityRole="header">
              Developer
            </Text>
            <View style={styles.group}>
              <SettingsRow
                icon="eye-outline"
                label="Preview Welcome Screen"
                onPress={() => router.push('/settings/dev-welcome-preview')}
                isLast
              />
            </View>
          </>
        ) : null}

        <Text style={styles.version}>PocketPundit v{APP_VERSION}</Text>
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
  },
  headerSpacer: { width: 48, height: 48 },
  headerTitle: { color: Colors.text, fontSize: 20, fontFamily: Fonts.bold, fontWeight: '700' },
  scrollContent: { padding: Spacing.s4, paddingTop: Spacing.s2 },
  groupHeading: {
    color: Colors.textMuted,
    fontSize: 13,
    fontFamily: Fonts.bold,
    fontWeight: '700',
    marginBottom: Spacing.s2,
    marginTop: Spacing.s4,
  },
  group: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s3,
    minHeight: 52,
    paddingHorizontal: Spacing.s3,
  },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowPressed: { backgroundColor: Colors.surfaceRaised },
  rowIconWrap: { width: 24, alignItems: 'center' },
  rowLabel: { flex: 1, color: Colors.text, fontSize: 15, fontFamily: Fonts.semibold, fontWeight: '600' },
  version: { color: Colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: Spacing.s5 },
});
