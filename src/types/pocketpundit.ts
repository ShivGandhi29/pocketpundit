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
}

export interface AppState {
  onboarded: boolean;
  selectedLeagueIds: string[];
  favoriteTeams: Record<string, FavoriteTeam>;
}

export interface AnalyzeResult {
  analysis: string;
  model: string;
}

export interface ApiErrorPayload {
  error?: string;
  detail?: string;
}
