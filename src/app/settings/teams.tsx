import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { TeamPicker } from '@/components/TeamPicker';
import { LEAGUES } from '@/services/api';
import { loadState, saveState } from '@/storage/state';
import { Colors } from '@/constants/theme';
import type { AppState, FavoriteTeam } from '@/types/huddl';

// Standalone favorite-teams editor — the counterpart to leagues.tsx now that
// the two no longer chain into each other. Shows favorite-team pickers for
// whichever team-kind leagues are currently followed; TeamPicker itself
// handles the "no team leagues followed yet" empty state.
export default function SettingsTeams() {
  const router = useRouter();
  const [state, setState] = useState<AppState | null>(null);

  useEffect(() => {
    loadState().then(setState);
  }, []);

  if (!state) {
    return (
      <View style={styles.center} accessibilityLabel="Loading" accessibilityRole="progressbar">
        <ActivityIndicator color={Colors.accent} size="large" />
      </View>
    );
  }

  const teamLeagues = LEAGUES.filter((l) => state.selectedLeagueIds.includes(l.id));

  return (
    <TeamPicker
      leagues={teamLeagues}
      initialFavorites={state.favoriteTeams}
      backLabel="Cancel"
      onBack={() => router.back()}
      onFinish={async (favoriteTeams: Record<string, FavoriteTeam>) => {
        await saveState({ ...state, favoriteTeams });
        router.back();
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
});
