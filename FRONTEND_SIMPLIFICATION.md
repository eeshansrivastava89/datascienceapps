# Frontend Simplification: A/B Simulator + Dashboard

This doc is intentionally brief: a pre/post visual and a chunked todo list you can chip away at. No code in here.

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

### CRITICAL ISSUE 
Previous AI assistant broke posthog tracking after Phase 1. Did all the checks about proxy, it's working, posthog loads in console, but events are not reaching posthog. This is very much due to the phase 1 migration and not an external issue. Previous invesgtigations reveal:
* events are showing up in posthog's live events, but not in activity or its own events database
* supabase webhooks are probably not an issue because the events aren't loading into posthog events table, only the live view
* everything was working perfectly before the phase 1 migration
* proxy is working fine too

### Phase 2 — UX & resilience polish

- [ ] Replace fixed `setInterval` with adaptive schedule in `dashboard.js`
  - Success → next poll after 5s; Error → exponential backoff (10s, 20s, up to 60s)
  - Add a small “Refresh” button near “Last updated”
- [ ] Debounce re-render on theme change (avoid double redraw)
- [ ] Add `showFruit(tile, state)` helper to reduce repeated class toggles
- [ ] Optional: only update leaderboard DOM if content changed
- [ ] Add a per-run `game_session_id` to event props for easier grouping

Acceptance for Phase 2:
- Fewer redundant requests on transient errors; manual refresh works.
- Simpler tile-update logic; consistent event properties across events.


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
