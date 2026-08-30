# PocketPundit — Future Feature Plan

Ideas captured for later implementation, not started yet. Each entry notes what
already exists that's relevant and the open questions worth resolving before
building it.

## Widgets

Home-screen widgets showing live scores / next game for a favorite team.

- Expo has no first-party widget support — iOS needs a WidgetKit extension
  (a native Swift target added via a config plugin or a bare/prebuild
  workflow change), Android needs its own equivalent (e.g.
  `react-native-android-widget`). Two separate native builds, not one shared
  component.
- No backend in this app (see README) — a widget's background refresh would
  need to call ESPN directly from the widget extension itself, or the main
  app would need to write a small snapshot (next game, score) to shared
  storage (App Group on iOS) that the widget reads instead of making its own
  network calls.
- Decide widget scope first: just favorite teams' next/live game, or
  configurable per-league.

## Themes

The app is dark-mode-only by design right now (`src/constants/theme.ts` is a
single static `Colors` object, not a light/dark pair).

- Adding a light theme (or multiple accent-color themes) means turning
  `Colors` into a context/provider with at least two palettes, and auditing
  every component for hardcoded assumptions (white circle logo backdrops,
  glass tint colors, the `onAccent` near-black text color) that were chosen
  assuming a dark background.
- Liquid Glass (`expo-glass-effect`) already supports a `colorScheme` prop
  (`'auto' | 'light' | 'dark'`) per `GlassView` — worth wiring that to
  whatever theme system lands here rather than leaving it on `'auto'`.
- Decide: system-following (respect device light/dark) vs. an in-app manual
  toggle, and whether "themes" means light/dark only or also accent-color
  choices (e.g. per-favorite-team color).

## Updates to UI / app launch flow

Ambiguous on purpose — needs scoping before starting. Candidates:

- The native splash screen (currently a static image via `expo-splash-screen`)
  animating into the first real screen instead of a hard cut.
- Skipping straight to the matchups list for a returning (already-onboarded)
  user with a lighter-weight "welcome back" moment instead of the current
  instant jump.
- Deep-link handling beyond what exists today (`pocketpundit://settings`,
  `pocketpundit://` home) — e.g. a link straight into a specific game or
  team.

## Deeper AI analysis

Current state: one on-device prediction per game (`analyzeMatchup()` in
`src/contexts/LocalAIContext.tsx`), opt-in via a button, grounded in live
records/standings/injuries pulled from ESPN in parallel — see the README's
"On-device AI" section and `ESPN_API_REFERENCE.txt` for exactly what's fed
into the prompt today.

Possible directions:
- Head-to-head history between the two teams (needs a new ESPN call — not
  currently fetched).
- Mid-game re-analysis that factors in the live box score / play-by-play,
  not just pre-game context.
- Multi-turn follow-up questions against the same grounded context, instead
  of a single fire-and-forget prediction.
- Surfacing a confidence level rather than a flat prediction, given the
  model is already told to hedge on preseason games.

## Player pages

No per-player detail view exists yet. ESPN's athlete detail endpoint
(`apis/common/v3/sports/{sport}/{league}/athletes/{id}`) is already
documented in `ESPN_API_REFERENCE.txt` as available but unused.

- Would need: a tap target from box scores / leaders / standings rosters
  into a new player screen, a `getPlayerDetail()` API function, and a
  types addition similar to `TeamStanding`/`StandingsGroup`.
- Scope question: season stats + bio only, or also a recent-game log and
  injury history.

## More league stats

Current state: per-game team stats (`TeamStatsTab`) and full league
standings (`StandingsModal`, added this session) exist; nothing above the
single-game or full-table level.

Possible additions:
- League leaders (top scorers/passers/etc. across the whole league, not
  just the two teams in a given game) — ESPN typically exposes this per
  sport under a leaders/statistics endpoint, not yet verified live.
- Playoff picture / bracket view once postseason seeding is live.
- Advanced/derived metrics beyond what ESPN sends as raw stat lines.

Each of these needs the same live-endpoint verification pass (curl the real
shape before writing types/parsing) that every other ESPN integration in
this app went through — don't assume a shape, check it.
