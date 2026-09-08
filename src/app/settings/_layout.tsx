import { Stack } from 'expo-router';

import { Colors } from '@/constants/theme';

// The root layout presents "settings" as a single modal (see
// src/app/_layout.tsx); everything under it — the settings list, the
// leagues/teams editor, the two legal pages — is a regular push within that
// one modal sheet, not a separate modal each. This is its own Stack
// navigator, so it needs its own `contentStyle` — the root Stack's dark
// background doesn't cascade down to a nested navigator, and without this
// every screen here falls back to React Navigation's default white.
export default function SettingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="leagues" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="terms" />
      <Stack.Screen name="dev-welcome-preview" />
    </Stack>
  );
}
