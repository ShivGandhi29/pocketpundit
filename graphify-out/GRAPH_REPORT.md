# Graph Report - pocketpundit  (2026-08-28)

## Corpus Check
- 56 files · ~64,970 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 314 nodes · 552 edges · 43 communities (13 shown, 30 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 70,675 output

## Community Hubs (Navigation)
- ESPN Data-Grounding & Team Stats
- Schedule Calendar & Motorsport Detail UI
- Game Stats Tabs (Leaders/Box Score)
- Root Layout & Game Cards
- Expo App Icon Config
- Project Docs & AI Rationale
- Package Manifest & TypeScript
- Onboarding Entry Routes
- On-Device LLM Stack (ExecuTorch/Llama)
- TypeScript Config Globs
- Team Schedule Screen
- Expo/ExecuTorch Dependency Pair
- Agent Instructions Docs
- ESPN Fetch Workaround Rationale
- expo-build-properties Dependency
- expo-constants Dependency
- expo-dev-client Dependency
- expo-file-system Dependency
- expo-font Dependency
- expo-image Dependency
- expo-linking Dependency
- expo-router Dependency
- expo-splash-screen Dependency
- expo-status-bar Dependency
- expo-system-ui Dependency
- @expo/vector-icons Dependency
- react Dependency
- react-dom Dependency
- react-native Dependency
- AsyncStorage Dependency
- ExecuTorch Resource Fetcher Dependency
- react-native-gesture-handler Dependency
- react-native-reanimated Dependency
- react-native-safe-area-context Dependency
- react-native-screens Dependency
- react-native-web Dependency
- react-native-worklets Dependency
- Athlete Detail Endpoint (unused)
- Event Summary Endpoint
- News Endpoint (unused)
- Team Detail Endpoint (unused)
- Team Schedule Endpoint
- Teams Endpoint

## God Nodes (most connected - your core abstractions)
1. `Colors` - 16 edges
2. `PocketPundit` - 15 edges
3. `expo` - 14 edges
4. `Spacing` - 13 edges
5. `Radius` - 13 edges
6. `MatchupsScreen()` - 11 edges
7. `formatLocalKickoff()` - 11 edges
8. `leaguePath()` - 9 edges
9. `expo-router` - 8 edges
10. `LocalAIContext` - 7 edges

## Surprising Connections (you probably didn't know these)
- `PocketPundit` --references--> `GameCard()`  [EXTRACTED]
  README.md → src/components/GameCard.tsx
- `PocketPundit` --references--> `OnboardingFlow()`  [EXTRACTED]
  README.md → src/components/OnboardingFlow.tsx
- `PocketPundit` --references--> `LocalAIContext`  [EXTRACTED]
  README.md → src/contexts/LocalAIContext.tsx
- `LocalAIContext` --references--> `analyzeMatchup()`  [EXTRACTED]
  src/contexts/LocalAIContext.tsx → README.md
- `LocalAIContext` --references--> `LLAMA3_2_1B_SPINQUANT constant`  [EXTRACTED]
  src/contexts/LocalAIContext.tsx → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **ESPN endpoints already used by src/services/api.ts** — src_services_api_api, espn_api_reference_scoreboard_endpoint, espn_api_reference_teams_endpoint, espn_api_reference_team_schedule_endpoint, espn_api_reference_roster_injuries_endpoint, espn_api_reference_standings_endpoint [EXTRACTED 1.00]
- **ESPN endpoints available but not yet used in this app** — espn_api_reference_team_detail_endpoint, espn_api_reference_news_endpoint, espn_api_reference_event_summary_endpoint, espn_api_reference_athlete_detail_endpoint [EXTRACTED 1.00]
- **PocketPundit UI components (src/components/)** — src_components_leaguepicker_leaguepicker, src_components_teampicker_teampicker, src_components_onboardingflow_onboardingflow, src_components_gamecard_gamecard, src_components_gamedetailmodal_gamedetailmodal [EXTRACTED 1.00]

## Communities (43 total, 30 thin omitted)

### Community 0 - "ESPN Data-Grounding & Team Stats"
Cohesion: 0.08
Nodes (41): Rationale: live ESPN data grounds the model past its training cutoff, Roster/Injuries endpoint (/teams/{teamId}/roster), Scoreboard endpoint (/{sport}/{league}/scoreboard), Standings endpoint (apis/v2/.../standings), GameStatsTabs(), styles, TeamGroup(), AnalyzeArgs (+33 more)

### Community 1 - "Schedule Calendar & Motorsport Detail UI"
Cohesion: 0.12
Nodes (26): DateStrip(), styles, WEEKDAY, GameCard(), MotorsportDetailModal(), SessionRow(), styles, MotorsportEventCard() (+18 more)

### Community 2 - "Game Stats Tabs (Leaders/Box Score)"
Cohesion: 0.09
Nodes (25): BoxScoreTab(), LeaderCard(), splitLeaderValue(), statMagnitude(), styles, Tab, TABS, teamFor() (+17 more)

### Community 3 - "Root Layout & Game Cards"
Cohesion: 0.13
Nodes (19): styles, styles, styles, LinescoreTable(), periodLabel(), REGULATION_PERIODS, ScoreBug(), styles (+11 more)

### Community 4 - "Expo App Icon Config"
Cohesion: 0.07
Nodes (26): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, predictiveBackGestureEnabled, reactCompiler, typedRoutes (+18 more)

### Community 5 - "Project Docs & AI Rationale"
Cohesion: 0.10
Nodes (15): AsyncStorage, Expo Router, Rationale: on-device AI, no server in the loop, Out of Scope Features, PocketPundit, Original Web Prototype (../Prototypes/2026-08-28-pocketpundit), src/app/index.tsx (boot/onboarding/matchups flow), src/app/settings.tsx (leagues/teams modal) (+7 more)

### Community 6 - "Package Manifest & TypeScript"
Cohesion: 0.12
Nodes (15): devDependencies, @types/react, typescript, main, name, private, scripts, android (+7 more)

### Community 7 - "Onboarding Entry Routes"
Cohesion: 0.29
Nodes (11): expo-router, Home(), styles, Settings(), styles, OnboardingFlow(), LEAGUES, EMPTY_STATE (+3 more)

### Community 8 - "On-Device LLM Stack (ExecuTorch/Llama)"
Cohesion: 0.16
Nodes (14): Rationale: 3B chosen over 1B for reasoning coherence, Custom Development Build / Dev Client, Rationale: native module forces a custom dev client over Expo Go, ExecuTorch (Meta's on-device inference runtime), Expo Go, HuggingFace, Llama 3.2 3B Instruct (SpinQuant), Meta (Llama 3.2 / ExecuTorch creator) (+6 more)

### Community 9 - "TypeScript Config Globs"
Cohesion: 0.15
Nodes (12): ./assets/*, expo-env.d.ts, expo/tsconfig.base, .expo/types/**/*.ts, **/*.ts, **/*.tsx, compilerOptions, paths (+4 more)

### Community 10 - "Team Schedule Screen"
Cohesion: 0.29
Nodes (5): RESULT_COLOR, ScheduleRow(), styles, TeamScheduleScreen(), ScheduleGame

### Community 11 - "Expo/ExecuTorch Dependency Pair"
Cohesion: 0.29
Nodes (7): expo, expo-asset, dependencies, expo, expo-asset, react-native-executorch, react-native-executorch

### Community 13 - "ESPN Fetch Workaround Rationale"
Cohesion: 0.67
Nodes (3): ESPN's Akamai edge (blocks Node's default TLS client), Rationale: use fetch not https.get against ESPN's API, Node's built-in fetch (undici)

## Knowledge Gaps
- **120 isolated node(s):** `name`, `slug`, `version`, `orientation`, `icon` (+115 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **30 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `expo-router` connect `Onboarding Entry Routes` to `Schedule Calendar & Motorsport Detail UI`, `Team Schedule Screen`, `Root Layout & Game Cards`, `Expo App Icon Config`?**
  _High betweenness centrality (0.110) - this node is a cross-community bridge._
- **Why does `plugins` connect `Expo App Icon Config` to `Onboarding Entry Routes`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **What connects `name`, `slug`, `version` to the rest of the system?**
  _120 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ESPN Data-Grounding & Team Stats` be split into smaller, more focused modules?**
  _Cohesion score 0.07777777777777778 - nodes in this community are weakly interconnected._
- **Should `Schedule Calendar & Motorsport Detail UI` be split into smaller, more focused modules?**
  _Cohesion score 0.12298387096774194 - nodes in this community are weakly interconnected._
- **Should `Game Stats Tabs (Leaders/Box Score)` be split into smaller, more focused modules?**
  _Cohesion score 0.08735632183908046 - nodes in this community are weakly interconnected._
- **Should `Root Layout & Game Cards` be split into smaller, more focused modules?**
  _Cohesion score 0.1349206349206349 - nodes in this community are weakly interconnected._