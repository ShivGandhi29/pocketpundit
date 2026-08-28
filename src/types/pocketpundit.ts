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
   * (F1, IndyCar, NASCAR) are structurally different — one multi-driver
   * race, no home/away — and get their own schedule/results screens instead
   * of the score bug, box score, team stats, or AI analysis.
   */
  kind: 'team' | 'motorsport';
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
}

export interface MotorsportSession {
  id: string;
  /** "FP1", "Qual", "Race", etc. — falls back to "Race" for series that report a single un-typed session. */
  label: string;
  date: string;
  state: GameState;
  detail: string;
}

export interface MotorsportResult {
  position: number;
  driverName: string;
  countryFlag: string | null;
  winner: boolean;
}

export interface MotorsportEventDetail {
  sessions: MotorsportSession[];
  /** Empty until the race session is final. */
  results: MotorsportResult[];
  state: GameState;
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

export interface TeamStanding {
  record: string | null;
  streak: string | null;
  playoffSeed: string | null;
  pointDifferential: string | null;
}

export interface AppState {
  onboarded: boolean;
  selectedLeagueIds: string[];
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
