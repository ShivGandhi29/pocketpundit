// ESPN scopes team ids per league, not globally — an NFL team and an NCAAF
// team can share the same raw id. Every favorite is stored under this
// composite key instead of the raw team id so two different leagues' teams
// never collide in the same favoriteTeams record. Single source of truth —
// TeamPicker, MatchupsScreen, and the storage migration all key through
// this rather than each building the string themselves.
export function favoriteKey(leagueId: string, teamId: string): string {
  return `${leagueId}:${teamId}`;
}
