import { Text } from "@/components/AppText";
import { Ionicons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DateStrip, type CalendarMode } from "@/components/DateStrip";
import { GameCard } from "@/components/GameCard";
import { GameDetailModal } from "@/components/GameDetailModal";
import { GlassIconButton } from "@/components/GlassIconButton";
import { MotorsportDetailModal } from "@/components/MotorsportDetailModal";
import { MotorsportEventCard } from "@/components/MotorsportEventCard";
import { MotorsportStandingsModal } from "@/components/MotorsportStandingsModal";
import { GamesListSkeleton } from "@/components/Skeleton";
import { StandingsModal } from "@/components/StandingsModal";
import { WeekStrip } from "@/components/WeekStrip";
import { Fonts } from "@/constants/fonts";
import { Colors, Radius, Spacing } from "@/constants/theme";
import {
  getGames,
  getMotorsportSchedule,
  getNflWeekCalendar,
} from "@/services/api";
import type {
  AppState,
  Game,
  League,
  MotorsportEvent,
  MotorsportSchedule,
  WeekCalendar,
} from "@/types/huddl";
import {
  addDays,
  dateWithOffset,
  formatAgendaSectionLabel,
  isSameLocalDay,
  toEspnDateParam,
} from "@/utils/formatGameTime";
import { favoriteKey } from "@/utils/favorites";

// How many days ahead the "Upcoming" agenda looks — long enough to be
// useful, short enough not to fan out into dozens of parallel ESPN requests
// per league (each day is one request per league; "All" with several
// leagues selected already multiplies this).
const UPCOMING_DAYS = 5;

type UpcomingSection = { date: Date; games: Game[] };

// GameCard now carries a native gradient layer plus two full-size logo
// images per card — memoizing the component (see GameCard.tsx) stops
// React from re-rendering cards whose data hasn't changed, but it doesn't
// reduce how many of those heavier native views are mounted at once. That
// still matters most right when the detail modal closes: dismissing it
// reveals this whole list again, and the OS has to composite every
// currently-mounted card's gradient + images as part of that transition.
// Capping the render window keeps far fewer of them mounted off-screen.
const GAME_LIST_PERFORMANCE_PROPS = {
  removeClippedSubviews: true,
  initialNumToRender: 6,
  maxToRenderPerBatch: 6,
  windowSize: 7,
} as const;

