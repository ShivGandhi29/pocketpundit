export interface League {
  id: string;
  label: string;
  /** Compact form for tight spaces (e.g. "EPL" for Premier League, "UCL" for UEFA Champions League). */
  shortLabel: string;
  /** Official league logo, hosted on ESPN's CDN — same host/pattern already used for team logos. */
  logo: string;
  /** Shown by default in the league picker; leagues without this are search-only. */
  popular: boolean;
  /**
   * 'team' leagues fit the Game/GameTeam model (two sides, a score) that
   * every other screen in this app is built around. 'motorsport' leagues
   * (F1, IndyCar, NASCAR, and — despite the name — the PGA Tour) are
   * structurally different: a multi-day event with individual competitors
   * ranked on a leaderboard, not two sides with a score. They get their own
   * schedule/results screens instead of the score bug, box score, team
   * stats, or AI analysis.
   */
  kind: 'team' | 'motorsport';
  /** Groups leagues by sport in the league picker (e.g. all soccer leagues together). */
  sport:
    | 'football'
    | 'basketball'
    | 'baseball'
    | 'hockey'
    | 'soccer'
    | 'motorsport'
    | 'golf'
    | 'rugby'
    | 'australian-football';
}

export interface Team {
  id: string;
  name: string;
  abbreviation: string | null;
  logo: string | null;
  color?: string | null;
}

export interface FavoriteTeam extends Team {
  leagueId: string;
}

export interface LinescorePeriod {
  period: number;
  displayValue: string;
}

export interface GameTeam {
  id: string | null;
  name: string;
  abbreviation: string | null;
  logo: string | null;
  score: string | null;
  record: string | null;
  homeRecord: string | null;
  roadRecord: string | null;
  winner: boolean;
  linescores: LinescorePeriod[];
  color: string | null;
}

export type GameState = 'pre' | 'in' | 'post';

export interface MotorsportEvent {
  id: string;
  name: string;
  /** Race weekend start (first practice session), ISO UTC. */
  date: string;
  endDate: string;
  /** 1-based position in the season calendar. */
  round: number;
  /** The headline location, derived from the event name — a country for F1
   * ("Spanish Grand Prix" → "Spain"), a US state for NASCAR when the event
   * names one ("... at Kansas" → "Kansas"), null if nothing could be
   * matched. Not always literally a country, despite the flag field below
   * only ever holding a real national flag (never fabricated for a state). */
  locationName: string | null;
  /** A real national flag image — only ever set when locationName is an
   * actual country (F1). NASCAR's US-state locations have no flag here;
   * they get a state-flag-colored gradient instead (see flagColors.ts). */
  locationFlag: string | null;
}

export interface MotorsportSchedule {
  /** Not yet finished, soonest first — `upcoming[0]` is "the next race." */
  upcoming: MotorsportEvent[];
  /** Already finished, most recent first. */
  past: MotorsportEvent[];
}

export interface MotorsportResult {
  position: number;
  driverName: string;
  countryFlag: string | null;
  winner: boolean;
  /** Golf competitors carry a score-to-par (e.g. "-16") — live-checked,
   * motorsport competitors (F1/IndyCar/NASCAR) have no equivalent field at
   * all (no time, no gap), so this is null for every session there. */
  score: string | null;
}

export interface MotorsportSession {
  id: string;
  /** "FP1", "Qual", "Race", etc. — falls back to "Race" for series that report a single un-typed session. */
  label: string;
  date: string;
  state: GameState;
  detail: string;
  /** This session's own finishing/classification order — empty until it's
   * run. Every session ESPN reports (practice, qualifying, race) carries its
   * own competitor order, not just the race. */
  results: MotorsportResult[];
}

export interface MotorsportCircuit {
  name: string;
  /** "Monza, Italy" — city and country joined, when both are known. */
  location: string;
}

export interface MotorsportEventDetail {
  sessions: MotorsportSession[];
  circuit: MotorsportCircuit | null;
  /** The race session's own state, kept for the overall event's "is this
   * weekend done" styling. */
  state: GameState;
}

export interface MotorsportStandingEntry {
  rank: number;
  name: string;
  /** Drivers only — a constructor entry has no single nationality. */
  countryFlag: string | null;
  /** Constructors only — ESPN reports each team's brand color as a hex string. */
  teamColor: string | null;
  points: number;
}

export interface MotorsportStandings {
  drivers: MotorsportStandingEntry[];
  /** Empty for series with no separate teams'/manufacturers' championship
   * (e.g. IndyCar, NASCAR) — only F1 reported both when checked live. */
  constructors: MotorsportStandingEntry[];
}

