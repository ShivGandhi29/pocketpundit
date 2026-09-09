import { Colors } from '@/constants/theme';

// Onboarding-only styling tokens, adapted from the Spotify entry in the
// awesome-design DESIGN.md library (.claude/skills/awesome-design). Spotify's
// component geometry (full-pill buttons, bold/regular type contrast, heavy
// shadow-based elevation instead of a border) is applied here; its color
// palette is not — Huddl already has its own near-black background
// and green accent, close enough to Spotify's own that swapping palettes
// would only make onboarding clash with the matchups screen it hands off to.
// `Elevation` (the shadow itself) lives in the shared theme now that the
// calendar redesign also needs it.
//
// Spotify's own uppercase, wide-tracked button label is deliberately not
// carried over — all-caps labels/headings read as an AI-generated-app tell,
// so this app's buttons stay sentence case throughout.
export const ButtonLabel = {
  fontSize: 15,
};

// Stands in for Spotify's `#7c7c7c` outlined-button border, tinted to this
// app's own text color instead of a raw gray so it stays consistent with the
// rest of the palette.
export const OutlinePillBorder = `${Colors.text}47`; // ~28% alpha
