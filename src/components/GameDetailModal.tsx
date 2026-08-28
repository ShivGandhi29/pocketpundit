import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useLocalAI } from '@/contexts/LocalAIContext';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { Game, GameTeam } from '@/types/pocketpundit';

function MatchupRow({ team, state }: { team: GameTeam; state: Game['state'] }) {
  return (
    <View style={styles.matchupRow}>
      {team.logo ? <Image source={{ uri: team.logo }} style={styles.logo} /> : <View style={styles.logo} />}
      <Text style={styles.teamName} numberOfLines={1}>
        {team.name}
      </Text>
      <Text style={styles.teamRecord}>{team.record || ''}</Text>
      <Text style={styles.teamScore}>{state === 'pre' ? '' : (team.score ?? '')}</Text>
    </View>
  );
}

export function GameDetailModal({
  game,
  leagueLabel,
  onClose,
}: {
  game: Game | null;
  leagueLabel: string;
  onClose: () => void;
}) {
  const ai = useLocalAI();
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading');
  const [text, setText] = useState('');

  useEffect(() => {
    if (!game || !ai.isReady) return;
    let cancelled = false;
    setStatus('loading');
    setText('');
    ai.analyzeMatchup({ leagueLabel, home: game.home, away: game.away })
      .then((result) => {
        if (cancelled) return;
        setStatus('done');
        setText(result || 'No analysis returned.');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setStatus('error');
        setText(`Analysis failed: ${err instanceof Error ? err.message : String(err)}`);
      });
    return () => {
      cancelled = true;
    };
    // ai.analyzeMatchup is stable per model-ready state; game/leagueLabel drive re-analysis.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game, leagueLabel, ai.isReady]);

  return (
    <Modal visible={!!game} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.sheet}>
        <View style={styles.header}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {leagueLabel} · {game?.shortName || ''}
          </Text>
          <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>Close</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {game ? (
            <View style={styles.matchup}>
              <MatchupRow team={game.away} state={game.state} />
              <MatchupRow team={game.home} state={game.state} />
            </View>
          ) : null}
          <Text style={styles.analysisHeading}>✦ On-device AI analysis</Text>

          {ai.error ? (
            <Text style={styles.analysisError}>Local AI unavailable: {ai.error}</Text>
          ) : !ai.isReady ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={Colors.accent} />
              <Text style={styles.loadingText}>
                {ai.downloadProgress > 0
                  ? `Downloading on-device model… ${Math.round(ai.downloadProgress * 100)}%`
                  : 'Preparing on-device model…'}
              </Text>
            </View>
          ) : status === 'loading' ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={Colors.accent} />
              <Text style={styles.loadingText}>Analyzing matchup on-device…</Text>
            </View>
          ) : (
            <Text style={[styles.analysisBody, status === 'error' && styles.analysisError]}>{text}</Text>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.s3,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { flex: 1, color: Colors.text, fontSize: 16, fontWeight: '700' },
  closeBtn: { paddingHorizontal: Spacing.s2, paddingVertical: Spacing.s1 },
  closeBtnText: { color: Colors.accent, fontWeight: '600', fontSize: 15 },
  scrollContent: { padding: Spacing.s4 },
  matchup: {
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.md,
    padding: Spacing.s3,
    gap: Spacing.s2,
    marginBottom: Spacing.s4,
  },
  matchupRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.s2, paddingVertical: Spacing.s1 },
  logo: { width: 28, height: 28, resizeMode: 'contain' },
  teamName: { flex: 1, color: Colors.text, fontSize: 15, fontWeight: '600' },
  teamRecord: { color: Colors.textMuted, fontSize: 13 },
  teamScore: { color: Colors.text, fontSize: 18, fontWeight: '700', minWidth: 28, textAlign: 'right' },
  analysisHeading: { color: Colors.accent, fontSize: 15, fontWeight: '700', marginBottom: Spacing.s2 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.s2, minHeight: 60 },
  loadingText: { color: Colors.textMuted, fontSize: 15 },
  analysisBody: { color: Colors.text, fontSize: 15, lineHeight: 22 },
  analysisError: { color: Colors.live },
});
