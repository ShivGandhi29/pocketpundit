import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { OnboardingFlow } from '@/components/OnboardingFlow';
import { MatchupsScreen } from '@/screens/MatchupsScreen';
import { LEAGUES } from '@/services/api';
import { loadState, saveState } from '@/storage/state';
import { Colors } from '@/constants/theme';
import type { AppState } from '@/types/pocketpundit';

export default function Home() {
  const [state, setState] = useState<AppState | null>(null);

  useEffect(() => {
    loadState().then(setState);
  }, []);

  // Settings edits AsyncStorage directly and navigates back; re-read state on refocus.
  useFocusEffect(
    useCallback(() => {
      loadState().then(setState);
    }, [])
  );

  if (!state) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.accent} size="large" />
      </View>
    );
  }

  if (!state.onboarded || state.selectedLeagueIds.length === 0) {
    return (
      <OnboardingFlow
        leagues={LEAGUES}
        initialState={state}
        onComplete={async (next) => {
          await saveState(next);
          setState(next);
        }}
      />
    );
  }

  return <MatchupsScreen leagues={LEAGUES} state={state} />;
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', padding: 24 },
});
