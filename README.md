# PocketPundit

A stripped-down sports companion: pick the leagues and teams you actually care about, see their matchups with nothing else competing for your attention, and tap any game for a quick AI prediction — who's favored, what's driving the pick, and what could flip it. The prediction runs entirely **on your phone**, offline, with no server anywhere in the loop.

This is the React Native (Expo) rewrite of the original web prototype at `../Prototypes/2026-08-28-pocketpundit`, targeting iOS and Android from one codebase.

## How it's put together

- **`src/app/`** — Expo Router screens: `index.tsx` is the boot/onboarding/matchups flow, `settings.tsx` is a modal for editing leagues/teams.
- **`src/components/`** — `LeaguePicker`, `TeamPicker`, `OnboardingFlow`, `GameCard`, `GameDetailModal`.
- **`src/screens/MatchupsScreen.tsx`** — the main matchup list with league tabs, pull-to-refresh, and favorite-team pinning.
- **`src/services/api.ts`** — fetches team/game data straight from ESPN's free public API (`site.api.espn.com`). No backend needed: this call comes from native code, not a browser, so the CORS restriction that forced the web prototype to run a proxy server simply doesn't apply here.
- **`src/contexts/LocalAIContext.tsx`** — loads a small LLM on-device via [`react-native-executorch`](https://github.com/software-mansion/react-native-executorch) and exposes `analyzeMatchup()` to any screen.
- **`src/storage/state.ts`** — AsyncStorage persistence for onboarding state (leagues/favorite teams).

## On-device AI

Game analysis runs locally using **Llama 3.2 1B Instruct** (SpinQuant-quantized, ~400 MB) via ExecuTorch, Meta's on-device inference runtime, wrapped by `react-native-executorch`.

- **First launch**: the model downloads once in the background (~400 MB) and is cached on-device. You'll see a progress percentage the first time you open a game's detail sheet before it's ready.
- **Every launch after that**: analysis runs fully offline — airplane mode works fine for this part. (Game *data* still needs internet, since scores are live from ESPN.)
- This replaces the original web prototype's approach, which shelled out to a locally-running [Ollama](https://ollama.com) server on your Mac. That's gone entirely — no server, no "is Ollama running" error states, nothing to keep running on a computer.
- Quality tradeoff: a 1B on-device model is noticeably shallower than what you'd get from a 3B+ model via Ollama. It's tuned here for short, punchy 3-5 sentence takes rather than deep analysis — see `SYSTEM_PROMPT` in `src/contexts/LocalAIContext.tsx` if you want to change that.

### Why this needs a custom dev client, not Expo Go

`react-native-executorch` is a native module (it embeds ExecuTorch's C++ runtime), so it can't run inside the stock Expo Go app. This project needs a **development build** instead — same DX otherwise (fast refresh, Metro, etc.), just your own compiled app instead of the generic Expo Go container.

## Running it

```bash
npm install

# builds a native dev client and launches it — first run takes a while
# (full Xcode/Gradle build with the ExecuTorch native library)
npm run ios       # or: npm run android

# after that first build, for day-to-day work:
npm start          # then press i / a, or scan the QR code from your dev build
```

On first launch: pick the leagues you follow, optionally favorite teams, then browse matchups. Tap a game — the first tap ever will show a model download progress bar; every tap after that runs the analysis on-device in a few seconds. Use the gear icon any time to change leagues/teams.

## Out of scope (same as the web prototype)

User accounts/cloud sync, push notifications, betting odds, historical stats/standings, leagues beyond NFL/NBA/MLB/NHL/EPL, offline support for game *data* (scores are always live), and automated tests.
