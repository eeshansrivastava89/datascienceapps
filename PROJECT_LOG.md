# SOMA Portfolio & A/B Simulator: Technical Project Log

**Status:** 🟢 LIVE | **Domain:** https://eeshans.com | **Stack:** Astro + PostHog + Supabase

---

## 1. Working Principles (The "AI Contract")

- **Fix root causes, not symptoms.** Research docs/code deeply before claiming to understand a problem.
- **Chunk-based delivery.** Complete small, verifiable pieces. Test before proceeding to next chunk.
- **Brutalize scope.** Remove features/configs/dependencies that don't earn their weight. Prefer simplicity over completeness.
- **Enterprise mindset.** Every decision should be defensible in a real company context. No toy code.
- **Tools over custom code.** Prefer established tools (PostHog, Streamlit, Tailwind) over rolling custom solutions.
- **Favorite metric:** % of line of code reduced.

---

## 2. Project Timeline & Phase Log

### Phase 0: Hugo Blog Foundation (Sept 2025)

- **State:** Hugo (Go templates) + Custom CSS (130 lines) + Vanilla JS (489 lines) + A/B puzzle game hosted on Fly.io.
- **Problem:** Everything custom-built, hard to iterate, stats calculation scattered.

---

### Phase 1: PostHog + Supabase Integration (Oct 25, 2025) — 11 hours

Built modern data pipeline by replacing FastAPI middleware with established tools. Split into 7 chunks:

1.  PostHog SDK integration + event tracking (2h).
2.  PostHog webhook → Supabase pipeline + database schema (3h).
3.  Streamlit dashboard built in Python (3h).
4.  Streamlit iframe embedded in Hugo + end-to-end testing (1h).
5.  Documentation + polish (1h).

**Key Result:** Enterprise-grade data pipeline proven. Switched from custom code to tools-first approach (PostHog → Supabase → Streamlit).

---

### Phase 2: Hugo to Astro Migration (Nov 1-8, 2025) — 14.75 hours

Migrated to modern Astro framework while preserving all integrations:

1.  Setup + content migration (1.25h).
2.  Built React Timeline component with 7 company logos (1.5h).
3.  Personalized homepage, projects, simulator pages (3h).
4.  Re-integrated PostHog + Streamlit embed (1.5h).
5.  **Optimization:** Minimized JavaScript 489→250 lines (49%) + CSS 130→0 lines (Tailwind) (1.5h).
6.  Removed framer-motion dependency, migrated animations to Tailwind (0.5h).
7.  Docker multi-stage build + Fly.io deployment (2h).
8.  Custom domain (eeshans.com) + Let's Encrypt SSL (1.5h).
9.  Fixed :8080 port issue in Nginx `port_in_redirect off;` (1h).

**Result:** Modern portfolio site live at https://eeshans.com with all 11 pages working, zero console errors, 23MB Docker image.

---

### Phase 3: Backend Migration (FastAPI → PostgREST)

- **Context:** We had a Python/FastAPI service just to query Supabase. It was redundant.
- **Action:** Removed FastAPI entirely. Archived `soma-analytics` repo.
- **New Architecture:**
  - **Direct Access:** Frontend calls Supabase PostgREST API using `supabase-js`.
  - **Logic Layer:** Moved business logic into **SQL Views** and **RPCs**.

**Detailed Changes:**

1.  **Created Views/RPCs:**
    - `v_variant_overview`: Aggregates starts, completions, and avg time per variant.
    - `v_conversion_funnel`: Calculates drop-off rates (optimized count query).
    - `rpc/leaderboard`: Returns top 10 sorted by time.
2.  **CORS & Security:**
    - Switched dashboard fetch to PostgREST with `apikey`.
    - Enabled Row Level Security (RLS) policies.
3.  **Removed Legacy Code:**
    - Deleted Python analytics endpoints (stats/comparison/distribution).
    - Decommissioned FastAPI Fly app.

**Performance Impact:**

- Variant Overview: 800ms → **100ms**
- Funnel Query: 500ms → **150ms**
- Recent Completions: 500ms → **150ms**

---

### Phase 4: Frontend Simplification & Modularization (Nov 2025)

- **Context:** `ab-simulator.js` was doing too much (game logic, fetching, charts, tracking).
- **Action:** Refactored into `public/js/ab-sim/` modules.

**Module Structure:**

- `core.js`: Game state machine and feature flags (Singleton).
- `supabase-api.js`: Unified data extraction layer. Wrapper for `window.supabase.rpc`.
- `dashboard.js`: Owns the Plotly charts. Implemented **adaptive polling**.
- `analytics.js`: Pure PostHog event tracking logic.
- `leaderboard-ui.js`: DOM rendering for the top 5 list.

**UX & Polish:**

- **Adaptive Polling:** Dashboard slows down polling if user is inactive.
- **Session ID:** Added unique `game_session_id`.
- **Styling:** Removed all legacy CSS.

---

### Phase 5: Features & Gamification Polish (Nov 9+, 2025)

**1. Global Leaderboard:**

- **Solution:** Uses `unique-names-generator` for IDs.
- **Backend:** Queries `posthog_events` via Supabase RPC.

**2. Memory Game Transformation:**

- **Variants:** Control (3 Pineapples) vs Treatment (4 Pineapples).
- **Feedback:** Visual countdown, Red flash on error.

---

