import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initExecutorch } from 'react-native-executorch';
import { ExpoResourceFetcher } from 'react-native-executorch-expo-resource-fetcher';

import { LocalAIProvider } from '@/contexts/LocalAIContext';
import { Colors } from '@/constants/theme';

initExecutorch({ resourceFetcher: ExpoResourceFetcher });

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <LocalAIProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.background },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="settings" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="team/[teamId]" />
        </Stack>
      </LocalAIProvider>
    </SafeAreaProvider>
  );
}
