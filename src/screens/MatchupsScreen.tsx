import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GameCard } from '@/components/GameCard';
import { GameDetailModal } from '@/components/GameDetailModal';
import { getGames } from '@/services/api';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { AppState, Game, League } from '@/types/pocketpundit';

export function MatchupsScreen({ leagues, state }: { leagues: League[]; state: AppState }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('all');
  const [games, setGames] = useState<Game[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [openGame, setOpenGame] = useState<Game | null>(null);

  const leagueLabel = useCallback((id: string) => leagues.find((l) => l.id === id)?.label || id, [leagues]);
  const isFavoriteTeam = useCallback(
    (teamId: string | null) => (teamId ? Object.prototype.hasOwnProperty.call(state.favoriteTeams, teamId) : false),
    [state.favoriteTeams]
  );

  const tabs = useMemo(
    () => [{ id: 'all', label: 'All' }, ...state.selectedLeagueIds.map((id) => ({ id, label: leagueLabel(id) }))],
    [state.selectedLeagueIds, leagueLabel]
  );

  const loadGames = useCallback(async () => {
    const leagueIds = activeTab === 'all' ? state.selectedLeagueIds : [activeTab];
    setError(null);
    try {
      const results = await Promise.all(
        leagueIds.map(async (id) => ({ id, games: await getGames(id) }))
      );
      const flat = results.flatMap(({ id, games: leagueGames }) =>
        leagueGames.map((g) => ({ ...g, leagueId: id }) as Game)
      );
      flat.sort((a, b) => {
        const favA = isFavoriteTeam(a.home.id) || isFavoriteTeam(a.away.id);
        const favB = isFavoriteTeam(b.home.id) || isFavoriteTeam(b.away.id);
        if (favA !== favB) return favA ? -1 : 1;
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
      setGames(flat);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load games');
      setGames([]);
    }
  }, [activeTab, state.selectedLeagueIds, isFavoriteTeam]);

  useEffect(() => {
    setGames(null);
    loadGames();
  }, [loadGames]);

  async function onRefresh() {
    setRefreshing(true);
    await loadGames();
    setRefreshing(false);
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topbar}>
        <Text style={styles.brand}>PocketPundit</Text>
        <Pressable onPress={() => router.push('/settings')} hitSlop={12} style={styles.iconBtn}>
          <Ionicons name="settings-outline" size={22} color={Colors.text} />
        </Pressable>
      </View>

      <View style={styles.tabsRow}>
        <FlatList
          horizontal
          data={tabs}
          keyExtractor={(t) => t.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: Spacing.s2, paddingHorizontal: Spacing.s4 }}
          renderItem={({ item }) => {
            const selected = item.id === activeTab;
            return (
              <Pressable
                onPress={() => setActiveTab(item.id)}
                style={[styles.tab, selected && styles.tabSelected]}
              >
                <Text style={[styles.tabText, selected && styles.tabTextSelected]}>{item.label}</Text>
              </Pressable>
            );
          }}
        />
      </View>

      {games === null ? (
        <Text style={styles.empty}>Loading matchups…</Text>
      ) : error ? (
        <Text style={styles.empty}>Could not load games ({error}).</Text>
      ) : games.length === 0 ? (
        <Text style={styles.empty}>No games scheduled right now.</Text>
      ) : (
        <FlatList
          data={games}
          keyExtractor={(g) => g.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
          renderItem={({ item }) => (
            <GameCard
              game={item}
              favorite={isFavoriteTeam(item.home.id) || isFavoriteTeam(item.away.id)}
              onPress={() => setOpenGame(item)}
            />
          )}
        />
      )}

      <GameDetailModal
        game={openGame}
        leagueLabel={openGame ? leagueLabel(openGame.leagueId) : ''}
        onClose={() => setOpenGame(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.s4,
    paddingVertical: Spacing.s2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  brand: { color: Colors.text, fontSize: 18, fontWeight: '700', letterSpacing: -0.2 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.pill },
  tabsRow: { paddingVertical: Spacing.s3 },
  tab: {
    minHeight: 36,
    paddingHorizontal: Spacing.s3,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabSelected: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  tabText: { color: Colors.text, fontSize: 14, fontWeight: '600' },
  tabTextSelected: { color: Colors.onAccent },
  list: { padding: Spacing.s4, paddingTop: 0, gap: Spacing.s3 },
  empty: { color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.s6 },
});
