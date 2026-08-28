import type { Game, League, ScheduleGame, Team } from '@/types/pocketpundit';

// No CORS proxy needed here: this app is native (iOS/Android), and CORS is a
// browser-enforced restriction that doesn't apply to native fetch calls.
export const LEAGUES: League[] = [
  { id: 'nfl', label: 'NFL' },
  { id: 'nba', label: 'NBA' },
  { id: 'mlb', label: 'MLB' },
  { id: 'nhl', label: 'NHL' },
  { id: 'epl', label: 'Premier League' },
];

const LEAGUE_PATHS: Record<string, { sport: string; league: string }> = {
  nfl: { sport: 'football', league: 'nfl' },
  nba: { sport: 'basketball', league: 'nba' },
  mlb: { sport: 'baseball', league: 'mlb' },
  nhl: { sport: 'hockey', league: 'nhl' },
  epl: { sport: 'soccer', league: 'eng.1' },
};

// ESPN's schedule endpoint defaults to preseason for the American leagues
// (season type 1) unless told otherwise; `2` is the regular season. EPL has
// no such split — it's one continuous league season — so no param is sent
// for it.
const REGULAR_SEASON_TYPE: Record<string, number | undefined> = {
  nfl: 2,
  nba: 2,
  mlb: 2,
  nhl: 2,
};

export class ApiError extends Error {
  detail?: string;
  constructor(message: string, detail?: string) {
    super(message);
    this.detail = detail;
  }
}

function leaguePath(leagueId: string): { sport: string; league: string } {
  const path = LEAGUE_PATHS[leagueId];
  if (!path) throw new ApiError(`Unknown league id: ${leagueId}`);
  return path;
}

async function fetchEspn<T>(url: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url);
  } catch (err) {
    throw new ApiError('Could not reach ESPN.', err instanceof Error ? err.message : String(err));
  }
  if (!res.ok) {
    throw new ApiError(`ESPN responded ${res.status}`);
  }
  return res.json();
}

function simplifyTeams(payload: any): Team[] {
  const teams = payload?.sports?.[0]?.leagues?.[0]?.teams ?? [];
  return teams
    .map((entry: any) => entry.team)
    .filter(Boolean)
    .map((team: any) => ({
      id: team.id,
      name: team.displayName || team.name,
      abbreviation: team.abbreviation ?? null,
      logo: team.logos?.[0]?.href ?? null,
      color: team.color ? `#${team.color}` : null,
    }))
    .sort((a: Team, b: Team) => a.name.localeCompare(b.name));
}

function simplifyGames(payload: any): Omit<Game, 'leagueId'>[] {
  const events = Array.isArray(payload?.events) ? payload.events : [];
  return events.map((event: any) => {
    const competition = event.competitions?.[0] ?? {};
    const competitors = competition.competitors ?? [];
    const home = competitors.find((c: any) => c.homeAway === 'home') ?? {};
    const away = competitors.find((c: any) => c.homeAway === 'away') ?? {};
    const status = event.status?.type ?? {};
    const findRecord = (c: any, type: string) => c.records?.find((r: any) => r.type === type)?.summary ?? null;
    const toTeam = (c: any) => ({
      id: c.team?.id ?? null,
      name: c.team?.displayName || c.team?.name || 'Unknown',
      abbreviation: c.team?.abbreviation ?? null,
      logo: c.team?.logo ?? null,
      score: c.score ?? null,
      record: c.records?.find((r: any) => r.type === 'total')?.summary ?? c.records?.[0]?.summary ?? null,
      homeRecord: findRecord(c, 'home'),
      roadRecord: findRecord(c, 'road'),
      winner: !!c.winner,
    });
    // ESPN's own live win-probability model, attached to the most recent play. Only
    // present once a game is in progress — there's no pregame equivalent in this feed.
    const probability = competition.situation?.lastPlay?.probability;
    const liveWinProbability =
      probability?.homeWinPercentage != null && probability?.awayWinPercentage != null
        ? { home: probability.homeWinPercentage, away: probability.awayWinPercentage }
        : null;
    return {
      id: event.id,
      date: event.date,
      shortName: event.shortName || event.name,
      state: status.state || 'pre',
      detail: status.detail || status.shortDetail || '',
      completed: !!status.completed,
      home: toTeam(home),
      away: toTeam(away),
      venue: competition.venue?.fullName ?? null,
      liveWinProbability,
    };
  });
}

function simplifySchedule(payload: any, teamId: string): ScheduleGame[] {
  const events = Array.isArray(payload?.events) ? payload.events : [];
  return events.map((event: any) => {
    const competition = event.competitions?.[0] ?? {};
    const competitors = competition.competitors ?? [];
    const mine = competitors.find((c: any) => c.team?.id === teamId) ?? {};
    const opponent = competitors.find((c: any) => c.team?.id !== teamId) ?? {};
    const status = competition.status?.type ?? {};
    const scoreOf = (c: any) => (c.score?.displayValue ?? c.score?.value ?? c.score ?? null)?.toString() ?? null;

    let result: ScheduleGame['result'] = null;
    if (status.completed) {
      if (mine.winner) result = 'W';
      else if (opponent.winner) result = 'L';
      else result = 'T';
    }

    return {
      id: event.id,
      date: event.date,
      isHome: mine.homeAway === 'home',
      opponent: {
        id: opponent.team?.id ?? null,
        name: opponent.team?.displayName || opponent.team?.name || 'Unknown',
        abbreviation: opponent.team?.abbreviation ?? null,
        logo: opponent.team?.logos?.[0]?.href ?? opponent.team?.logo ?? null,
      },
      state: status.state || 'pre',
      detail: status.detail || status.shortDetail || '',
      teamScore: scoreOf(mine),
      opponentScore: scoreOf(opponent),
      result,
    };
  });
}

export async function getTeamSchedule(leagueId: string, teamId: string): Promise<ScheduleGame[]> {
  const { sport, league } = leaguePath(leagueId);
  const seasonType = REGULAR_SEASON_TYPE[leagueId];
  const query = seasonType ? `?seasontype=${seasonType}` : '';
  const payload = await fetchEspn(
    `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/teams/${teamId}/schedule${query}`
  );
  return simplifySchedule(payload, teamId);
}

export async function getTeams(leagueId: string): Promise<Team[]> {
  const { sport, league } = leaguePath(leagueId);
  const payload = await fetchEspn(
    `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/teams?limit=100`
  );
  return simplifyTeams(payload);
}

export async function getGames(leagueId: string): Promise<Omit<Game, 'leagueId'>[]> {
  const { sport, league } = leaguePath(leagueId);
  const payload = await fetchEspn(`https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/scoreboard`);
  return simplifyGames(payload);
}
