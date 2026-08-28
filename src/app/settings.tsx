import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { OnboardingFlow } from '@/components/OnboardingFlow';
import { LEAGUES } from '@/services/api';
import { loadState, saveState } from '@/storage/state';
import { Colors } from '@/constants/theme';
import type { AppState } from '@/types/pocketpundit';

export default function Settings() {
  const router = useRouter();
  const [state, setState] = useState<AppState | null>(null);

  useEffect(() => {
    loadState().then(setState);
  }, []);

  if (!state) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.accent} size="large" />
      </View>
    );
  }

  return (
    <OnboardingFlow
      leagues={LEAGUES}
      initialState={state}
      onComplete={async (next) => {
        await saveState(next);
        router.back();
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
});
