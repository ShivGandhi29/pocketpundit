import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AppState, FavoriteTeam } from '@/types/huddl';
import { favoriteKey } from '@/utils/favorites';

const STATE_KEY = 'huddl.v1';

const EMPTY_STATE: AppState = {
  onboarded: false,
  selectedLeagueIds: [],
  favoriteTeams: {},
};

// One-time self-heal for favorites saved before favoriteKey() existed, when
// entries were keyed by the raw team id alone. Each stored value already
// carries the correct leagueId/id (only the key was ever wrong), so this
// just re-keys every entry — a no-op for anything already correct.
function normalizeFavorites(raw: unknown): Record<string, FavoriteTeam> {
  if (!raw || typeof raw !== 'object') return {};
  const normalized: Record<string, FavoriteTeam> = {};
  for (const team of Object.values(raw as Record<string, FavoriteTeam>)) {
    if (!team?.leagueId || !team?.id) continue;
    normalized[favoriteKey(team.leagueId, team.id)] = team;
  }
  return normalized;
}

export async function loadState(): Promise<AppState> {
  try {
    const raw = await AsyncStorage.getItem(STATE_KEY);
    if (!raw) return { ...EMPTY_STATE };
    const parsed = JSON.parse(raw);
    return {
      onboarded: !!parsed.onboarded,
      selectedLeagueIds: parsed.selectedLeagueIds || [],
      favoriteTeams: normalizeFavorites(parsed.favoriteTeams),
    };
  } catch {
    return { ...EMPTY_STATE };
  }
}

export async function saveState(state: AppState): Promise<void> {
  await AsyncStorage.setItem(STATE_KEY, JSON.stringify(state));
}
