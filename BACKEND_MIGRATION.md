# Backend Migration: FastAPI ➜ PostgREST + SQL Views (+ optional jobs)

This document is intentionally brief: one pre/post visual and a chunked task list. No code.

## Before (today)

- Browser (Astro dashboard)
  → FastAPI (analytics endpoints, CORS, retries, pooling)
  → Supabase Postgres (tables + views)
- PostHog for client analytics
- Fly.io hosts frontend and FastAPI service
- Pain: duplicate query logic, Python maintenance, occasional latency spikes

```
[Browser]
   |  fetch /api/*
   v
[FastAPI on Fly]
   |  SQLAlchemy queries
   v
[Supabase Postgres]
```

## After (target)

- Browser reads directly from Supabase PostgREST (views/materialized views)
- Heavy/periodic transforms done in SQL or scheduled notebooks
- Optional inference kept in a tiny Fly service (only if needed)
- Less custom code; auth/RLS handled by Supabase

```
[Browser]
   |  GET /rest/v1/<view>  (PostgREST)
   v
[Supabase Postgres: Views / Mat. Views]
   ^                          |
   |(pg_cron / GH Action /    | (SQL refresh)
   | Modal) runs notebooks --->|

[Optional: Fly inference service]  (only if/when ML serving is required)
```

---

## Migration To‑Dos (streamlined)

Minimal path (do in order; each removes code quickly):

* [x] Create `v_variant_overview` view with all stats/comparison columns
* [x] Replace view access with SECURITY DEFINER RPCs + GRANTs (RLS not applicable to views)
* [x] Switch dashboard fetch to PostgREST (RPC `variant_overview`, view `v_conversion_funnel`) replacing Python endpoint
* [x] Remove FastAPI analytics endpoints (stats/comparison/distribution) from codebase (archived in `soma-analytics/`)
* [x] Decommission FastAPI container/app (workflow disabled & code archived) — optionally delete Fly app + infra files
* [x] Round numeric metrics in SQL (AVG, differences) to 2 decimals at source for consistent UI

Performance / optional extras (only if needed after baseline):

* [-] (For Later) Add `mv_completion_distribution` + pg_cron REFRESH for heavy percentile query
* [-] (For Later) Add essential indexes (`events(variant, created_at)`, `completions(username)`) if not present
* [x] (Optional) Introduce notebooks (`analytics/notebooks`) + run log table `analytics_run_log`
* [ ] (Deferred) Decide ML inference path (Fly vs Modal) when first model needed

### Current State Summary (Completed)

- All dashboard data (overview, funnel, distribution, recent completions, leaderboard) now served via Supabase views/RPCs.
- FastAPI code archived; GitHub Action disabled; Fly app deletable.
- Aggregated time metrics rounded in SQL (no frontend formatting dependency except chart labels).

### Suggested Next Steps

1. (Optional) Add materialized view for distribution if query latency grows.
2. (Done) Add `analytics_run_log` + notebook pipeline if you introduce periodic batch transforms.
3. (Optional) Add indexes after measuring (pg_stat_statements) rather than pre-optimizing.
4. (Hygiene) Remove archived infra files once certain no Python service returns.

Success marker: Once the first five boxes are checked, FastAPI is gone for pure reads and dashboard latency relies solely on PostgREST + DB performance.


### Reference: Curls for PostGres API

```sh
curl -s -X POST \
  "$PUBLIC_SUPABASE_URL/rest/v1/rpc/variant_overview" \
  -H "apikey: $PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $PUBLIC_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{}' | jq


curl -s -X GET \
  "$PUBLIC_SUPABASE_URL/rest/v1/v_conversion_funnel?select=*" \
  -H "apikey: $PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $PUBLIC_SUPABASE_ANON_KEY" | jq


curl -s -X POST \
  "$PUBLIC_SUPABASE_URL/rest/v1/rpc/recent_completions" \
  -H "apikey: $PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $PUBLIC_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"limit_count":50}' | jq

curl -s -X POST \
  "$PUBLIC_SUPABASE_URL/rest/v1/rpc/completion_time_distribution" \
  -H "apikey: $PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $PUBLIC_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}' | jq

curl -s -X POST \
  "$PUBLIC_SUPABASE_URL/rest/v1/rpc/leaderboard" \
  -H "apikey: $PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $PUBLIC_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"variant":"A","limit_count":10}' | jq

curl -s -X POST \
  "$PUBLIC_SUPABASE_URL/rest/v1/rpc/leaderboard" \
  -H "apikey: $PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $PUBLIC_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"variant":"B","limit_count":10}' | jq

```

### Latency Improvements

#### Pre-Migration (FastAPI)
* variant-overview - 800 ms -> 100 ms
* conversion-funnel - 450-500 ms -> 150 ms
* recent-completions - 500 ms -> 150 ms
* time-distribution - 500 ms (occasionally 1000ms) -> 150 ms
* leaderboard - 500 ms (occ 1000 ms) -> 150 ms

---

## Operations: Smoke checks and secrets cleanup

### Smoke checks (added)

- A scheduled workflow `.github/workflows/smoke.yml` pings:
  - `rpc/variant_overview`, `rpc/recent_completions`, `rpc/completion_time_distribution`
  - `v_conversion_funnel` view
- Configure repository secrets required by the workflow:
  - `PUBLIC_SUPABASE_URL`
  - `PUBLIC_SUPABASE_ANON_KEY`
- The job fails on non-200 responses to alert on outages, grants drift, or schema regressions.

### Secrets cleanup

- PUBLIC_* values are now supplied at build time via Docker build args (see `Dockerfile` and `fly.toml`).
- Remove any redundant Fly runtime secrets for these values to avoid configuration drift.
- Keep runtime secrets only if you plan to introduce server-side logic again.

---

## Notebooks

- Example: `analytics/notebooks/ab_dashboard_health.ipynb` reads PUBLIC_* envs (auto-loads `.env` locally), calls Supabase RPCs, and logs via `log_analytics_run` SECURITY DEFINER RPC.
- Table: `analytics_run_log(id, job_name, status, duration_ms, message, created_at)`
- RPC: `log_analytics_run(job_name text, status text, duration_ms int, message text)`; `GRANT EXECUTE` to `anon, authenticated`.
- To run locally in VS Code: open the notebook, pick a Python kernel with `requests` installed, run all cells. No service key needed.
- Optional CI: execute via `nbconvert` on a schedule, reusing the same PUBLIC_* secrets as the smoke workflow.
