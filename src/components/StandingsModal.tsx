import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getStandings } from '@/services/api';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { Fonts } from '@/constants/fonts';
import type { StandingsGroup } from '@/types/pocketpundit';

function GroupTable({ group }: { group: StandingsGroup }) {
  return (
    <View style={styles.groupCard}>
      <View style={styles.groupHeaderRow}>
        <Text style={styles.groupName}>{group.name}</Text>
        <Text style={styles.groupMeta}>{group.rows.length} teams</Text>
      </View>

      <View style={styles.tableHeadRow}>
        <Text style={[styles.cell, styles.teamCell, styles.headText]}>Team</Text>
        {group.columnLabels.map((label) => (
          <Text key={label} style={[styles.cell, styles.headText]}>
            {label}
          </Text>
        ))}
      </View>

      {group.rows.map((row) => (
        <View key={row.teamId || row.teamName} style={styles.tableRow}>
          <View style={[styles.cell, styles.teamCell]}>
            {row.logo ? <Image source={{ uri: row.logo }} style={styles.teamLogo} /> : <View style={styles.teamLogo} />}
            <Text style={styles.teamName} numberOfLines={1}>
              {row.teamName}
            </Text>
            {row.rank === 1 ? <Ionicons name="trophy" size={13} color={Colors.accent} /> : null}
          </View>
          {row.columns.map((col) => (
            <Text key={col.label} style={styles.cell}>
              {col.value}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

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
          <Pressable onPress={onClose} hitSlop={12} style={styles.backBtn} accessibilityLabel="Close standings">
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Standings</Text>
          <View style={styles.backBtn} />
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
              style={[styles.filterPill, activeGroupId === null && styles.filterPillActive]}
            >
              <Text style={[styles.filterPillText, activeGroupId === null && styles.filterPillTextActive]}>
                All Groups
              </Text>
            </Pressable>
            {groups.map((g) => (
              <Pressable
                key={g.id}
                onPress={() => setActiveGroupId(g.id)}
                style={[styles.filterPill, activeGroupId === g.id && styles.filterPillActive]}
              >
                <Text style={[styles.filterPillText, activeGroupId === g.id && styles.filterPillTextActive]} numberOfLines={1}>
                  {g.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {error ? (
            <Text style={styles.empty}>Could not load standings ({error}).</Text>
          ) : !groups ? (
            <ActivityIndicator color={Colors.accent} style={{ marginVertical: Spacing.s4 }} />
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
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: Colors.text, fontSize: 20, fontFamily: Fonts.bold, fontWeight: '700' },
  filterRow: { flexGrow: 0, height: 44, marginBottom: Spacing.s2 },
  filterRowContent: { gap: Spacing.s2, paddingHorizontal: Spacing.s4 },
  filterPill: {
    height: 36,
    paddingHorizontal: Spacing.s3,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  filterPillText: { color: Colors.text, fontSize: 13, fontFamily: Fonts.semibold, fontWeight: '600' },
  filterPillTextActive: { color: Colors.onAccent },
  scrollContent: { padding: Spacing.s4, paddingTop: 0, gap: Spacing.s4 },
  empty: { color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.s6 },
  groupCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  groupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.s3,
    paddingVertical: Spacing.s2,
  },
  groupName: { color: Colors.text, fontSize: 16, fontFamily: Fonts.bold, fontWeight: '700' },
  groupMeta: { color: Colors.textMuted, fontSize: 12 },
  tableHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.s3,
    paddingVertical: Spacing.s1,
    backgroundColor: Colors.surfaceRaised,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.s3,
    paddingVertical: Spacing.s2,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cell: { width: 40, color: Colors.text, fontSize: 13, fontFamily: Fonts.semibold, fontWeight: '600', textAlign: 'center', fontVariant: ['tabular-nums'] },
  headText: { color: Colors.textMuted, fontSize: 11, fontFamily: Fonts.bold, fontWeight: '700', textTransform: 'uppercase' },
  teamCell: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.s2 },
  teamLogo: { width: 22, height: 22, resizeMode: 'contain' },
  teamName: { flex: 1, color: Colors.text, fontSize: 14, fontFamily: Fonts.semibold, fontWeight: '600' },
});
