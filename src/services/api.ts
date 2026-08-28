import type {
  Game,
  GameSummary,
  League,
  MotorsportEvent,
  MotorsportEventDetail,
  ScheduleGame,
  SeasonStage,
  Team,
  TeamInjury,
  TeamStanding,
  WeekCalendar,
} from '@/types/pocketpundit';

// No CORS proxy needed here: this app is native (iOS/Android), and CORS is a
// browser-enforced restriction that doesn't apply to native fetch calls.
//
// Logo URLs verified live against each league's own scoreboard response
// (leagues[0].logos) rather than guessed: four of five follow ESPN's
// predictable `teamlogos/leagues/500/{slug}.png` pattern, but soccer leagues
// are keyed by an opaque numeric ESPN league id (23 = English Premier
// League) with no derivable relationship to the "eng.1" slug used elsewhere,
// so that one has to be a verified constant rather than a computed one.
// `popular: true` leagues show by default in the league picker; the rest
// are search-only — added here so search has something beyond the original
// five to actually find, without cluttering the default view. All six
// additions are soccer leagues since that's the sport ESPN's API supports
// the most breadth of under the same verified request shape as EPL already
// uses (soccer/{slug}, no seasontype split needed).
export const LEAGUES: League[] = [
  { id: 'nfl', label: 'NFL', shortLabel: 'NFL', logo: 'https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png', popular: true, kind: 'team' },
  { id: 'nba', label: 'NBA', shortLabel: 'NBA', logo: 'https://a.espncdn.com/i/teamlogos/leagues/500/nba.png', popular: true, kind: 'team' },
  { id: 'mlb', label: 'MLB', shortLabel: 'MLB', logo: 'https://a.espncdn.com/i/teamlogos/leagues/500/mlb.png', popular: true, kind: 'team' },
  { id: 'nhl', label: 'NHL', shortLabel: 'NHL', logo: 'https://a.espncdn.com/i/teamlogos/leagues/500/nhl.png', popular: true, kind: 'team' },
  {
    id: 'epl',
    label: 'Premier League',
    shortLabel: 'EPL',
    logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/23.png',
    popular: true,
    kind: 'team',
  },
  {
    id: 'laliga',
    label: 'LaLiga',
    shortLabel: 'LALIGA',
    logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/15.png',
    popular: false,
    kind: 'team',
  },
  {
    id: 'bundesliga',
    label: 'Bundesliga',
    shortLabel: 'BUND',
    logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/10.png',
    popular: false,
    kind: 'team',
  },
  {
    id: 'seriea',
    label: 'Serie A',
    shortLabel: 'SERIE A',
    logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/12.png',
    popular: false,
    kind: 'team',
  },
  {
    id: 'ligue1',
    label: 'Ligue 1',
    shortLabel: 'LIGUE 1',
    logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/9.png',
    popular: false,
    kind: 'team',
  },
  {
    id: 'ucl',
    label: 'UEFA Champions League',
    shortLabel: 'UCL',
    logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/2.png',
    popular: false,
    kind: 'team',
  },
  {
    id: 'mls',
    label: 'MLS',
    shortLabel: 'MLS',
    logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/19.png',
    popular: false,
    kind: 'team',
  },
  // Motorsport: a fundamentally different shape (one multi-driver race, no
  // home/away) — see the `kind` field doc on League. F1's own schedule is
  // shown, not hidden behind search, since it's what was explicitly asked
  // for; IndyCar/NASCAR are included as the other "motorsport options" but
  // kept search-only so they don't crowd the default list.
  {
    id: 'f1',
    label: 'Formula 1',
    shortLabel: 'F1',
    logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/leagues/500/f1.png',
    popular: true,
    kind: 'motorsport',
  },
  {
    id: 'indycar',
    label: 'IndyCar Series',
    shortLabel: 'INDYCAR',
    logo: 'https://a.espncdn.com/combiner/i?img=/i/espn/teamlogos/500/indycar_series.png',
    popular: false,
    kind: 'motorsport',
  },
  {
    id: 'nascar',
    label: 'NASCAR Cup Series',
    shortLabel: 'NASCAR',
    logo: 'https://a.espncdn.com/combiner/i?img=/redesign/assets/img/icons/ESPN-icon-NASCAR.png',
    popular: false,
    kind: 'motorsport',
  },
];

