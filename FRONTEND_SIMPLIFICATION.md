# Frontend Simplification: A/B Simulator + Dashboard

This doc is intentionally brief: a pre/post visual and a chunked todo list you can chip away at. No code in here.

## Prompt

Please read through project_history.md -> backend_migration.md -> frontend_simplification.md in extreme detail so you understand where I am right now .. pay attention to working principles. Explore the codebase of soma-portfolio repo so you understand the code in context of my project history doc. Let me know once you have perfect understand of my code and work, and where I am currently in my workflow. 

## Before (today)

- Page loads global scripts and everything is wired imperatively.
- Fetch logic is embedded where it’s used; `ab-simulator.js` does many jobs at once.
- Plotly powers all charts/tables/funnel; polling is fixed at 5s.

```
[ab-test-simulator.astro]
   |-- utils.js           (globals: $, show/hide/toggle, formatTime)
   |-- puzzle-config.js   (window.PuzzleConfig with puzzles + generators)
   |-- ab-simulator.js    (feature flag, user identity, state, grid rendering,
   |                       countdown/game timers, events, leaderboard fetch/UI)
   |-- dashboard.js       (fetch 4 endpoints, Plotly charts, 5s setInterval)
   v
[Supabase PostgREST]  (direct fetch from dashboard + leaderboard)
[PostHog]             (global, feature flag + capture)
```

## After (current state)

- Single folder for all simulator/dashboard logic: `public/js/ab-sim/`.
- Clear separation: data access (`supabase-api.js`), game + feature flag + events (`core.js`), charts (`dashboard.js`).
- Ready for Phase 2 enhancements (adaptive polling, refresh button) without further structural changes.

```
[ab-test-simulator.astro]
  |-- utils.js              (DOM helpers)
  |-- puzzle-config.js      (puzzle definitions)
  |-- ab-sim/
      |-- supabase-api.js  (RPC/view calls -> window.supabaseApi)
      |-- core.js          (feature flag, state, grid UI, timers, events, leaderboard)
      |-- dashboard.js     (plots + periodic polling)
  v
[Supabase PostgREST]  (all requests via supabaseApi)
[PostHog]             (feature flag + capture inside core.js)
```

---

## Migration To‑Dos (Phase 1 + Phase 2)

Minimal, incremental steps. You can land each item independently.

### Phase 1 — Organization (complete)

- [x] Supabase API wrapper implemented
- [x] Dashboard & leaderboard refactored to use wrapper
- [x] Interim modular split created (state / featureFlag / puzzle-ui / analytics)
- [x] Consolidated into `public/js/ab-sim/` (final structure) and removed legacy files

Acceptance:
- No behavior changes; same UI, stable build.
- All PostgREST traffic via `window.supabaseApi`.
- Single place (`core.js`) for feature flag, state, events, leaderboard logic.


### Phase 2 — UX & resilience polish (complete)

- [x] Replace fixed `setInterval` with adaptive schedule in `dashboard.js`
  - Success → next poll after 5s; Error → exponential backoff (10s, 20s, up to 60s)
  - Add a small "Refresh" button near "Last updated"
- [x] Add a per-run `game_session_id` to event props for easier grouping
- [ ] ~~Debounce re-render on theme change (avoid double redraw)~~ - Skipped (premature optimization)
- [ ] ~~Add `showFruit(tile, state)` helper to reduce repeated class toggles~~ - Skipped (unnecessary abstraction)
- [ ] ~~Optional: only update leaderboard DOM if content changed~~ - Skipped (adds complexity)

Acceptance for Phase 2:
- ✅ Fewer redundant requests on transient errors; manual refresh works.
- ✅ Every game run has unique session ID for funnel analysis in PostHog.
- ✅ Adaptive polling backs off gracefully on errors (5s → 10s → 20s → 40s → 60s max)
- ✅ Manual refresh button gives users control over dashboard updates.

### Phase 2.5 — Visual polish + cleanup (complete):

* Rebuilt the leaderboard UI using Tailwind utilities only, with a subtle glow when the player reaches the top five.
* Removed the legacy ab-simulator.css; any bespoke rules now live in app.css.
* Simplified the challenge-complete surface: inline stats card, calmer memorize pill, and a deterministic personal-best badge powered by the Supabase RPC cache.

Acceptance:

* No inline styles remain across simulator/leaderboard JS modules.
* Leaderboard styling now matches the design system and clearly highlights the player row when applicable.
* Personal-best pill appears only on genuine records and stays hidden otherwise.

### Phase 3 — Codebase diet & modularization (in flight)

Progression (low → high risk):

1. **Template/DOM helpers (Low)** — ✅ Extracted shared leaderboard row markup and memory tile iteration helpers so `core.js` no longer inlines repeated template strings or selector loops.
2. **Countdown + challenge flow utilities (Low/Medium)** — ✅ Added `startCountdownTimer(onComplete)` plus `prepareResultView` / `handleSuccessfulRun` / `handleFailedRun` helpers, reducing the size of `startChallenge` and `endChallenge` without touching the player UX.
3. **Module split (Medium)** — ✅ Created `personal-best.js`, `leaderboard-ui.js`, and `analytics.js` under `public/js/ab-sim/`. These own PB caching + pill visibility, leaderboard DOM rendering, and PostHog feature-flag/telemetry wiring respectively. `core.js` now delegates to these globals and shrank by ~120 lines.
4. **Shared state-machine layer (Medium/High)** — ✅ Replaced the old booleans with a `RUN_PHASES` map plus guarded transition helpers so the memorize → hunt → result flow is explicit.
5. **Data-driven DOM wiring (High)** — ✅ Centralized DOM caches and tile-state configs so future styling changes only touch the config instead of scattered class toggles.

Acceptance goals for Phase 3:
- `core.js` trends toward <400 LOC by pushing identity, PB cache, and leaderboard rendering into modules. ✅
- DOM/event helpers eliminate duplicated selector/class toggles. ✅
- Final state machine keeps the run flow readable and prevents regressions once steps 4-5 land. ✅

### Phase 4: Blogging [PENDING]

This is what needs to be done:
* Pull the official astro-breadcrumbs instructions (likely README) to confirm install/config requirements.
* If they look compatible, add the dependency and register it in astro.config.mjs.
Update BlogPost.astro (or [...slug].astro, depending on integration pattern) to render the breadcrumb component with sensible defaults.
* Re-run npm run build, capture the line-count delta, and summarize.

---

## Success Markers

- Single folder `public/js/ab-sim` owns simulator/dashboard logic.
- One Supabase access layer (`supabase-api.js`).
- Game logic encapsulated (`core.js`) with minimal global leakage.
- Ready to implement adaptive polling & UX tweaks without further re-org.

## Tiny Test Plan

- Simulator: run through success/fail flows, verify PostHog events and leaderboard render.
- Dashboard: initial load, theme toggle, manual refresh, network offline → backoff.
- Console: no unhandled promise rejections; errors surfaced as user-friendly messages.
