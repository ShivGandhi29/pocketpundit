import { GlassView } from 'expo-glass-effect';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getMotorsportStandings } from '@/services/api';
import { GlassIconButton } from '@/components/GlassIconButton';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { Fonts } from '@/constants/fonts';
import type { MotorsportStandingEntry, MotorsportStandings } from '@/types/huddl';

function StandingRow({ entry }: { entry: MotorsportStandingEntry }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rank}>{entry.rank}</Text>
      {entry.countryFlag ? <Image source={{ uri: entry.countryFlag }} style={styles.flag} contentFit="contain" /> : null}
      {entry.teamColor ? <View style={[styles.teamSwatch, { backgroundColor: entry.teamColor }]} /> : null}
      <Text style={styles.name} numberOfLines={1}>
        {entry.name}
      </Text>
      <Text style={styles.points}>{entry.points}</Text>
    </View>
  );
}

type Board = 'drivers' | 'constructors';

export function MotorsportStandingsModal({
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
  const [standings, setStandings] = useState<MotorsportStandings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [board, setBoard] = useState<Board>('drivers');

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setStandings(null);
    setError(null);
    setBoard('drivers');
    getMotorsportStandings(leagueId)
      .then((result) => {
        if (!cancelled) setStandings(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load standings');
      });
    return () => {
      cancelled = true;
    };
  }, [visible, leagueId]);

  const hasConstructors = (standings?.constructors.length ?? 0) > 0;
  const entries = board === 'constructors' ? (standings?.constructors ?? []) : (standings?.drivers ?? []);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.sheet} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <GlassIconButton name="chevron-back" size={22} onPress={onClose} accessibilityLabel="Close standings" />
          <Text style={styles.headerTitle} accessibilityRole="header">
            Standings
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {hasConstructors ? (
          <View style={styles.boardRow}>
            {([
              ['drivers', 'Drivers'],
              ['constructors', 'Constructors'],
            ] as const).map(([id, label]) => {
              const selected = board === id;
              return (
                <Pressable
                  key={id}
                  onPress={() => setBoard(id)}
                  accessibilityRole="tab"
                  accessibilityLabel={label}
                  accessibilityState={{ selected }}
                  style={styles.boardFlex}
                >
                  <GlassView
                    glassEffectStyle="clear"
                    isInteractive
                    tintColor={selected ? Colors.accent : undefined}
                    style={[styles.boardTab, selected && Platform.OS !== 'ios' && styles.boardTabSelectedFallback]}
                  >
                    <Text style={[styles.boardTabText, selected && styles.boardTabTextSelected]}>{label}</Text>
                  </GlassView>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {error ? (
            <Text style={styles.empty}>Could not load standings ({error}).</Text>
          ) : !standings ? (
            <ActivityIndicator color={Colors.accent} style={{ marginVertical: Spacing.s4 }} accessibilityLabel="Loading standings" />
          ) : entries.length === 0 ? (
            <Text style={styles.empty}>No standings available for {leagueLabel}.</Text>
          ) : (
            <View style={styles.tableCard}>
              <View style={styles.tableHeadRow}>
                <Text style={[styles.rank, styles.headText]}>Pos</Text>
                <Text style={[styles.name, styles.headText]}>{board === 'constructors' ? 'Team' : 'Driver'}</Text>
                <Text style={[styles.points, styles.headText]}>Pts</Text>
              </View>
              {entries.map((entry) => (
                <StandingRow key={entry.rank} entry={entry} />
              ))}
            </View>
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
  headerSpacer: { width: 48, height: 48 },
  headerTitle: { color: Colors.text, fontSize: 20, fontFamily: Fonts.bold, fontWeight: '700' },
  boardRow: { flexDirection: 'row', gap: Spacing.s2, paddingHorizontal: Spacing.s4, marginBottom: Spacing.s2 },
  boardFlex: { flex: 1 },
  boardTab: { minHeight: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  boardTabSelectedFallback: { backgroundColor: Colors.accent },
  boardTabText: { color: Colors.text, fontSize: 14, fontFamily: Fonts.bold, fontWeight: '700' },
  boardTabTextSelected: { color: Colors.onAccent },
  scrollContent: { padding: Spacing.s4, paddingTop: 0 },
  empty: { color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.s6 },
  tableCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  tableHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s2,
    paddingHorizontal: Spacing.s3,
    paddingVertical: Spacing.s1,
    backgroundColor: Colors.surfaceRaised,
  },
  headText: { color: Colors.textMuted, fontSize: 12, fontFamily: Fonts.bold, fontWeight: '700' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s2,
    paddingHorizontal: Spacing.s3,
    paddingVertical: Spacing.s2,
  },
  rank: { width: 28, color: Colors.text, fontSize: 13, fontFamily: Fonts.bold, fontWeight: '700', textAlign: 'center', fontVariant: ['tabular-nums'] },
  flag: { width: 20, height: 20 },
  teamSwatch: { width: 12, height: 12, borderRadius: 3 },
  name: { flex: 1, color: Colors.text, fontSize: 14, fontFamily: Fonts.semibold, fontWeight: '600' },
  points: { width: 44, color: Colors.text, fontSize: 14, fontFamily: Fonts.bold, fontWeight: '700', textAlign: 'right', fontVariant: ['tabular-nums'] },
});
