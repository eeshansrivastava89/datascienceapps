# Soma Portfolio & A/B Simulator

An Astro-based personal portfolio + blog with an interactive A/B testing simulator (memory puzzle) backed by Supabase and PostHog. The simulator demonstrates feature flagging, event capture, real-time analytics (SQL views + RPCs), and frontend charting with Plotly.

## Stack (Concise)

- Astro + TypeScript + Tailwind
- Supabase (SQL views + SECURITY DEFINER RPCs via PostgREST)
- PostHog (feature flag + event ingestion)
- Plotly (charts/funnel/table) on the simulator page
- Fly.io (Docker build with public build args) + GitHub Actions (deploy + smoke checks)

## Key Folders

```
public/js/ab-sim/   # All simulator & dashboard logic (core, supabase-api, dashboard)
src/pages/projects/ # Project pages including ab-test-simulator.astro
supabase-schema.sql # Source of truth for views/RPCs
.github/workflows/  # deploy.yml + smoke.yml health checks
```

## Simulator Script Layout

`public/js/ab-sim/supabase-api.js` – RPC/view fetch helpers (normalized arrays → objects)
`public/js/ab-sim/core.js` – Feature flag resolution, game state, timers, events, leaderboard
`public/js/ab-sim/dashboard.js` – Fetch + render analytics charts/tables at a fixed interval

## Quick Start

```bash
npm install
PUBLIC_SUPABASE_URL=... \
PUBLIC_SUPABASE_ANON_KEY=... \
PUBLIC_POSTHOG_KEY=... \
npm run dev
```

Open: http://localhost:4321/projects/ab-test-simulator

Environment variables with `PUBLIC_` are exposed client-side (safe public PostgREST + PostHog keys).

## Build & Preview

```bash
npm run build
npm run preview
```

## Deployment (Fly.io)

Supply public Supabase vars at build time (build args or fly.toml) so Astro can inline them:

```bash
fly deploy \
    --build-arg PUBLIC_SUPABASE_URL=... \
    --build-arg PUBLIC_SUPABASE_ANON_KEY=... \
    --build-arg PUBLIC_POSTHOG_KEY=...
```

GitHub Actions workflow (`deploy.yml`) can automate on push to `main` (ensure build args are defined in `fly.toml` under `[build.args]`).

## Smoke Checks

`smoke.yml` hits:

- `rpc/variant_overview`
- `rpc/recent_completions`
- `rpc/completion_time_distribution`
- `v_conversion_funnel`

Repo secrets/variables required:
`PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`

## Rotating Public Keys

1. Update `.env` locally.
2. Redeploy with new build args.
3. Update GitHub Actions secrets for smoke checks.

## Future (Phase 2 ideas)

- Adaptive polling + manual refresh button
- Per-session `game_session_id` for richer analytics
- Lighter chart library if bundle size becomes a concern

## License

MIT

## Operations (Supabase + Deploy)

### Rotate PUBLIC\_\* keys

- Update local `.env` with new values:
  - `PUBLIC_SUPABASE_URL`
  - `PUBLIC_SUPABASE_ANON_KEY`
- For production deploys on Fly.io, provide these at build time (safe to expose, they’re public):
  - via `fly.toml` under `[build.args]`, or
  - via deploy flags: `fly deploy --build-arg PUBLIC_SUPABASE_URL=... --build-arg PUBLIC_SUPABASE_ANON_KEY=...`
- Update GitHub repository settings for smoke checks:
  - Settings → Secrets and variables → Actions
  - Add secrets (or variables) with the same two names so `.github/workflows/smoke.yml` can run.

### Redeploy

1. Commit changes
2. `fly deploy` (or let GitHub Actions run `.github/workflows/deploy.yml` on push to main)

### Monitoring (Smoke checks)

- Workflow `.github/workflows/smoke.yml` runs every 30 minutes and on-demand.
- It calls these endpoints on Supabase PostgREST:
  - `rpc/variant_overview`
  - `rpc/recent_completions`
  - `rpc/completion_time_distribution`
  - `v_conversion_funnel`
- Configure repository secrets or variables:
  - `PUBLIC_SUPABASE_URL`
  - `PUBLIC_SUPABASE_ANON_KEY`

### Performance notes (optional)

- Current SQL includes targeted indexes for common filters and aggregations.
- If distribution queries grow heavy, consider a materialized view and refresh with `pg_cron`.
- Frontend scripts on the simulator page are inlined (`is:inline`), so cache-busting isn’t required for those assets.
