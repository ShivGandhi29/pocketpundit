import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/AppText';

import { getGameSummary } from '@/services/api';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { Fonts } from '@/constants/fonts';
import type {
  Game,
  GameLeaderEntry,
  GameSummary,
  GameTeam,
  PlayerStatGroup,
  TeamStat,
  TeamStatLine,
} from '@/types/pocketpundit';

type Tab = 'leaders' | 'boxscore' | 'teamstats';

const TABS: { id: Tab; label: string }[] = [
  { id: 'leaders', label: 'Leaders' },
  { id: 'boxscore', label: 'Box Score' },
  { id: 'teamstats', label: 'Team Stats' },
];

function teamFor(teamId: string | null, game: Game): GameTeam | null {
  if (!teamId) return null;
  if (game.home.id === teamId) return game.home;
  if (game.away.id === teamId) return game.away;
  return null;
}

// ESPN's leader displayValue is "context, headline" (e.g. "7/12, 79 YDS" —
// completions/attempts, then yards; "8 CAR, 35 YDS" — carries, then yards).
// Splitting on the last comma separates that consistently without needing
// per-category/per-sport parsing rules. If there's no comma at all (a
// single-value stat like a sack count), it's shown as one line, nothing lost.
function splitLeaderValue(displayValue: string): { primary: string; secondary: string | null } {
  const idx = displayValue.lastIndexOf(',');
  if (idx === -1) return { primary: displayValue, secondary: null };
  return { primary: displayValue.slice(0, idx).trim(), secondary: displayValue.slice(idx + 1).trim() };
}

function LeaderCard({ leader, align }: { leader: GameLeaderEntry | undefined; align: 'left' | 'right' }) {
  if (!leader) return <View style={styles.leaderCard} />;
  const { primary, secondary } = splitLeaderValue(leader.displayValue);
  return (
    <View style={[styles.leaderCard, align === 'right' && styles.leaderCardReverse]}>
      {leader.headshot ? (
        <Image source={{ uri: leader.headshot }} style={styles.leaderHeadshot} />
      ) : (
        <View style={styles.leaderHeadshot} />
      )}
      <View style={[styles.leaderCardInfo, align === 'right' && styles.leaderCardInfoRight]}>
        <Text style={[styles.leaderCardValue, align === 'right' && styles.textRight]}>{primary}</Text>
        {secondary ? (
          <Text style={[styles.leaderCardSecondary, align === 'right' && styles.textRight]}>{secondary}</Text>
        ) : null}
        <Text style={[styles.leaderCardName, align === 'right' && styles.textRight]}>
          {leader.athleteName}
          {leader.position ? ` · ${leader.position}` : ''}
        </Text>
      </View>
    </View>
  );
}

function LeadersTab({ summary, game }: { summary: GameSummary; game: Game }) {
  const awayLeaders = summary.leaders.find((l) => l.teamId === game.away.id);
  const homeLeaders = summary.leaders.find((l) => l.teamId === game.home.id);
  if (!awayLeaders && !homeLeaders) {
    return <Text style={styles.empty}>No leader data available for this game.</Text>;
  }
  // Category order/labels come from whichever side has the fuller list — the
  // two teams' category sets are the same in practice, but this is a safe fallback.
  const categories =
    (awayLeaders?.categories.length ?? 0) >= (homeLeaders?.categories.length ?? 0)
      ? awayLeaders?.categories
      : homeLeaders?.categories;

  return (
    <View>
      <View style={styles.leadersTeamHeader}>
        <View style={styles.leadersTeamHeaderSide}>
          {game.away.logo ? <Image source={{ uri: game.away.logo }} style={styles.leadersTeamLogo} /> : null}
          <Text style={styles.leadersTeamAbbr}>{game.away.abbreviation}</Text>
        </View>
        <View style={[styles.leadersTeamHeaderSide, styles.leadersTeamHeaderSideRight]}>
          <Text style={styles.leadersTeamAbbr}>{game.home.abbreviation}</Text>
          {game.home.logo ? <Image source={{ uri: game.home.logo }} style={styles.leadersTeamLogo} /> : null}
        </View>
      </View>

      {categories?.map((cat) => {
        const awayLeader = awayLeaders?.categories.find((c) => c.name === cat.name)?.leaders[0];
        const homeLeader = homeLeaders?.categories.find((c) => c.name === cat.name)?.leaders[0];
        if (!awayLeader && !homeLeader) return null;
        return (
          <View key={cat.name} style={styles.leaderCompareRow}>
            <Text style={styles.leaderCompareLabel}>{cat.displayName}</Text>
            <View style={styles.leaderCompareTeams}>
              <LeaderCard leader={awayLeader} align="left" />
              <LeaderCard leader={homeLeader} align="right" />
            </View>
          </View>
        );
      })}
    </View>
  );
}

