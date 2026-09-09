import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/AppText';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { Fonts } from '@/constants/fonts';
import type { StandingsGroup } from '@/types/huddl';

// Shared between StandingsModal (the dedicated standings screen) and
// GameStatsTabs (an upcoming game's stats area, which shows the league
// leaderboard in place of leaders/box score/team stats that don't exist yet).
export const GroupTable = memo(function GroupTable({ group }: { group: StandingsGroup }) {
  return (
    <View style={styles.groupCard}>
      <View style={styles.groupHeaderRow}>
        <Text style={styles.groupName} accessibilityRole="header">
          {group.name}
        </Text>
        <Text style={styles.groupMeta}>{group.rows.length} teams</Text>
      </View>

      {/* Each row below restates its own column labels in its accessibility
          label, so this header row is a sighted-layout header only. */}
      <View style={styles.tableHeadRow} importantForAccessibility="no-hide-descendants">
        <Text style={[styles.cell, styles.teamCell, styles.headText]}>Team</Text>
        {group.columnLabels.map((label) => (
          <Text key={label} style={[styles.cell, styles.headText]}>
            {label}
          </Text>
        ))}
      </View>

      {group.rows.map((row) => {
        // Collapsed into one composed label (e.g. "Buffalo Bills, rank 1: W
        // 12, L 5, PCT .706") rather than leaving each stat individually
        // focusable — a bare ".706" cell has no way to say which team or
        // column it belongs to otherwise.
        const rowLabel = [
          `${row.teamName}${row.rank != null ? `, rank ${row.rank}` : ''}:`,
          row.columns.map((col) => `${col.label} ${col.value}`).join(', '),
        ].join(' ');
        return (
          <View key={row.teamId || row.teamName} style={styles.tableRow} accessible accessibilityLabel={rowLabel}>
            <View style={[styles.cell, styles.teamCell]}>
              {row.logo ? (
                <Image source={{ uri: row.logo }} style={styles.teamLogo} contentFit="contain" />
              ) : (
                <View style={styles.teamLogo} />
              )}
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
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  groupCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
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
  },
  cell: {
    width: 40,
    color: Colors.text,
    fontSize: 13,
    fontFamily: Fonts.semibold,
    fontWeight: '600',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  headText: { color: Colors.textMuted, fontSize: 12, fontFamily: Fonts.bold, fontWeight: '700' },
  teamCell: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.s2 },
  teamLogo: { width: 22, height: 22 },
  teamName: { flex: 1, color: Colors.text, fontSize: 14, fontFamily: Fonts.semibold, fontWeight: '600' },
});
