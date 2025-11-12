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

## After (target)

- Introduce a tiny service layer for Supabase calls.
- Separate concerns: state, UI, feature flag/identity, analytics, and dashboard rendering.
- Adaptive polling (backoff on errors), optional manual refresh.

```
[ab-test-simulator.astro]
   |-- utils.js
   |-- puzzle-config.js
  |-- public/js/supabase-api.js    (central PostgREST calls -> window.supabaseApi)
   |-- featureFlag.js         (resolveVariant, initUserIdentity)
   |-- state.js               (puzzleState + reset helpers)
   |-- puzzle-ui.js           (grid rendering, tile clicks, timers, endChallenge)
   |-- analytics.js           (baseEventProps, trackEvent, leaderboard render)
   |-- dashboard.js           (renders using supabaseApi, adaptive polling)
   v
[Supabase PostgREST]  (all requests via supabaseApi)
[PostHog]             (feature flag + capture via analytics.js)
```

---

## Migration To‑Dos (Phase 1 + Phase 2)

Minimal, incremental steps. You can land each item independently.

### Phase 1 — Organization (no behavior change)

- [x] Create `public/js/supabase-api.js` (window.supabaseApi)
  - Methods: `variantOverview()`, `funnel()`, `recent(n)`, `distribution()`, `leaderboard(variant, limit)`
  - Handles headers + JSON shape normalization (RETURNS TABLE arrays → object)
- [x] Refactor `dashboard.js` to use `supabaseApi.*` (remove inline fetches)
- [x] Refactor leaderboard fetch in `ab-simulator.js` to `supabaseApi.leaderboard`
- [x] Extract analytics helpers into `public/js/analytics.js`
  - `baseEventProps(extra)`, `trackEvent(name, extra)`
  - Replace inline `posthog.capture` calls to go through analytics helper
- [ ] Optional split for clarity (keep small files):
  - `public/js/state.js` — exports `puzzleState` and `resetState()`
  - `public/js/featureFlag.js` — `resolveVariant()`, `initUserIdentity()`
  - `public/js/puzzle-ui.js` — grid render, memorize phase, countdown, timers, `endChallenge()`
  - keep `ab-simulator.js` as the orchestrator only

Acceptance for Phase 1:
- No visual changes; game and dashboard behave the same.
- All Supabase calls go through `supabase-api.js`.
- Event capture uses a single helper.

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

- All data loads through a single Supabase API layer (1 place to change headers/base URL).
- `ab-simulator.js` is small and readable (just orchestration).
- Dashboard polling adapts to failure and offers a manual refresh.
- You can open any file and immediately see its single purpose.

## Tiny Test Plan

- Simulator: run through success/fail flows, verify PostHog events and leaderboard render.
- Dashboard: initial load, theme toggle, manual refresh, network offline → backoff.
- Console: no unhandled promise rejections; errors surfaced as user-friendly messages.
