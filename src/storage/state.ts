import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AppState } from '@/types/pocketpundit';

const STATE_KEY = 'pocketpundit.v1';

const EMPTY_STATE: AppState = {
  onboarded: false,
  selectedLeagueIds: [],
  favoriteTeams: {},
};

export async function loadState(): Promise<AppState> {
  try {
    const raw = await AsyncStorage.getItem(STATE_KEY);
    if (!raw) return { ...EMPTY_STATE };
    const parsed = JSON.parse(raw);
    return {
      onboarded: !!parsed.onboarded,
      selectedLeagueIds: parsed.selectedLeagueIds || [],
      favoriteTeams: parsed.favoriteTeams || {},
    };
  } catch {
    return { ...EMPTY_STATE };
  }
}

export async function saveState(state: AppState): Promise<void> {
  await AsyncStorage.setItem(STATE_KEY, JSON.stringify(state));
}
