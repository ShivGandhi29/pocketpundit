import { Platform } from 'react-native';

import { Colors } from '@/constants/theme';

// Onboarding-only styling tokens, adapted from the Spotify entry in the
// awesome-design DESIGN.md library (.claude/skills/awesome-design). Spotify's
// component geometry (full-pill buttons, uppercase wide-tracked labels,
// bold/regular type contrast, heavy shadow-based elevation instead of a
// border) is applied here; its color palette is not — PocketPundit already
// has its own near-black background and green accent, close enough to
// Spotify's own that swapping palettes would only make onboarding clash with
// the matchups screen it hands off to.
export const ButtonLabel = {
  fontSize: 14,
  letterSpacing: 1.6,
  textTransform: 'uppercase' as const,
};

// Spotify's dialog-level shadow (`rgba(0,0,0,0.5) 0px 8px 24px`) — on a
// near-black background a subtle shadow disappears, so elevation has to be
// heavy to read at all.
export const HeavyElevation = Platform.select({
  ios: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
  },
  android: { elevation: 10 },
  default: {},
});

// Stands in for Spotify's `#7c7c7c` outlined-button border, tinted to this
// app's own text color instead of a raw gray so it stays consistent with the
// rest of the palette.
export const OutlinePillBorder = `${Colors.text}47`; // ~28% alpha
