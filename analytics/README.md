# Analytics Notebooks

A small, maintainable pattern for scheduled notebooks that read from Supabase PostgREST and log runs back to the database without requiring a service key.

## Files

- `notebooks/ab_dashboard_health.ipynb` — Pings key RPCs used by the dashboard and logs a run via `log_analytics_run`.

## Prereqs

- Env vars available to the notebook process:
  - `PUBLIC_SUPABASE_URL`
  - `PUBLIC_SUPABASE_ANON_KEY`
- Python 3.10+ with `requests` installed.

## Run locally

```bash
export PUBLIC_SUPABASE_URL="https://<project>.supabase.co"
export PUBLIC_SUPABASE_ANON_KEY="<anon key>"
python -m pip install requests jupyter nbconvert nbformat
jupyter nbconvert --to notebook --execute analytics/notebooks/ab_dashboard_health.ipynb --output analytics/notebooks/ab_dashboard_health.out.ipynb
```

## How logging works

- Table: `analytics_run_log(id, job_name, status, duration_ms, message, created_at)`
- RPC: `log_analytics_run(job_name text, status text, duration_ms int, message text)`
  - SECURITY DEFINER; `GRANT EXECUTE` to `anon, authenticated`.
  - This means the notebook can log a run using only the anon key.

## Optional: schedule in GitHub Actions

- Reuse the existing secrets/variables set for the smoke workflow (`PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`).
- Add a workflow step that runs the `nbconvert --execute` command above on a schedule. Keeping it optional avoids CI bloat.