export type SeasonStage = 'Preseason' | 'Regular season' | 'Postseason';

export interface Game {
  id: string;
  date: string;
  shortName: string;
  state: GameState;
  detail: string;
  completed: boolean;
  home: GameTeam;
  away: GameTeam;
  venue: string | null;
  /** "Seattle, WA" / "Bournemouth, England" — city plus state (US venues) or
   * country (everywhere else), whichever ESPN's venue address actually
   * carries. Null whenever venue itself is null or the address has neither. */
  venueLocation: string | null;
  leagueId: string;
  /** ESPN's own live win-probability model, present only once a game is in progress. */
  liveWinProbability: { home: number; away: number } | null;
  /** Whether this is a preseason, regular-season, or postseason game. */
  seasonStage: SeasonStage;
}

export interface TeamInjury {
  playerName: string;
  position: string | null;
  status: string | null;
}

/** ESPN's own pregame "Matchup Predictor" (BPI-based) — distinct from the
 * live in-game win-probability model, and only computed once ESPN has run
 * it for a given game (absent for games far enough out, not an error). */
export interface GamePredictor {
  homeWinPct: number;
  awayWinPct: number;
}

export interface TeamStanding {
  record: string | null;
  streak: string | null;
  playoffSeed: string | null;
  pointDifferential: string | null;
}

export interface AppState {
  onboarded: boolean;
  selectedLeagueIds: string[];
  /** Keyed by `${leagueId}:${team.id}`, not team.id alone — ESPN scopes team
   * ids per league, so two teams in different leagues can share a raw id. */
  favoriteTeams: Record<string, FavoriteTeam>;
}

export interface GameLeaderEntry {
  displayValue: string;
  athleteName: string;
  headshot: string | null;
  position: string | null;
}

export interface GameLeaderCategory {
  name: string;
  displayName: string;
  leaders: GameLeaderEntry[];
}

export interface TeamLeaders {
  teamId: string;
  categories: GameLeaderCategory[];
}

export interface TeamStat {
  name: string;
  label: string;
  displayValue: string;
  /**
   * ESPN's own numeric value for this stat — already-computed ratios for
   * efficiency stats (e.g. 3rd-down "7-14" → 0.5) and seconds for possession
   * time ("27:24" → 1644), which are impractical to re-derive from the
   * display string. Inconsistently present: several compound counting stats
   * (total yards, comp/att, penalties) send the literal string "-" instead
   * of a number, so this is null whenever ESPN's value isn't a finite number.
   */
  value: number | null;
}

export interface TeamStatLine {
  teamId: string;
  homeAway: 'home' | 'away';
  stats: TeamStat[];
}

export interface PlayerStatLine {
  athleteName: string;
  jersey: string | null;
  stats: string[];
}

export interface PlayerStatGroup {
  category: string;
  labels: string[];
  athletes: PlayerStatLine[];
}

export interface TeamBoxscore {
  teamId: string;
  groups: PlayerStatGroup[];
}

export interface GameSummary {
  leaders: TeamLeaders[];
  teamStats: TeamStatLine[];
  boxscore: TeamBoxscore[];
}

export interface SeasonWeek {
  /** e.g. "Preseason Week 3" or "Week 1" — the full ESPN label. */
  label: string;
  /** e.g. "Pre Wk 3" or "Week 1" — ESPN's own shorter label, for compact UI. */
  shortLabel: string;
  /** e.g. "Aug 27-Sep 5" — a human date range, not used for the compact pill. */
  detail: string;
  weekValue: string;
  seasonTypeValue: string;
  startDate: string;
}

export interface WeekCalendar {
  weeks: SeasonWeek[];
  /** Index into `weeks` matching the league's current week right now. */
  currentWeekIndex: number;
}

export interface StandingsColumn {
  label: string;
  value: string;
}

export interface StandingsRow {
  teamId: string;
  teamName: string;
  abbreviation: string | null;
  logo: string | null;
  rank: number;
  columns: StandingsColumn[];
}

export interface StandingsGroup {
  id: string;
  name: string;
  columnLabels: string[];
  rows: StandingsRow[];
}

export interface ScheduleGame {
  id: string;
  date: string;
  isHome: boolean;
  opponent: { id: string; name: string; abbreviation: string | null; logo: string | null };
  state: GameState;
  detail: string;
  teamScore: string | null;
  opponentScore: string | null;
  result: 'W' | 'L' | 'T' | null;
}