function StatGroupTable({ group }: { group: PlayerStatGroup }) {
  if (!group.athletes.length) return null;
  return (
    <View style={styles.statGroup}>
      <Text style={styles.statGroupLabel}>{group.category}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <View style={styles.boxRow}>
            <Text style={[styles.boxCell, styles.boxNameCell, styles.boxHeadText]}>Player</Text>
            {group.labels.map((label) => (
              <Text key={label} style={[styles.boxCell, styles.boxHeadText]}>
                {label}
              </Text>
            ))}
          </View>
          {group.athletes.map((a, i) => (
            <View key={i} style={styles.boxRow}>
              <Text style={[styles.boxCell, styles.boxNameCell]} numberOfLines={1}>
                {a.athleteName}
              </Text>
              {a.stats.map((s, j) => (
                <Text key={j} style={styles.boxCell}>
                  {s}
                </Text>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function BoxScoreTab({ summary, game }: { summary: GameSummary; game: Game }) {
  const [activeTeamId, setActiveTeamId] = useState<string | null>(game.away.id);

  if (!summary.boxscore.length) {
    return <Text style={styles.empty}>No box score available for this game.</Text>;
  }

  const teamBox = summary.boxscore.find((t) => t.teamId === activeTeamId) ?? summary.boxscore[0];
  const team = teamFor(teamBox.teamId, game);

  return (
    <View>
      <View style={styles.teamToggleRow}>
        {([game.away, game.home] as const).map((t) => {
          const selected = t.id === (teamBox.teamId ?? activeTeamId);
          return (
            <Pressable
              key={t.id ?? t.abbreviation}
              onPress={() => setActiveTeamId(t.id)}
              style={[styles.teamToggle, selected && styles.teamToggleSelected]}
            >
              {t.logo ? <Image source={{ uri: t.logo }} style={styles.teamToggleLogo} /> : null}
              <Text style={[styles.teamToggleText, selected && styles.teamToggleTextSelected]}>
                {t.abbreviation}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.teamHeaderRow}>
        {team?.logo ? <Image source={{ uri: team.logo }} style={styles.teamHeaderLogo} /> : null}
        <Text style={styles.teamHeaderText}>{team?.name ?? 'Team'}</Text>
      </View>
      {teamBox.groups.map((g, i) => (
        <StatGroupTable key={i} group={g} />
      ))}
    </View>
  );
}

// Prefer ESPN's own numeric value (handles pre-computed ratios like 3rd-down
// efficiency and possession-time-in-seconds that can't be cleanly re-derived
// from the display string). It's null for a handful of compound counting
// stats (total yards, comp/att, penalties) that send "-" instead of a
// number — parseFloat on the display string is a reasonable fallback there:
// it reads the leading number, which for those specific stats is exactly
// the count that should drive the bar (e.g. "18/31" → 18 completions).
function statMagnitude(stat: TeamStat): number {
  if (stat.value != null) return stat.value;
  const parsed = parseFloat(stat.displayValue);
  return Number.isFinite(parsed) ? parsed : 0;
}

function TeamStatBar({ awayValue, homeValue }: { awayValue: number; homeValue: number }) {
  const total = awayValue + homeValue;
  if (total <= 0) return <View style={styles.teamStatsBarTrack} />;
  const awayShare = awayValue / total;
  return (
    <View style={styles.teamStatsBarTrack}>
      <View style={[styles.teamStatsBarAway, { flex: awayShare }]} />
      <View style={[styles.teamStatsBarHome, { flex: 1 - awayShare }]} />
    </View>
  );
}

function TeamStatsTab({ summary, game }: { summary: GameSummary; game: Game }) {
  const away = summary.teamStats.find((t) => t.homeAway === 'away') as TeamStatLine | undefined;
  const home = summary.teamStats.find((t) => t.homeAway === 'home') as TeamStatLine | undefined;
  if (!away || !home) {
    return <Text style={styles.empty}>No team stats available for this game.</Text>;
  }
  return (
    <View>
      <View style={styles.teamStatsHeaderRow}>
        <View style={styles.teamStatsHeaderSide}>
          {game.away.logo ? <Image source={{ uri: game.away.logo }} style={styles.teamStatsHeaderLogo} /> : null}
          <Text style={styles.teamStatsHeaderTeam} numberOfLines={1}>
            {game.away.abbreviation}
          </Text>
        </View>
        <View style={[styles.teamStatsHeaderSide, styles.teamStatsHeaderSideRight]}>
          <Text style={styles.teamStatsHeaderTeam} numberOfLines={1}>
            {game.home.abbreviation}
          </Text>
          {game.home.logo ? <Image source={{ uri: game.home.logo }} style={styles.teamStatsHeaderLogo} /> : null}
        </View>
      </View>
      {home.stats.map((homeStat, i) => {
        // Paired by index, not by matching `name`: some sports' stat arrays
        // reuse the same name for two different rows (NFL's `statistics`
        // includes `interceptions` twice — passing INTs thrown and defensive
        // INTs made) so a name lookup can silently pair the wrong two values.
        // Both teams' arrays share the same schema and order, so index is safe.
        const awayStat = away.stats[i];
        return (
          <View key={i} style={styles.teamStatsRow}>
            <View style={styles.teamStatsValuesRow}>
              <Text style={styles.teamStatsValue}>{awayStat?.displayValue ?? '-'}</Text>
              <Text style={styles.teamStatsLabel} numberOfLines={1}>
                {homeStat.label}
              </Text>
              <Text style={[styles.teamStatsValue, styles.textRight]}>{homeStat.displayValue}</Text>
            </View>
            {awayStat ? (
              <TeamStatBar awayValue={statMagnitude(awayStat)} homeValue={statMagnitude(homeStat)} />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

export function GameStatsTabs({ game, leagueId }: { game: Game; leagueId: string }) {
  const [activeTab, setActiveTab] = useState<Tab>('leaders');
  const [summary, setSummary] = useState<GameSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setSummary(null);
    setError(null);
    getGameSummary(leagueId, game.id)
      .then((result) => {
        if (!cancelled) setSummary(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load game stats');
      });
    return () => {
      cancelled = true;
    };
  }, [leagueId, game.id]);

  return (
    <View>
      <View style={styles.tabRow}>
        {TABS.map((tab) => {
          const selected = tab.id === activeTab;
          return (
            <Pressable key={tab.id} onPress={() => setActiveTab(tab.id)} style={[styles.tab, selected && styles.tabSelected]}>
              <Text style={[styles.tabText, selected && styles.tabTextSelected]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {error ? (
        <Text style={styles.empty}>Could not load stats ({error}).</Text>
      ) : !summary ? (
        <ActivityIndicator color={Colors.accent} style={{ marginVertical: Spacing.s4 }} />
      ) : activeTab === 'leaders' ? (
        <LeadersTab summary={summary} game={game} />
      ) : activeTab === 'boxscore' ? (
        <BoxScoreTab summary={summary} game={game} />
      ) : (
        <TeamStatsTab summary={summary} game={game} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: 'row',
    gap: Spacing.s2,
    marginBottom: Spacing.s3,
  },
  tab: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: Spacing.s3,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  tabSelected: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  tabText: { color: Colors.text, fontSize: 13, fontFamily: Fonts.semibold, fontWeight: '600' },
  tabTextSelected: { color: Colors.onAccent },
  empty: { color: Colors.textMuted, fontSize: 14, textAlign: 'center', marginVertical: Spacing.s4 },
  teamToggleRow: { flexDirection: 'row', gap: Spacing.s2, marginBottom: Spacing.s3 },
  teamToggle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.s2,
    minHeight: 44,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  teamToggleSelected: { backgroundColor: Colors.surfaceRaised, borderColor: Colors.accent },
  teamToggleLogo: { width: 20, height: 20, resizeMode: 'contain' },
  teamToggleText: { color: Colors.textMuted, fontSize: 14, fontFamily: Fonts.bold, fontWeight: '700' },
  teamToggleTextSelected: { color: Colors.text },
  teamHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.s2, marginBottom: Spacing.s2 },
  teamHeaderLogo: { width: 22, height: 22, resizeMode: 'contain' },
  teamHeaderText: { color: Colors.text, fontSize: 15, fontFamily: Fonts.bold, fontWeight: '700' },
  leadersTeamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.s3,
    paddingBottom: Spacing.s3,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  leadersTeamHeaderSide: { flexDirection: 'row', alignItems: 'center', gap: Spacing.s2 },
  leadersTeamHeaderSideRight: { flexDirection: 'row-reverse' },
  leadersTeamLogo: { width: 26, height: 26, resizeMode: 'contain' },
  leadersTeamAbbr: { color: Colors.text, fontSize: 15, fontFamily: Fonts.extrabold, fontWeight: '800' },
  leaderCompareRow: {
    paddingVertical: Spacing.s3,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  leaderCompareLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: Fonts.bold, fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.s2,
  },
  leaderCompareTeams: { flexDirection: 'row', justifyContent: 'space-between' },
  leaderCard: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.s2 },
  leaderCardReverse: { flexDirection: 'row-reverse' },
  leaderHeadshot: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surface },
  leaderCardInfo: { flex: 1 },
  leaderCardInfoRight: { alignItems: 'flex-end' },
  leaderCardValue: { color: Colors.text, fontSize: 13, fontFamily: Fonts.extrabold, fontWeight: '800', fontVariant: ['tabular-nums'] },
  leaderCardSecondary: { color: Colors.textMuted, fontSize: 11, fontVariant: ['tabular-nums'], marginTop: 1 },
  leaderCardName: { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  textRight: { textAlign: 'right' },
  statGroup: { marginBottom: Spacing.s3 },
  statGroupLabel: { color: Colors.accent, fontSize: 13, fontFamily: Fonts.bold, fontWeight: '700', marginBottom: Spacing.s1 },
  boxRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border },
  boxCell: {
    width: 56,
    paddingVertical: Spacing.s1,
    color: Colors.text,
    fontSize: 12,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  boxNameCell: { width: 120, textAlign: 'left', fontFamily: Fonts.semibold, fontWeight: '600' },
  boxHeadText: { color: Colors.textMuted, fontFamily: Fonts.bold, fontWeight: '700' },
  teamStatsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.s3,
    paddingBottom: Spacing.s2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  teamStatsHeaderSide: { flexDirection: 'row', alignItems: 'center', gap: Spacing.s2 },
  teamStatsHeaderSideRight: { flexDirection: 'row-reverse' },
  teamStatsHeaderLogo: { width: 20, height: 20, resizeMode: 'contain' },
  teamStatsHeaderTeam: { color: Colors.text, fontSize: 13, fontFamily: Fonts.bold, fontWeight: '700' },
  teamStatsRow: {
    paddingVertical: Spacing.s2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  teamStatsValuesRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.s1 },
  teamStatsValue: { flex: 1, color: Colors.text, fontSize: 14, fontFamily: Fonts.bold, fontWeight: '700' },
  teamStatsLabel: { flex: 1.4, color: Colors.textMuted, fontSize: 12, textAlign: 'center' },
  teamStatsBarTrack: {
    flexDirection: 'row',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: Colors.border,
  },
  teamStatsBarAway: { backgroundColor: Colors.textMuted },
  teamStatsBarHome: { backgroundColor: Colors.accent },
});