export function MatchupsScreen({
  leagues,
  state,
}: {
  leagues: League[];
  state: AppState;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState("all");
  const [calendarMode, setCalendarMode] = useState<CalendarMode>("today");
  const today = useMemo(() => dateWithOffset(0), []);
  // NFL browses by named week (Preseason Week 2, Week 1, playoff rounds...)
  // rather than by calendar day the way the other leagues do — see
  // getNflWeekCalendar in services/api.ts.
  const [nflCalendar, setNflCalendar] = useState<WeekCalendar | null>(null);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number | null>(
    null,
  );
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [games, setGames] = useState<Game[] | null>(null);
  const [upcomingSections, setUpcomingSections] = useState<
    UpcomingSection[] | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [openGame, setOpenGame] = useState<Game | null>(null);
  // Stable across renders so GameCard's React.memo can actually skip
  // re-rendering unaffected cards — an inline `() => setOpenGame(item)` per
  // card would give memo a new function identity every render and defeat it.
  const handleOpenGame = useCallback((game: Game) => setOpenGame(game), []);
  const [motorsportEvents, setMotorsportEvents] =
    useState<MotorsportSchedule | null>(null);
  const [motorsportError, setMotorsportError] = useState<string | null>(null);
  const [openMotorsportEvent, setOpenMotorsportEvent] =
    useState<MotorsportEvent | null>(null);
  const handleOpenMotorsportEvent = useCallback(
    (event: MotorsportEvent) => setOpenMotorsportEvent(event),
    [],
  );
  const [standingsOpen, setStandingsOpen] = useState(false);

  const isNflWeekTab = activeTab === "nfl";
  const activeLeague = leagues.find((l) => l.id === activeTab);
  const isMotorsportTab = activeLeague?.kind === "motorsport";
  // Standings are a per-league table — "All" spans multiple leagues at once,
  // so the button only makes sense once one specific league is active.
  // Motorsport gets its own driver/constructor standings modal (different
  // shape entirely — no team-vs-team table), not the team-sport one.
  const canShowStandings = activeTab !== "all" && activeLeague?.kind === "team";
  const canShowMotorsportStandings = activeTab !== "all" && isMotorsportTab;

  // The very next race gets its own "Next Race" section (rendered as one
  // oversized featured card — see MotorsportEventCard's `featured` prop),
  // the rest of the season's remaining rounds sit under "Upcoming", and
  // anything already run groups under "Completed" rather than being left
  // under no heading at all.
  const motorsportSections = useMemo(() => {
    if (!motorsportEvents) return [];
    const sections: {
      title: string;
      featured: boolean;
      data: MotorsportEvent[];
    }[] = [];
    if (motorsportEvents.upcoming.length > 0) {
      sections.push({
        title: "Next Race",
        featured: true,
        data: [motorsportEvents.upcoming[0]],
      });
      if (motorsportEvents.upcoming.length > 1) {
        sections.push({
          title: "Upcoming",
          featured: false,
          data: motorsportEvents.upcoming.slice(1),
        });
      }
    }
    if (motorsportEvents.past.length > 0) {
      sections.push({
        title: "Completed",
        featured: false,
        data: motorsportEvents.past,
      });
    }
    return sections;
  }, [motorsportEvents]);

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

  const leagueLabel = useCallback(
    (id: string) => leagues.find((l) => l.id === id)?.label || id,
    [leagues],
  );
  // ESPN scopes team ids per league (an NFL team and an NCAAF team can share
  // the same raw id), so favorites are stored under a leagueId:id key — see
  // favoriteKey() in @/utils/favorites. Checking by raw teamId alone would
  // pin the wrong league's games whenever ids happened to collide.
  const isFavoriteTeam = useCallback(
    (leagueId: string, teamId: string | null) =>
      teamId
        ? Object.prototype.hasOwnProperty.call(state.favoriteTeams, favoriteKey(leagueId, teamId))
        : false,
    [state.favoriteTeams],
  );
  const isFavoriteGame = useCallback(
    (game: Game) =>
      isFavoriteTeam(game.leagueId, game.home.id) || isFavoriteTeam(game.leagueId, game.away.id),
    [isFavoriteTeam],
  );
  const compareByFavoriteThenTime = useCallback(
    (a: Game, b: Game) => {
      const favA = isFavoriteGame(a);
      const favB = isFavoriteGame(b);
      if (favA !== favB) return favA ? -1 : 1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    },
    [isFavoriteGame],
  );

  const tabs = useMemo(
    () => [
      { id: "all", label: "All", logo: null as string | null },
      ...state.selectedLeagueIds.map((id) => {
        const league = leagues.find((l) => l.id === id);
        return {
          id,
          label: league?.shortLabel ?? leagueLabel(id),
          logo: league?.logo ?? null,
        };
      }),
    ],
    [state.selectedLeagueIds, leagueLabel, leagues],
  );

  const selectedWeek =
    isNflWeekTab && nflCalendar && selectedWeekIndex != null
      ? nflCalendar.weeks[selectedWeekIndex]
      : null;
  // "Yesterday"/"Today" still need the single specific day the fetch below
  // is grounded on; "Upcoming" has no single day, so this is only consulted
  // by the non-NFL, non-upcoming branch. Memoized so its identity is stable
  // across re-renders — `addDays` always returns a new Date object, and an
  // unmemoized one here made `loadGames` (which depends on it) get a new
  // identity on every render while on the Yesterday tab, which retriggered
  // the effect that resets `games` to null and re-fetches, flickering the
  // skeleton loader continuously instead of settling once data arrived.
  const singleDate = useMemo(
    () => (calendarMode === "yesterday" ? addDays(today, -1) : today),
    [calendarMode, today],
  );

  const loadGames = useCallback(async () => {
    if (isMotorsportTab) return;
    // Motorsport leagues don't fit the Game model, so "All" only aggregates
    // team-sport leagues; motorsport has its own tab, schedule, and detail view.
    const leagueIds =
      activeTab === "all"
        ? state.selectedLeagueIds.filter(
            (id) => leagues.find((l) => l.id === id)?.kind !== "motorsport",
          )
        : [activeTab];
    setError(null);

    if (isNflWeekTab && selectedWeek) {
      try {
        const results = await Promise.all(
          leagueIds.map(async (id) => {
            const games = await getGames(id, {
              week: selectedWeek.weekValue,
              seasonType: selectedWeek.seasonTypeValue,
            });
            return { id, games };
          }),
        );
        const flat = results.flatMap(({ id, games: leagueGames }) =>
          leagueGames.map((g) => ({ ...g, leagueId: id }) as Game),
        );
        flat.sort(compareByFavoriteThenTime);
        setUpcomingSections(null);
        setGames(flat);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load games");
        setGames([]);
      }
      return;
    }

    if (calendarMode === "upcoming") {
      try {
        const dayOffsets = Array.from(
          { length: UPCOMING_DAYS },
          (_, i) => i + 1,
        );
        // No ±1-bucket correction here (unlike below) — for a multi-day
        // overview a game landing under the adjacent date's heading is a
        // minor cosmetic miss, not worth tripling the request count for
        // every league × every day in the window.
        const perLeague = await Promise.all(
          leagueIds.map(async (id) => {
            const perDay = await Promise.all(
              dayOffsets.map(async (offset) => {
                const games = await getGames(id, {
                  date: toEspnDateParam(addDays(today, offset)),
                });
                return games.map((g) => ({ ...g, leagueId: id }) as Game);
              }),
            );
            return perDay.flat();
          }),
        );
        const byDay = new Map<string, UpcomingSection>();
        for (const game of perLeague.flat()) {
          const gameDate = new Date(game.date);
          const key = toEspnDateParam(gameDate);
          if (!byDay.has(key)) {
            byDay.set(key, {
              date: new Date(
                gameDate.getFullYear(),
                gameDate.getMonth(),
                gameDate.getDate(),
              ),
              games: [],
            });
          }
          byDay.get(key)!.games.push(game);
        }
        const sections = Array.from(byDay.values())
          .sort((a, b) => a.date.getTime() - b.date.getTime())
          .map((section) => ({
            ...section,
            games: [...section.games].sort(compareByFavoriteThenTime),
          }));
        setGames(null);
        setUpcomingSections(sections);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load games");
        setUpcomingSections([]);
      }
      return;
    }

    try {
      const results = await Promise.all(
        leagueIds.map(async (id) => {
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
            [-1, 0, 1].map((offset) =>
              getGames(id, {
                date: toEspnDateParam(addDays(singleDate, offset)),
              }),
            ),
          );
          const seen = new Set<string>();
          const games = buckets.flat().filter((g) => {
            if (seen.has(g.id) || !isSameLocalDay(new Date(g.date), singleDate))
              return false;
            seen.add(g.id);
            return true;
          });
          return { id, games };
        }),
      );
      const flat = results.flatMap(({ id, games: leagueGames }) =>
        leagueGames.map((g) => ({ ...g, leagueId: id }) as Game),
      );
      flat.sort(compareByFavoriteThenTime);
      setUpcomingSections(null);
      setGames(flat);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load games");
      setGames([]);
    }
  }, [
    activeTab,
    state.selectedLeagueIds,
    calendarMode,
    singleDate,
    today,
    selectedWeek,
    isNflWeekTab,
    compareByFavoriteThenTime,
    isMotorsportTab,
    leagues,
  ]);

  useEffect(() => {
    if (isMotorsportTab) return;
    setGames(null);
    setUpcomingSections(null);
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
        // Already ordered upcoming-first by getMotorsportSchedule.
        setMotorsportEvents(events);
      })
      .catch((err) => {
        if (cancelled) return;
        setMotorsportError(
          err instanceof Error ? err.message : "Could not load schedule",
        );
        setMotorsportEvents({ upcoming: [], past: [] });
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
        setMotorsportEvents(events);
        setMotorsportError(null);
      } catch (err) {
        setMotorsportError(
          err instanceof Error ? err.message : "Could not load schedule",
        );
      }
    } else {
      await loadGames();
    }
    setRefreshing(false);
  }

  const visibleGames = favoritesOnly
    ? (games ?? []).filter(isFavoriteGame)
    : games;
  const visibleUpcomingSections = useMemo(() => {
    if (!upcomingSections) return upcomingSections;
    if (!favoritesOnly) return upcomingSections;
    return upcomingSections
      .map((section) => ({
        ...section,
        games: section.games.filter(isFavoriteGame),
      }))
      .filter((section) => section.games.length > 0);
  }, [upcomingSections, favoritesOnly, isFavoriteGame]);
  const hasFavorites = Object.keys(state.favoriteTeams).length > 0;
  const periodLabel = isNflWeekTab
    ? "this week"
    : calendarMode === "yesterday"
      ? "yesterday"
      : calendarMode === "today"
        ? "today"
        : `in the next ${UPCOMING_DAYS} days`;
  const emptyMessage = favoritesOnly
    ? `No favorite-team games ${periodLabel}.`
    : `No games scheduled ${periodLabel}.`;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topbar}>
        <Text style={styles.brand} accessibilityRole="header">
          Huddl
        </Text>
        <View style={styles.topbarActions}>
          {!isMotorsportTab ? (
            <GlassIconButton
              name={favoritesOnly ? "star" : "star-outline"}
              size={20}
              active={favoritesOnly}
              disabled={!hasFavorites}
              onPress={() => setFavoritesOnly((v) => !v)}
              accessibilityLabel="Favorites only"
            />
          ) : null}
          {canShowStandings || canShowMotorsportStandings ? (
            <GlassIconButton
              name="list-outline"
              onPress={() => setStandingsOpen(true)}
              accessibilityLabel="View standings"
            />
          ) : null}
          <GlassIconButton
            name="settings-outline"
            onPress={() => router.push("/settings")}
            accessibilityLabel="Settings"
          />
        </View>
      </View>

      <View style={styles.tabsRow}>
        <FlatList
          horizontal
          data={tabs}
          keyExtractor={(t) => t.id}
          showsHorizontalScrollIndicator={false}
          // A horizontal FlatList clips to its own measured bounds (that's
          // fundamental to how scroll views work) — unlike the plain-View
          // rows elsewhere, giving the pill itself more internal padding
          // isn't enough here; the FlatList's own box needs extra height
          // beyond the pill's resting size or its press-bloom still clips.
          style={styles.tabsList}
          contentContainerStyle={styles.tabsListContent}
          renderItem={({ item }) => {
            const selected = item.id === activeTab;
            return (
              <Pressable
                onPress={() => setActiveTab(item.id)}
                accessibilityRole="tab"
                accessibilityLabel={item.label}
                accessibilityState={{ selected }}
              >
                <GlassView
                  glassEffectStyle="regular"
                  isInteractive
                  tintColor={selected ? Colors.accent : undefined}
                  style={styles.tab}
                >
                  {item.logo ? (
                    // White backdrop so dark/transparent logo art (several
                    // leagues have dark navy or black marks) doesn't disappear
                    // against the pill's own glass background.
                    <View style={styles.tabLogoBackdrop}>
                      <Image
                        source={{ uri: item.logo }}
                        style={styles.tabLogo}
                      />
                    </View>
                  ) : (
                    // "All" spans every league, so there's no official logo for it —
                    // still wrapped in a same-size circle (no white fill, just the
                    // icon) so this tile's content height matches every other tab's.
                    <View style={styles.tabIconWrap}>
                      <Ionicons
                        name="apps-outline"
                        size={20}
                        color={selected ? Colors.onAccent : Colors.text}
                      />
                    </View>
                  )}
                  <Text
                    style={[styles.tabText, selected && styles.tabTextSelected]}
                    numberOfLines={1}
                    maxFontSizeMultiplier={1.3}
                  >
                    {item.label}
                  </Text>
                </GlassView>
              </Pressable>
            );
          }}
          ListFooterComponent={
            <Pressable
              onPress={() => router.push("/settings/leagues")}
              accessibilityRole="button"
              accessibilityLabel="Add leagues"
            >
              <GlassView glassEffectStyle="regular" isInteractive style={styles.tab}>
                <View style={styles.tabIconWrap}>
                  <Ionicons name="add-outline" size={20} color={Colors.text} />
                </View>
                <Text style={styles.tabText} numberOfLines={1} maxFontSizeMultiplier={1.3}>
                  Add
                </Text>
              </GlassView>
            </Pressable>
          }
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
                selectedIndex={
                  selectedWeekIndex ?? nflCalendar.currentWeekIndex
                }
                onSelect={setSelectedWeekIndex}
              />
            ) : null}
          </View>
        ) : (
          <DateStrip mode={calendarMode} onSelectMode={setCalendarMode} />
        )
      ) : null}

      {isMotorsportTab ? (
        motorsportEvents === null ? (
          <GamesListSkeleton count={3} />
        ) : motorsportError ? (
          <View style={styles.emptyState} accessibilityLiveRegion="polite">
            <Ionicons
              name="cloud-offline-outline"
              size={28}
              color={Colors.textMuted}
            />
            <Text style={styles.empty}>
              Could not load schedule ({motorsportError}).
            </Text>
          </View>
        ) : motorsportEvents.upcoming.length === 0 &&
          motorsportEvents.past.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="flag-outline" size={28} color={Colors.textMuted} />
            <Text style={styles.empty}>No races scheduled.</Text>
          </View>
        ) : (
          <SectionList
            sections={motorsportSections}
            keyExtractor={(e) => e.id}
            contentContainerStyle={[
              styles.list,
              { paddingBottom: Spacing.s4 + insets.bottom },
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={Colors.accent}
              />
            }
            stickySectionHeadersEnabled={false}
            renderSectionHeader={({ section }) => (
              <Text style={styles.sectionHeader} accessibilityRole="header">
                {section.title}
              </Text>
            )}
            renderItem={({ item, section }) => (
              <MotorsportEventCard
                event={item}
                onOpen={handleOpenMotorsportEvent}
                featured={section.featured}
              />
            )}
          />
        )
      ) : isNflWeekTab || calendarMode !== "upcoming" ? (
        games === null ? (
          <GamesListSkeleton />
        ) : error ? (
          <View style={styles.emptyState} accessibilityLiveRegion="polite">
            <Ionicons
              name="cloud-offline-outline"
              size={28}
              color={Colors.textMuted}
            />
            <Text style={styles.empty}>Could not load games ({error}).</Text>
          </View>
        ) : visibleGames && visibleGames.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name={favoritesOnly ? "star-outline" : "calendar-outline"}
              size={28}
              color={Colors.textMuted}
            />
            <Text style={styles.empty}>{emptyMessage}</Text>
          </View>
        ) : (
          <FlatList
            data={visibleGames ?? []}
            keyExtractor={(g) => g.id}
            contentContainerStyle={[
              styles.list,
              { paddingBottom: Spacing.s4 + insets.bottom },
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={Colors.accent}
              />
            }
            renderItem={({ item }) => (
              <GameCard
                game={item}
                favorite={isFavoriteGame(item)}
                onOpen={handleOpenGame}
              />
            )}
            {...GAME_LIST_PERFORMANCE_PROPS}
          />
        )
      ) : visibleUpcomingSections === null ? (
        <GamesListSkeleton />
      ) : error ? (
        <View style={styles.emptyState} accessibilityLiveRegion="polite">
          <Ionicons
            name="cloud-offline-outline"
            size={28}
            color={Colors.textMuted}
          />
          <Text style={styles.empty}>Could not load games ({error}).</Text>
        </View>
      ) : visibleUpcomingSections.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons
            name={favoritesOnly ? "star-outline" : "calendar-outline"}
            size={28}
            color={Colors.textMuted}
          />
          <Text style={styles.empty}>{emptyMessage}</Text>
        </View>
      ) : (
        <SectionList
          sections={visibleUpcomingSections.map((section) => ({
            title: formatAgendaSectionLabel(section.date, today),
            data: section.games,
          }))}
          keyExtractor={(g) => g.id}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: Spacing.s4 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.accent}
            />
          }
          // Sticky headers default on for SectionList on iOS; a floating header
          // over a dense card list reads as a rendering glitch more than a
          // useful affordance here, so it's off.
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader} accessibilityRole="header">
              {section.title}
            </Text>
          )}
          renderItem={({ item }) => (
            <GameCard
              game={item}
              favorite={isFavoriteGame(item)}
              onOpen={handleOpenGame}
            />
          )}
          {...GAME_LIST_PERFORMANCE_PROPS}
        />
      )}

      <GameDetailModal
        game={openGame}
        leagueId={openGame?.leagueId ?? ""}
        leagueLabel={openGame ? leagueLabel(openGame.leagueId) : ""}
        onClose={() => setOpenGame(null)}
      />

      <MotorsportDetailModal
        event={openMotorsportEvent}
        leagueId={activeTab}
        leagueLabel={leagueLabel(activeTab)}
        onClose={() => setOpenMotorsportEvent(null)}
      />

      <StandingsModal
        visible={standingsOpen && canShowStandings}
        leagueId={activeTab}
        leagueLabel={leagueLabel(activeTab)}
        onClose={() => setStandingsOpen(false)}
      />

      <MotorsportStandingsModal
        visible={standingsOpen && canShowMotorsportStandings}
        leagueId={activeTab}
        leagueLabel={leagueLabel(activeTab)}
        onClose={() => setStandingsOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.s4,
    paddingVertical: Spacing.s2,
  },
  brand: {
    color: Colors.text,
    fontSize: 18,
    fontFamily: Fonts.bold,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  topbarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.s3,
  },
  calendarStrip: { height: 84, overflow: "hidden" },
  tabsRow: { paddingVertical: Spacing.s2 },
  // Taller than the pill's ~80px resting height (28px logo circle + gap +
  // text + 16px vertical padding each side) so the FlatList's own clipping
  // bounds have slack for the glass press-bloom.
  tabsList: { height: 96 },
  tabsListContent: {
    alignItems: "center",
    gap: Spacing.s2,
    paddingHorizontal: Spacing.s4,
  },
  tab: {
    width: 68,
    // More vertical padding than the content strictly needs — the glass
    // element's own bounds clip its interactive press-bloom, so the pill
    // needs headroom around its content, not just a tight fit.
    paddingVertical: Spacing.s3,
    paddingHorizontal: Spacing.s2,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  tabLogoBackdrop: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  // Same footprint as tabLogoBackdrop (no white fill) so the "All" tile's
  // content height — and therefore its glass pill's resting size — matches
  // every logo-based tab exactly.
  tabIconWrap: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  tabLogo: { width: 20, height: 20, resizeMode: "contain" },
  tabText: {
    color: Colors.text,
    fontSize: 12,
    fontFamily: Fonts.semibold,
    fontWeight: "600",
  },
  tabTextSelected: { color: Colors.onAccent },
  list: { padding: Spacing.s4, paddingTop: 0, gap: Spacing.s3 },
  emptyState: {
    alignItems: "center",
    gap: Spacing.s2,
    marginTop: Spacing.s6,
    paddingHorizontal: Spacing.s4,
  },
  empty: { color: Colors.textMuted, textAlign: "center" },
  sectionHeader: {
    color: Colors.text,
    fontSize: 15,
    fontFamily: Fonts.bold,
    fontWeight: "700",
    marginTop: Spacing.s1,
    marginBottom: Spacing.s1,
    backgroundColor: Colors.background,
  },
});
