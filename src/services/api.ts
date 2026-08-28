import type { Game, League, ScheduleGame, SeasonStage, Team, TeamInjury, TeamStanding } from '@/types/pocketpundit';

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

// American leagues expose season.type as 1/2/3 (pre/regular/post). Soccer
// (EPL) has no such split — type is an arbitrary competition id and the
// whole thing is just "the season" — so anything not clearly 1 or 3 is
// treated as a regular-season game, which is the accurate framing for both
// the "type 2" American case and every soccer fixture.
function seasonStageFromEvent(event: any): SeasonStage {
  const type = event.season?.type;
  const slug: string = event.season?.slug ?? '';
  if (type === 1 || slug.includes('preseason')) return 'Preseason';
  if (type === 3 || slug.includes('postseason') || slug.includes('playoff')) return 'Postseason';
  return 'Regular season';
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
      seasonStage: seasonStageFromEvent(event),
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

export async function getTeamInjuries(leagueId: string, teamId: string): Promise<TeamInjury[]> {
  const { sport, league } = leaguePath(leagueId);
  const payload = await fetchEspn<any>(
    `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/teams/${teamId}/roster`
  );
  const groups = Array.isArray(payload?.athletes) ? payload.athletes : [];
  const injured: TeamInjury[] = [];
  for (const group of groups) {
    for (const player of group.items ?? []) {
      if (player.injuries?.length) {
        injured.push({
          playerName: player.displayName ?? player.fullName ?? 'Unknown player',
          position: player.position?.abbreviation ?? null,
          status: player.injuries[0]?.status ?? null,
        });
      }
    }
  }
  // Cap it — a compact list of who's out is useful grounding for the AI prompt;
  // a full injury report for every roster spot is just noise for that purpose.
  return injured.slice(0, 8);
}

// Standings lives under a different base path than every other endpoint here
// (no "/site/" segment) — verified against the live API while building this.
function findStandingsEntry(node: any, teamId: string): any {
  const entries = node?.standings?.entries;
  if (Array.isArray(entries)) {
    const match = entries.find((e: any) => e.team?.id === teamId);
    if (match) return match;
  }
  for (const child of node?.children ?? []) {
    const found = findStandingsEntry(child, teamId);
    if (found) return found;
  }
  return null;
}

export async function getTeamStanding(leagueId: string, teamId: string): Promise<TeamStanding | null> {
  const { sport, league } = leaguePath(leagueId);
  const payload = await fetchEspn<any>(`https://site.api.espn.com/apis/v2/sports/${sport}/${league}/standings`);
  const entry = findStandingsEntry(payload, teamId);
  if (!entry) return null;
  const stat = (name: string) => entry.stats?.find((s: any) => s.name === name)?.displayValue ?? null;
  return {
    record: stat('overall'),
    streak: stat('streak'),
    playoffSeed: stat('playoffSeed'),
    pointDifferential: stat('pointDifferential'),
  };
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
