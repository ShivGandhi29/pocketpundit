export interface League {
  id: string;
  label: string;
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
}

export type GameState = 'pre' | 'in' | 'post';

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
}

export interface AppState {
  onboarded: boolean;
  selectedLeagueIds: string[];
  favoriteTeams: Record<string, FavoriteTeam>;
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
