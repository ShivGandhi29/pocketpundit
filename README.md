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

Game analysis runs locally using **Llama 3.2 3B Instruct** (SpinQuant-quantized, ~2.4 GB) via ExecuTorch, Meta's on-device inference runtime, wrapped by `react-native-executorch`. The weights are a free download from HuggingFace under Meta's open Llama 3.2 license — no API key, no per-request cost, nothing metered.

- **First launch**: the model downloads once in the background (~2.4 GB — worth being on Wi-Fi for this one) and is cached on-device. You'll see a progress percentage the first time you open a game's detail sheet before it's ready.
- **Every launch after that**: analysis runs fully offline — airplane mode works fine for this part. (Game *data* still needs internet, since scores are live from ESPN.)
- This replaces the original web prototype's approach, which shelled out to a locally-running [Ollama](https://ollama.com) server on your Mac. That's gone entirely — no server, no "is Ollama running" error states, nothing to keep running on a computer.
- The prompt sent to the model is built fresh for every analysis, pulling from four live ESPN calls in parallel: each team's overall/home/road records and (once a game is live) real-time win-probability from the scoreboard; current streak, playoff seed, and point differential from the standings endpoint; and a short list of currently injured/questionable players from the roster endpoint. The system prompt also tells the model which season stage this is (preseason/regular season/postseason) and to hedge accordingly, since a preseason score is a weak signal — starters play limited snaps and rosters are still experimental. Standings/injury lookups fail soft (a network hiccup just means that part of the context is missing, not a broken analysis) — see `safeStanding`/`safeInjuries` in `src/contexts/LocalAIContext.tsx`. The system prompt also explicitly tells the model not to assert roster/player/injury facts beyond what it was just given, since that's exactly the kind of thing a frozen training cutoff gets wrong. See `ESPN_API_REFERENCE.txt` for the full shape of every endpoint this pulls from.
- We started with the 1B variant (~400 MB, faster download, less on-device compute) but moved to 3B for materially better reasoning coherence — the 1B model tended to string real numbers together in confused ways. 3B is a bigger download and a bit slower per generation, but noticeably more coherent. If you want the smaller/faster tradeoff back, swap `LLAMA3_2_3B_SPINQUANT` for `LLAMA3_2_1B_SPINQUANT` in that same file.

### Why this needs a custom dev client, not Expo Go

`react-native-executorch` is a native module (it embeds ExecuTorch's C++ runtime), so it can't run inside the stock Expo Go app. This project needs a **development build** instead — same DX otherwise (fast refresh, Metro, etc.), just your own compiled app instead of the generic Expo Go container.

## Running it

This is a **native dev client**, not Expo Go (see above) — the first build compiles the whole native project (Xcode/CocoaPods, including the ExecuTorch and Liquid Glass native modules) and takes several minutes. Every build after that is either instant (Metro Fast Refresh, for JS/TS-only edits) or a much faster incremental native rebuild (for native-dependency or `app.json` changes).

### Prerequisites

- Node.js and npm
- Xcode with an iOS Simulator runtime installed (for `android`, an Android Studio + emulator/device setup instead)
- CocoaPods (installed automatically by `expo run:ios` if missing)
- iOS 26+ on the simulator/device to see the actual Liquid Glass material on nav bars, tab pills, and controls — on older iOS it silently falls back to plain views, so the app still runs, just without the glass look

### From a terminal

```bash
npm install

# First run: builds the native dev client and launches it in the iOS
# Simulator. This is a full native build (several minutes) — required
# any time a native dependency or app.json/plugin config changes.
npx expo run:ios       # or: npx expo run:android

# Day-to-day after that first build: just restart Metro and Fast Refresh
# picks up JS/TS/style changes in place, no rebuild needed.
npx expo start          # then press i / a, or scan the QR code from your dev build
```

If the app is already installed and Metro is already running, you don't need either command — just reopen the app on the simulator/device.

### From Claude Code

Just ask — e.g. "run the app" or "launch pocketpundit and check the home screen." Claude Code will:

1. Check whether Metro/the simulator is already running before starting anything new.
2. Run `npx expo run:ios` for a first build or after any native/config change (new native package, `app.json` edits like the `expo-font`/`expo-glass-effect` plugins); otherwise it relies on Fast Refresh for plain code edits.
3. Verify with `xcrun simctl io booted screenshot` rather than just asserting success, since a build finishing isn't the same as the screen rendering correctly.

One real limitation: Claude Code can't tap through the running app itself (no simulator input/automation tool is wired up here), so it can verify anything reachable via a cold launch, a deep link (`pocketpundit://…`), or a static screenshot, but a flow gated behind a tap you'd need to do (e.g. paging through onboarding, opening a specific game's detail sheet) needs you to check it by hand.

On first launch: pick the leagues you follow, optionally favorite teams, then browse matchups. Tap a game — the first tap ever will show a model download progress bar; every tap after that runs the analysis on-device in a few seconds. Use the gear icon any time to change leagues/teams.

## Out of scope (same as the web prototype)

User accounts/cloud sync, push notifications, betting odds, historical stats/standings, offline support for game *data* (scores are always live), and automated tests. Tennis was explicitly scoped out too — an ATP/WTA event is a whole tournament of simultaneous head-to-head matches (a draw/bracket), which doesn't fit either the team-vs-team model or the motorsport-style leaderboard the way golf's stroke-play format did.