## 3. Technical Reference (The "Hard Stuff")

### A. Database Schema (Supabase)

We use a single wide-table approach for flexibility (PostHog dump) but create strict views for performance.

**Table: `posthog_events`**

```sql
CREATE TABLE posthog_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event TEXT NOT NULL,           -- 'puzzle_started', 'puzzle_completed'
    distinct_id TEXT,              -- PostHog User ID
    properties JSONB,              -- { "variant": "A", "duration": 4200, ... }
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Index critical for Dashboard performance
CREATE INDEX idx_ph_events_time ON posthog_events(timestamp DESC);
CREATE INDEX idx_ph_events_event ON posthog_events(event);
```

**View: `v_variant_overview` (The Main Dashboard Query)**

```sql
CREATE OR REPLACE VIEW v_variant_overview AS
SELECT
    properties->>'variant' as variant,
    count(*) filter (where event = 'puzzle_started') as starts,
    count(*) filter (where event = 'puzzle_completed') as completions,
    avg((properties->>'duration_ms')::int) filter (where event = 'puzzle_completed') as avg_duration_ms
FROM posthog_events
GROUP BY 1;
```

**RPC: `leaderboard` (Secure Leaderboard Access)**

```sql
create or replace function leaderboard(variant text, limit_count int)
returns table (
  username text,
  best_time float,
  total_completions bigint
) language sql security definer as $$
  select
    properties->>'username',
    min((properties->>'duration_ms')::float) / 1000 as best_time,
    count(*)
  from posthog_events
  where event = 'puzzle_completed'
    and properties->>'variant' = variant
  group by 1
  order by 2 asc
  limit limit_count;
$$;
```

### B. Tracking Plan (PostHog)

Every event sent from `analytics.js` follows this schema.

| Event Name         | Trigger              | Properties                                                                 |
| ------------------ | -------------------- | -------------------------------------------------------------------------- |
| `puzzle_started`   | Click "Start" button | `variant` (A/B)<br>`target_count` (3/4)<br>`game_session_id`<br>`username` |
| `puzzle_completed` | All items found      | `duration_ms`<br>`mistakes_count`<br>`variant`<br>`game_session_id`        |
| `puzzle_failed`    | Timer hits 0:00      | `items_found`<br>`variant`<br>`game_session_id`                            |
| `$pageview`        | Page load            | `url`, `referrer`                                                          |

### C. Frontend Architecture

**State Machine (core.js)**
The game uses a strict state machine to prevent bugs (e.g. clicking tiles during countdown).

```javascript
const GAME_STATE = {
	IDLE: 'idle', // Waiting for user to click Start
	MEMORIZING: 'memorize', // 5s countdown, items visible
	PLAYING: 'playing', // 60s timer running, items hidden
	RESULT: 'result' // Game over (Win/Loss)
}

// Transition logic
function setGameState(newState) {
	if (newState === GAME_STATE.PLAYING) {
		enableGridClicks()
		startGameTimer()
	} else {
		disableGridClicks()
	}
}
```

**Adaptive Polling (dashboard.js)**
To save DB resources and Fly.io bandwidth, the dashboard slows down if the user goes idle or if errors occur.

```javascript
let pollInterval = 5000 // Start fast (5s)

async function updateDashboard() {
	try {
		const data = await window.supabaseApi.getVariantOverview()
		renderCharts(data)
		pollInterval = 5000 // Reset on success
	} catch (err) {
		console.error('Dashboard sync failed', err)
		pollInterval = Math.min(pollInterval * 2, 60000) // Backoff to max 60s
	}
	setTimeout(updateDashboard, pollInterval)
}
```

---

## 4. Maintenance & Operations Manual

### Updating the Game

**If you need to change the puzzle logic:**

1.  Edit `public/js/ab-sim/core.js` (State machine) or `puzzle-config.js` (Grid layout).
2.  Test locally: `npm run dev`.
3.  Play the game, verify PostHog events fire in Network tab.
4.  Deploy: `fly deploy`.

### Debugging Analytics

**If charts are empty:**

1.  Check if Ad Blocker is active (PostHog domains often blocked).
2.  Verify PostHog -> Supabase webhook status (in PostHog settings).
3.  Check Supabase logs for Edge Function errors.

**If Leaderboard is broken:**

1.  Test the RPC manually using curl:
    ```bash
    curl -X POST "$PUBLIC_SUPABASE_URL/rest/v1/rpc/leaderboard" \
      -H "apikey: $PUBLIC_SUPABASE_ANON_KEY" \
      -H "Content-Type: application/json" \
      -d '{"variant":"A","limit_count":10}'
    ```

### Adding New Metrics

1.  **Database:** Create a new View in Supabase SQL Editor.
    ```sql
    CREATE VIEW v_new_metric AS SELECT ... FROM posthog_events;
    ```
2.  **Frontend:** Add fetch function in `public/js/ab-sim/supabase-api.js`.
3.  **Visualization:** Add Plotly trace in `public/js/ab-sim/dashboard.js`.

### Deployment & Config

- **Fly.io:** Application `soma-portfolio`. Region `dfw`.
- **Secrets:** `PUBLIC_POSTHOG_KEY` and `PUBLIC_SUPABASE_URL` are build arguments in Dockerfile, sourced from Fly secrets.
- **SSL:** Managed by Fly.io + Let's Encrypt.
