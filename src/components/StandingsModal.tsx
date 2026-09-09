import { GlassView } from 'expo-glass-effect';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getStandings } from '@/services/api';
import { GlassIconButton } from '@/components/GlassIconButton';
import { GroupTable } from '@/components/StandingsGroupTable';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { Fonts } from '@/constants/fonts';
import type { StandingsGroup } from '@/types/huddl';

export function StandingsModal({
  visible,
  leagueId,
  leagueLabel,
  onClose,
}: {
  visible: boolean;
  leagueId: string;
  leagueLabel: string;
  onClose: () => void;
}) {
  const [groups, setGroups] = useState<StandingsGroup[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setGroups(null);
    setError(null);
    setActiveGroupId(null);
    getStandings(leagueId)
      .then((result) => {
        if (!cancelled) setGroups(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load standings');
      });
    return () => {
      cancelled = true;
    };
  }, [visible, leagueId]);

  const visibleGroups = useMemo(() => {
    if (!groups) return [];
    if (!activeGroupId) return groups;
    return groups.filter((g) => g.id === activeGroupId);
  }, [groups, activeGroupId]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.sheet} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <GlassIconButton name="chevron-back" size={22} onPress={onClose} accessibilityLabel="Close standings" />
          <Text style={styles.headerTitle} accessibilityRole="header">
            Standings
          </Text>
          <View style={styles.backBtnSpacer} />
        </View>

        {groups && groups.length > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterRow}
            contentContainerStyle={styles.filterRowContent}
          >
            <Pressable
              onPress={() => setActiveGroupId(null)}
              accessibilityRole="button"
              accessibilityLabel="All Groups"
              accessibilityState={{ selected: activeGroupId === null }}
            >
              <GlassView
                glassEffectStyle="clear"
                isInteractive
                tintColor={activeGroupId === null ? Colors.accent : undefined}
                style={[styles.filterPill, activeGroupId === null && Platform.OS !== 'ios' && styles.filterPillSelectedFallback]}
              >
                <Text style={[styles.filterPillText, activeGroupId === null && styles.filterPillTextActive]}>
                  All Groups
                </Text>
              </GlassView>
            </Pressable>
            {groups.map((g) => (
              <Pressable
                key={g.id}
                onPress={() => setActiveGroupId(g.id)}
                accessibilityRole="button"
                accessibilityLabel={g.name}
                accessibilityState={{ selected: activeGroupId === g.id }}
              >
                <GlassView
                  glassEffectStyle="clear"
                  isInteractive
                  tintColor={activeGroupId === g.id ? Colors.accent : undefined}
                  style={[styles.filterPill, activeGroupId === g.id && Platform.OS !== 'ios' && styles.filterPillSelectedFallback]}
                >
                  <Text
                    style={[styles.filterPillText, activeGroupId === g.id && styles.filterPillTextActive]}
                    numberOfLines={1}
                  >
                    {g.name}
                  </Text>
                </GlassView>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {error ? (
            <Text style={styles.empty}>Could not load standings ({error}).</Text>
          ) : !groups ? (
            <ActivityIndicator
              color={Colors.accent}
              style={{ marginVertical: Spacing.s4 }}
              accessibilityLabel="Loading standings"
            />
          ) : groups.length === 0 ? (
            <Text style={styles.empty}>No standings available for {leagueLabel}.</Text>
          ) : (
            visibleGroups.map((group) => <GroupTable key={group.id} group={group} />)
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.s2,
    paddingVertical: Spacing.s2,
  },
  backBtnSpacer: { width: 48, height: 48 },
  headerTitle: { color: Colors.text, fontSize: 20, fontFamily: Fonts.bold, fontWeight: '700' },
  // Taller than the 36px filter pill so its Liquid Glass press-bloom isn't
  // clipped by a row sized exactly to the pill's resting height.
  filterRow: { flexGrow: 0, height: 48, marginBottom: Spacing.s2 },
  filterRowContent: { gap: Spacing.s2, paddingHorizontal: Spacing.s4 },
  filterPill: {
    // 44pt to match every other tappable pill in the app (DateStrip's
    // segment, MotorsportStandingsModal's boardTab) — was 36pt.
    height: 44,
    paddingHorizontal: Spacing.s3,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillText: { color: Colors.text, fontSize: 13, fontFamily: Fonts.semibold, fontWeight: '600' },
  filterPillTextActive: { color: Colors.onAccent },
  // tintColor is iOS-only — without this, a selected pill on Android/web
  // gets no background fill, leaving near-black filterPillTextActive text
  // on the app's own near-black background.
  filterPillSelectedFallback: { backgroundColor: Colors.accent },
  scrollContent: { padding: Spacing.s4, paddingTop: 0, gap: Spacing.s4 },
  empty: { color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.s6 },
});
