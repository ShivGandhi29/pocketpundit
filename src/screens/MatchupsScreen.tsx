import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DateStrip } from '@/components/DateStrip';
import { GameCard } from '@/components/GameCard';
import { GameDetailModal } from '@/components/GameDetailModal';
import { MotorsportDetailModal } from '@/components/MotorsportDetailModal';
import { MotorsportEventCard } from '@/components/MotorsportEventCard';
import { WeekStrip } from '@/components/WeekStrip';
import { getGames, getMotorsportSchedule, getNflWeekCalendar } from '@/services/api';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { addDays, dateWithOffset, isSameLocalDay, toEspnDateParam } from '@/utils/formatGameTime';
import type { AppState, Game, League, MotorsportEvent, WeekCalendar } from '@/types/pocketpundit';

export function MatchupsScreen({ leagues, state }: { leagues: League[]; state: AppState }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('all');
  const [selectedDate, setSelectedDate] = useState(() => dateWithOffset(0));
  // NFL browses by named week (Preseason Week 2, Week 1, playoff rounds...)
  // rather than by calendar day the way the other leagues do — see
  // getNflWeekCalendar in services/api.ts.
  const [nflCalendar, setNflCalendar] = useState<WeekCalendar | null>(null);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number | null>(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [games, setGames] = useState<Game[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [openGame, setOpenGame] = useState<Game | null>(null);
  const [motorsportEvents, setMotorsportEvents] = useState<MotorsportEvent[] | null>(null);
  const [motorsportError, setMotorsportError] = useState<string | null>(null);
  const [openMotorsportEvent, setOpenMotorsportEvent] = useState<MotorsportEvent | null>(null);

  const isNflWeekTab = activeTab === 'nfl';
  const isMotorsportTab = leagues.find((l) => l.id === activeTab)?.kind === 'motorsport';

  useEffect(() => {
    if (!isNflWeekTab || nflCalendar) return;
    let cancelled = false;
    getNflWeekCalendar()
      .then((cal) => {
        if (cancelled) return;
        setNflCalendar(cal);
        setSelectedWeekIndex(cal.currentWeekIndex);
      })
      .catch(() => {
        // Fall through: loadGames below falls back to date-based fetching
        // for NFL if the week calendar never loads, so this fails soft.
      });
    return () => {
      cancelled = true;
    };
  }, [isNflWeekTab, nflCalendar]);

  const leagueLabel = useCallback((id: string) => leagues.find((l) => l.id === id)?.label || id, [leagues]);
  const isFavoriteTeam = useCallback(
    (teamId: string | null) => (teamId ? Object.prototype.hasOwnProperty.call(state.favoriteTeams, teamId) : false),
    [state.favoriteTeams]
  );
  const isFavoriteGame = useCallback(
    (game: Game) => isFavoriteTeam(game.home.id) || isFavoriteTeam(game.away.id),
    [isFavoriteTeam]
  );

  const tabs = useMemo(
    () => [
      { id: 'all', label: 'All', logo: null as string | null },
      ...state.selectedLeagueIds.map((id) => {
        const league = leagues.find((l) => l.id === id);
        return { id, label: league?.shortLabel ?? leagueLabel(id), logo: league?.logo ?? null };
      }),
    ],
    [state.selectedLeagueIds, leagueLabel, leagues]
  );

  const selectedWeek =
    isNflWeekTab && nflCalendar && selectedWeekIndex != null ? nflCalendar.weeks[selectedWeekIndex] : null;

  const loadGames = useCallback(async () => {
    if (isMotorsportTab) return;
    // Motorsport leagues don't fit the Game model, so "All" only aggregates
    // team-sport leagues; motorsport has its own tab, schedule, and detail view.
    const leagueIds =
      activeTab === 'all'
        ? state.selectedLeagueIds.filter((id) => leagues.find((l) => l.id === id)?.kind !== 'motorsport')
        : [activeTab];
    setError(null);
    try {
      const results = await Promise.all(
        leagueIds.map(async (id) => {
          if (id === 'nfl' && selectedWeek) {
            const games = await getGames(id, {
              week: selectedWeek.weekValue,
              seasonType: selectedWeek.seasonTypeValue,
            });
            return { id, games };
          }
          // ESPN's `dates` param doesn't bucket by UTC or local calendar day —
          // verified live it's closer to a US-evening "game night" window
          // (e.g. dates=20260828 returned events from 22:00 UTC through
          // 01:00 UTC the next day). For a positive-UTC-offset timezone that
          // whole bucket can land on the *next* local day entirely, which is
          // exactly the "I picked Friday, everything says Saturday" bug this
          // fixes: fetch the selected date's bucket plus both neighbors, then
          // keep only the events that actually fall on the selected day once
          // converted to the device's own local time.
          const buckets = await Promise.all(
            [-1, 0, 1].map((offset) => getGames(id, { date: toEspnDateParam(addDays(selectedDate, offset)) }))
          );
          const seen = new Set<string>();
          const games = buckets.flat().filter((g) => {
            if (seen.has(g.id) || !isSameLocalDay(new Date(g.date), selectedDate)) return false;
            seen.add(g.id);
            return true;
          });
          return { id, games };
        })
      );
      const flat = results.flatMap(({ id, games: leagueGames }) =>
        leagueGames.map((g) => ({ ...g, leagueId: id }) as Game)
      );
      flat.sort((a, b) => {
        const favA = isFavoriteGame(a);
        const favB = isFavoriteGame(b);
        if (favA !== favB) return favA ? -1 : 1;
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
      setGames(flat);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load games');
      setGames([]);
    }
  }, [activeTab, state.selectedLeagueIds, selectedDate, selectedWeek, isFavoriteGame, isMotorsportTab, leagues]);

  useEffect(() => {
    if (isMotorsportTab) return;
    setGames(null);
    loadGames();
  }, [loadGames, isMotorsportTab]);

  useEffect(() => {
    if (!isMotorsportTab) return;
    let cancelled = false;
    setMotorsportEvents(null);
    setMotorsportError(null);
    getMotorsportSchedule(activeTab)
      .then((events) => {
        if (cancelled) return;
        const sorted = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setMotorsportEvents(sorted);
      })
      .catch((err) => {
        if (cancelled) return;
        setMotorsportError(err instanceof Error ? err.message : 'Could not load schedule');
        setMotorsportEvents([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isMotorsportTab, activeTab]);

  async function onRefresh() {
    setRefreshing(true);
    if (isMotorsportTab) {
      try {
        const events = await getMotorsportSchedule(activeTab);
        events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setMotorsportEvents(events);
        setMotorsportError(null);
      } catch (err) {
        setMotorsportError(err instanceof Error ? err.message : 'Could not load schedule');
      }
    } else {
      await loadGames();
    }
    setRefreshing(false);
  }

  const visibleGames = favoritesOnly ? (games ?? []).filter(isFavoriteGame) : games;
  const hasFavorites = Object.keys(state.favoriteTeams).length > 0;
  const emptyMessage = favoritesOnly
    ? `No favorite-team games ${isNflWeekTab ? 'this week' : 'on this date'}.`
    : `No games scheduled ${isNflWeekTab ? 'this week' : 'on this date'}.`;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topbar}>
        <Text style={styles.brand}>PocketPundit</Text>
        <View style={styles.topbarActions}>
          {!isMotorsportTab ? (
            <Pressable
              onPress={() => setFavoritesOnly((v) => !v)}
              disabled={!hasFavorites}
              hitSlop={12}
              style={[styles.iconBtn, favoritesOnly && styles.iconBtnActive, !hasFavorites && styles.iconBtnDisabled]}
            >
              <Ionicons
                name={favoritesOnly ? 'star' : 'star-outline'}
                size={20}
                color={favoritesOnly ? Colors.onAccent : Colors.text}
              />
            </Pressable>
          ) : null}
          <Pressable onPress={() => router.push('/settings')} hitSlop={12} style={styles.iconBtn}>
            <Ionicons name="settings-outline" size={22} color={Colors.text} />
          </Pressable>
        </View>
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
                {item.logo ? (
                  // White backdrop so dark/transparent logo art (several
                  // leagues have dark navy or black marks) doesn't disappear
                  // against the pill's own dark background.
                  <View style={styles.tabLogoBackdrop}>
                    <Image source={{ uri: item.logo }} style={styles.tabLogo} />
                  </View>
                ) : (
                  // "All" spans every league, so there's no official logo for it.
                  <Ionicons name="apps-outline" size={20} color={selected ? Colors.onAccent : Colors.text} />
                )}
                <Text style={[styles.tabText, selected && styles.tabTextSelected]} numberOfLines={1}>
                  {item.label}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {/* A race weekend calendar has no useful "day" to browse by — the whole
          season schedule fits in one list — so motorsport tabs skip the
          date/week strip and favorites filter entirely. */}
      {!isMotorsportTab ? (
        isNflWeekTab ? (
          <View style={styles.calendarStrip}>
            {nflCalendar ? (
              <WeekStrip
                weeks={nflCalendar.weeks}
                selectedIndex={selectedWeekIndex ?? nflCalendar.currentWeekIndex}
                onSelect={setSelectedWeekIndex}
              />
            ) : null}
          </View>
        ) : (
          <DateStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        )
      ) : null}

      {isMotorsportTab ? (
        motorsportEvents === null ? (
          <Text style={styles.empty}>Loading schedule…</Text>
        ) : motorsportError ? (
          <Text style={styles.empty}>Could not load schedule ({motorsportError}).</Text>
        ) : motorsportEvents.length === 0 ? (
          <Text style={styles.empty}>No races scheduled.</Text>
        ) : (
          <FlatList
            data={motorsportEvents}
            keyExtractor={(e) => e.id}
            contentContainerStyle={[styles.list, { paddingBottom: Spacing.s4 + insets.bottom }]}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
            renderItem={({ item }) => (
              <MotorsportEventCard event={item} onPress={() => setOpenMotorsportEvent(item)} />
            )}
          />
        )
      ) : games === null ? (
        <Text style={styles.empty}>Loading matchups…</Text>
      ) : error ? (
        <Text style={styles.empty}>Could not load games ({error}).</Text>
      ) : visibleGames && visibleGames.length === 0 ? (
        <Text style={styles.empty}>{emptyMessage}</Text>
      ) : (
        <FlatList
          data={visibleGames ?? []}
          keyExtractor={(g) => g.id}
          contentContainerStyle={[styles.list, { paddingBottom: Spacing.s4 + insets.bottom }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
          renderItem={({ item }) => (
            <GameCard game={item} favorite={isFavoriteGame(item)} onPress={() => setOpenGame(item)} />
          )}
        />
      )}

      <GameDetailModal
        game={openGame}
        leagueId={openGame?.leagueId ?? ''}
        leagueLabel={openGame ? leagueLabel(openGame.leagueId) : ''}
        onClose={() => setOpenGame(null)}
      />

      <MotorsportDetailModal
        event={openMotorsportEvent}
        leagueId={activeTab}
        leagueLabel={leagueLabel(activeTab)}
        onClose={() => setOpenMotorsportEvent(null)}
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
  topbarActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.s2 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.pill },
  iconBtnActive: { backgroundColor: Colors.accent },
  iconBtnDisabled: { opacity: 0.35 },
  calendarStrip: { height: 84, overflow: 'hidden' },
  tabsRow: { paddingVertical: Spacing.s3 },
  tab: {
    width: 68,
    paddingVertical: Spacing.s2,
    paddingHorizontal: Spacing.s2,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabSelected: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  tabLogoBackdrop: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLogo: { width: 20, height: 20, resizeMode: 'contain' },
  tabText: { color: Colors.text, fontSize: 12, fontWeight: '600' },
  tabTextSelected: { color: Colors.onAccent },
  list: { padding: Spacing.s4, paddingTop: 0, gap: Spacing.s3 },
  empty: { color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.s6 },
});