const LEAGUE_PATHS: Record<string, { sport: string; league: string }> = {
  nfl: { sport: 'football', league: 'nfl' },
  nba: { sport: 'basketball', league: 'nba' },
  mlb: { sport: 'baseball', league: 'mlb' },
  nhl: { sport: 'hockey', league: 'nhl' },
  epl: { sport: 'soccer', league: 'eng.1' },
  laliga: { sport: 'soccer', league: 'esp.1' },
  f1: { sport: 'racing', league: 'f1' },
  indycar: { sport: 'racing', league: 'irl' },
  nascar: { sport: 'racing', league: 'nascar-premier' },
  bundesliga: { sport: 'soccer', league: 'ger.1' },
  seriea: { sport: 'soccer', league: 'ita.1' },
  ligue1: { sport: 'soccer', league: 'fra.1' },
  ucl: { sport: 'soccer', league: 'uefa.champions' },
  mls: { sport: 'soccer', league: 'usa.1' },
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
      linescores: (c.linescores ?? []).map((l: any) => ({ period: l.period, displayValue: l.displayValue })),
      color: c.team?.color ? `#${c.team.color}` : null,
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

function simplifySummary(payload: any): GameSummary {
  const leaders: GameSummary['leaders'] = (payload?.leaders ?? []).map((entry: any) => ({
    teamId: entry.team?.id ?? null,
    categories: (entry.leaders ?? []).map((cat: any) => ({
      name: cat.name,
      displayName: cat.displayName,
      leaders: (cat.leaders ?? []).map((l: any) => ({
        displayValue: l.displayValue,
        athleteName: l.athlete?.displayName ?? 'Unknown',
        headshot: l.athlete?.headshot?.href ?? null,
        position: l.athlete?.position?.abbreviation ?? null,
      })),
    })),
  }));

  const teamStats: GameSummary['teamStats'] = (payload?.boxscore?.teams ?? []).map((t: any) => ({
    teamId: t.team?.id ?? null,
    homeAway: t.homeAway,
    stats: (t.statistics ?? []).map((s: any) => ({
      name: s.name,
      label: s.label,
      displayValue: s.displayValue,
      value: typeof s.value === 'number' && Number.isFinite(s.value) ? s.value : null,
    })),
  }));

  const boxscore: GameSummary['boxscore'] = (payload?.boxscore?.players ?? []).map((p: any) => ({
    teamId: p.team?.id ?? null,
    groups: (p.statistics ?? []).map((g: any) => ({
      // `text` is team-name-prefixed (e.g. "Pittsburgh Passing") which is redundant
      // once already grouped by team — `name` (e.g. "passing") reads cleaner capitalized.
      category: g.name ? g.name[0].toUpperCase() + g.name.slice(1) : (g.text ?? 'Stats'),
      labels: g.labels ?? [],
      athletes: (g.athletes ?? []).map((a: any) => ({
        athleteName: a.athlete?.displayName ?? 'Unknown',
        jersey: a.athlete?.jersey ?? null,
        stats: a.stats ?? [],
      })),
    })),
  }));

  return { leaders, teamStats, boxscore };
}

export async function getGameSummary(leagueId: string, eventId: string): Promise<GameSummary> {
  const { sport, league } = leaguePath(leagueId);
  const payload = await fetchEspn<any>(
    `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/summary?event=${eventId}`
  );
  return simplifySummary(payload);
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

export interface GetGamesFilter {
  /** YYYYMMDD, for the leagues that browse day-by-day. */
  date?: string;
  /** NFL browses week-by-week instead — both must be passed together. */
  week?: string;
  seasonType?: string;
}

export async function getGames(leagueId: string, filter?: GetGamesFilter): Promise<Omit<Game, 'leagueId'>[]> {
  const { sport, league } = leaguePath(leagueId);
  const search = new URLSearchParams();
  if (filter?.date) search.set('dates', filter.date);
  if (filter?.week) search.set('week', filter.week);
  if (filter?.seasonType) search.set('seasontype', filter.seasonType);
  const query = search.toString();
  const payload = await fetchEspn(
    `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/scoreboard${query ? `?${query}` : ''}`
  );
  return simplifyGames(payload);
}

// NFL is organized around named weeks (Hall of Fame Weekend, Preseason Week
// N, Week N, playoff rounds) rather than individual calendar days the way
// the other four leagues are — ESPN's own scoreboard response carries this
// structure directly (leagues[0].calendar), grouped by season stage
// (preseason/regular/postseason), so there's no need to hardcode week
// counts or date ranges ourselves.
export async function getNflWeekCalendar(): Promise<WeekCalendar> {
  const payload = await fetchEspn<any>('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard');
  const groups = payload?.leagues?.[0]?.calendar ?? [];
  const weeks: WeekCalendar['weeks'] = groups.flatMap((group: any) =>
    (group.entries ?? []).map((entry: any) => ({
      label: entry.label,
      shortLabel: entry.alternateLabel || entry.label,
      detail: entry.detail,
      weekValue: String(entry.value),
      seasonTypeValue: String(group.value),
      startDate: entry.startDate,
    }))
  );
  const currentSeasonType = String(payload?.season?.type ?? '');
  const currentWeekValue = String(payload?.week?.number ?? '');
  const currentWeekIndex = weeks.findIndex(
    (w) => w.seasonTypeValue === currentSeasonType && w.weekValue === currentWeekValue
  );
  return { weeks, currentWeekIndex: currentWeekIndex === -1 ? 0 : currentWeekIndex };
}

// Motorsport (F1/IndyCar/NASCAR): a scoreboard call's `leagues[0].calendar`
// gives the whole season's race weekends up front (verified live: F1
// returns all 25), each carrying an internal `event.$ref` URL — that host
// (sports.core.api.espn.pvt) isn't the public API and doesn't resolve
// externally, but the numeric event id embedded in it is exactly what a
// `dates=` scoreboard query needs to pull that one weekend's full detail.
function extractEventId(ref: unknown): string {
  const match = typeof ref === 'string' ? ref.match(/events\/(\d+)/) : null;
  return match?.[1] ?? '';
}

function simplifyMotorsportSchedule(payload: any): MotorsportEvent[] {
  const calendar = payload?.leagues?.[0]?.calendar ?? [];
  return calendar
    .map((entry: any) => ({
      id: extractEventId(entry.event?.$ref),
      name: entry.label,
      date: entry.startDate,
      endDate: entry.endDate,
    }))
    .filter((e: MotorsportEvent) => e.id);
}

// F1 reports each session with type.abbreviation (FP1/FP2/FP3/Qual/Race);
// IndyCar/NASCAR reported a single untyped competition per event in every
// case checked live — treated as "the race" when it's the only one.
function isRaceSession(comp: any, totalSessions: number): boolean {
  if (comp.type?.abbreviation) return comp.type.abbreviation === 'Race';
  return totalSessions === 1;
}

function sessionLabel(comp: any, totalSessions: number): string {
  return comp.type?.abbreviation || (totalSessions === 1 ? 'Race' : 'Session');
}

function simplifyMotorsportDetail(payload: any): MotorsportEventDetail {
  const comps = payload?.events?.[0]?.competitions ?? [];
  const sessions = comps.map((c: any) => ({
    id: c.id,
    label: sessionLabel(c, comps.length),
    date: c.date,
    state: c.status?.type?.state ?? 'pre',
    detail: c.status?.type?.shortDetail || c.status?.type?.detail || '',
  }));
  const raceComp = comps.find((c: any) => isRaceSession(c, comps.length));
  const raceState = raceComp?.status?.type?.state ?? 'pre';
  const results =
    raceState === 'post'
      ? (raceComp.competitors ?? [])
          .slice()
          .sort((a: any, b: any) => (a.order ?? 99) - (b.order ?? 99))
          .map((c: any) => ({
            position: c.order,
            driverName: c.athlete?.displayName ?? 'Unknown',
            countryFlag: c.athlete?.flag?.href ?? null,
            winner: !!c.winner,
          }))
      : [];
  return { sessions, results, state: raceState };
}

export async function getMotorsportSchedule(leagueId: string): Promise<MotorsportEvent[]> {
  const { sport, league } = leaguePath(leagueId);
  const payload = await fetchEspn<any>(`https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/scoreboard`);
  return simplifyMotorsportSchedule(payload);
}

export async function getMotorsportEventDetail(
  leagueId: string,
  weekendStartIso: string
): Promise<MotorsportEventDetail> {
  const { sport, league } = leaguePath(leagueId);
  // Formatting the date straight from the ISO string's own digits (not via a
  // JS Date, which would reinterpret in local time and could shift across a
  // day boundary) — a live check showed any date within a race weekend's
  // span returns the whole event, so this just needs to land inside it.
  const dateParam = weekendStartIso.slice(0, 10).replace(/-/g, '');
  const payload = await fetchEspn<any>(
    `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/scoreboard?dates=${dateParam}`
  );
  return simplifyMotorsportDetail(payload);
}
