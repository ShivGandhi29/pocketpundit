import { Platform } from 'react-native';

// Huddl is dark-mode-only by design (same as the web prototype's
// `color-scheme: dark`), so there's no light palette to switch to.
export const Colors = {
  background: '#0b0e14',
  surface: '#141922',
  surfaceRaised: '#1b2230',
  border: '#262f40',
  text: '#eef1f6',
  // Same value as `text` — plain white/off-white everywhere, no separate
  // muted/secondary shade. The name is kept (rather than deleting the token
  // and repointing 21 files' worth of usages to `Colors.text` directly) so
  // this stays a single, easily-reversible source of truth.
  textMuted: '#eef1f6',
  accent: '#4dd6a0',
  accentStrong: '#2fb583',
  live: '#ff6b6b',
  focus: '#7db8ff',
  onAccent: '#05130d',
} as const;

export const Spacing = {
  s1: 4,
  s2: 8,
  s3: 16,
  s4: 24,
  s5: 32,
  s6: 48,
} as const;

export const Radius = {
  sm: 8,
  md: 14,
  lg: 20,
  pill: 999,
} as const;

// Shadow-based elevation for surfaces raised off the near-black background —
// a subtle shadow disappears entirely against `Colors.background`, so these
// have to be heavier than a typical light-mode shadow to read at all.
// `medium` lifts small interactive elements (a selected calendar day);
// `high` is for anything meant to feel like the primary focal point on
// screen (a primary CTA).
export const Elevation = {
  medium: Platform.select({
    ios: { shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8 },
    android: { elevation: 6 },
    default: {},
  }),
  high: Platform.select({
    ios: { shadowColor: '#000000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 24 },
    android: { elevation: 10 },
    default: {},
  }),
} as const;
