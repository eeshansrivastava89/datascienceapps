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

### Phase 2.5 - Minor Improvements

okay now some minor improvements 

-- i noticed that render leaderboard uses inline css and not tailiwind .. can you fix that?
-- can you go through all the js files and see if we can replace any inline css with tailwind
-- i need a nicer tailwind classy UI for the leaderboard .. looks out of place with the rest of the design .. I want to highlight / glow the row if the user makes it to top 5, make it obvious, also not obvious in the challenge complete section when someone gets the personal best, so maybe slight design update over there -- keep the code minimal and use smart tailwind updates 

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
