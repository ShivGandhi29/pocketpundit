// PocketPundit is dark-mode-only by design (same as the web prototype's
// `color-scheme: dark`), so there's no light palette to switch to.
export const Colors = {
  background: '#0b0e14',
  surface: '#141922',
  surfaceRaised: '#1b2230',
  border: '#262f40',
  text: '#eef1f6',
  textMuted: '#93a0b4',
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
