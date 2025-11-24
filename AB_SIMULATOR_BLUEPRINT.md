# Build with Me Project Blueprint: A/B Testing Simulator

> **Project Brief:** An interactive memory game ("Find the Pineapples 🍍") designed to teach the full lifecycle of an analytics product—from building the app to instrumenting real-time event tracking, storing data, and visualizing results.

---

## 1. Project Overview (The "Why")

**Concept:**
Instead of a boring "tutorial," we build a playable game. As users play, they generate real behavioral data. We treat this game as a live product experiment.

**Learning Goals:**

- **Product Engineering:** Building a state-driven UI with vanilla JS modules.
- **Analytics Engineering:** Instrumenting events (PostHog) and wiring data pipelines (Supabase).
- **Data Science:** Visualizing real-time experiment results (Bayesian stats, Funnels).

**The Experiment:**
We A/B test two difficulty levels to see how they impact user completion rates and frustration:

- **Control (Variant A):** Find 3 pineapples (Easier).
- **Treatment (Variant B):** Find 4 pineapples (Harder).

---

## 2. Architecture & Stack (The "How")

**High-Level Data Flow:**

```mermaid
flowchart LR
    visitor((User)) --> cloudflare[Cloudflare Proxy]
    cloudflare --> fly[Fly.io (Astro Frontend)]
    fly -->|Feature flag fetch| posthogFF[(PostHog Feature Flag)]
    fly -->|Track events| posthogAPI[(PostHog Events API)]
    posthogAPI --> edge[Supabase Edge Function]
    edge --> db[(Supabase Postgres)]
    db --> views[SQL Views & RPCs]
    views --> postgrest[PostgREST API]
    postgrest --> dashboard[Plotly Dashboard]
    postgrest --> leaderboard[Leaderboard Module]
    fly -.-> dashboard
    fly -.-> leaderboard
```

**Tech Stack Decisions:**

- **Frontend:** **Astro + Tailwind CSS**. Chosen for performance and "islands architecture" (React used only where necessary).
- **Analytics:** **PostHog**. Industry standard for event tracking and Feature Flags.
- **Backend/DB:** **Supabase (PostgreSQL)**. Replaces a custom Python backend. We use **PostgREST** for direct-from-frontend database queries (via SQL Views).
- **Viz:** **Plotly.js**. robust charting library for the dashboard.

---

## 3. Phase 1: The Product (Frontend Engineering)

**Codebase Location:** `public/js/ab-sim/`

The game logic is entirely client-side, organized into modular ES6 files.

- **`core.js`**: The "Brain". Contains the central State Machine managing the game lifecycle:
  - `IDLE` -> `MEMORIZING` (Countdown) -> `PLAYING` (Timer running) -> `RESULT` (Win/Loss).
  - Handles the Feature Flag (`memory-game-difficulty`) to assign Variant A or B.
- **`game-ui.js` / `puzzle-config.js`**: Handles the grid rendering and click interactions.
- **`personal-best.js`**: Manages local storage and "Personal Best" logic.

**Styling:**
Strict **Tailwind CSS** only. No custom CSS files. We use utility classes for everything, including animations (game card flips, countdowns).

---

## 4. Phase 2: The Data Pipeline (Analytics Engineering)

**Strategy:**
We don't just "log events." We build a pipeline that turns raw clicks into structured SQL data.

**1. Instrumentation (Tracking Plan)**
We track the following key events in `analytics.js`:

- `puzzle_started`: When the user clicks "Start".
  - _Props:_ `variant` (A/B), `target_count` (3 or 4).
- `puzzle_completed`: When the user finds all pineapples.
  - _Props:_ `duration_ms`, `mistakes_made`.
- `puzzle_failed`: When the timer runs out.

**2. The Wiring (PostHog -> Supabase)**

- **Ingestion:** PostHog captures the event.
- **Transfer:** A PostHog Webhook sends data to a Supabase Edge Function (or direct table insert).
- **Storage:** Data lands in the `posthog_events` table in Postgres.

**3. Data Modeling (SQL Layer)**
We avoid "backend code" by using Postgres capabilities:

- **Table:** `posthog_events` (Raw JSON data).
- **Views:** We create SQL Views to structure the JSON data for the API.
  - `v_variant_overview`: Aggregates starts, completions, and avg time per variant.
  - `v_conversion_funnel`: Calculates drop-off rates.
- **Access:** These views are exposed instantly via the Supabase **PostgREST API**.

---

## 5. Phase 3: The Analysis (Data Science)

**Codebase Location:** `public/js/ab-sim/dashboard.js`

We build a "Live Dashboard" right next to the game so students can see their own data appear.

**Key Components:**

- **Real-time Polling:** `dashboard.js` queries the Supabase API every few seconds.
- **Visualization:**
  - **Funnel Chart:** Starts vs. Completions (Plotly).
  - **Distribution:** Histogram of completion times (shows if Variant B shifts the curve).
  - **Leaderboard:** Global top scores fetched via RPC `get_leaderboard`.

**Insight Loop:**
The dashboard proves the hypothesis: Variant B usually takes ~20% longer, validating that "adding 1 pineapple" significantly impacts difficulty.

---

## 6. Phase 4: Infrastructure (DevOps)

**Deployment:**

- **Docker:** Multi-stage build (Node build -> Nginx image).
- **Fly.io:** Hosting provider. `fly.toml` handles configuration.
- **Cloudflare:** DNS and Reverse Proxy (critical for getting analytics past ad-blockers).

---

## 7. Environment & Setup

**Prerequisites**

- Node.js 20+, pnpm or npm
- Fly.io CLI (`fly auth login`)
- Supabase project with SQL permissions
- PostHog project + Edge Webhook

**Environment Variables (`.env` or `.env.local`)**

```env
PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxxx
PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Fly.io Secrets / Build Args**

```bash
fly secrets set PUBLIC_POSTHOG_KEY=phc_xxx PUBLIC_SUPABASE_URL=https://... PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

**Supabase Migration**

1. Open `supabase-schema.sql`
2. Run via Supabase SQL Editor (or `psql`)
3. Verify Views/RPCs exist (`variant_overview`, `leaderboard`, etc.)

**Cloudflare / Proxy Notes**

- Route `api-v2.eeshans.com` → Fly.io app to bypass ad-blockers for analytics.
- Ensure SSL certs are managed via Cloudflare “Full (strict)”.

---

## 8. Tracking & API Contract

**Event Tracking Table**

| Event              | Trigger              | Required Properties                                                      | Notes                        |
| ------------------ | -------------------- | ------------------------------------------------------------------------ | ---------------------------- |
| `puzzle_started`   | User hits Start      | `variant`, `target_count`, `game_session_id`, `username`                 | Fired once per run           |
| `puzzle_completed` | All pineapples found | `variant`, `duration_ms`, `mistakes_made`, `game_session_id`, `username` | Drives leaderboard           |
| `puzzle_failed`    | Timer expires        | `variant`, `items_found`, `game_session_id`, `username`                  | Helps funnel/drop-off        |
| `$pageview`        | Page load            | Auto by PostHog                                                          | Used for session attribution |

**Sample PostHog Event Payload**

```json
{
	"event": "puzzle_completed",
	"properties": {
		"variant": "B",
		"duration_ms": 18750,
		"mistakes_made": 2,
		"game_session_id": "run_9d8e",
		"username": "Speedy Tiger"
	}
}
```

**Supabase RPC Responses**

`variant_overview`

```json
{
	"stats": [
		{ "variant": "A", "total_completions": 120, "avg_completion_time": 14.3 },
		{ "variant": "B", "total_completions": 108, "avg_completion_time": 18.6 }
	],
	"comparison": {
		"variant_a_avg": 14.3,
		"variant_b_avg": 18.6,
		"time_difference_seconds": 4.3,
		"percentage_difference": 30.1
	}
}
```

`leaderboard`

```json
[
	{ "username": "Speedy Tiger", "best_time": 12.1, "total_completions": 4 },
	{ "username": "Calm Panda", "best_time": 13.5, "total_completions": 6 }
]
```

---

## 9. Verification & Runbook

**Pre-Flight**

- `npm install`
- Copy `.env.example` → `.env.local`, fill keys.
- `fly secrets list` and confirm required values present.
- Run Supabase SQL migration (only once per project).

**Build Verification**

1. `npm run dev`
2. Load `http://localhost:4321/projects/ab-test-simulator`
3. Open DevTools > Network:
   - Confirm `posthog.com/e/` requests succeed.
   - Confirm Supabase REST calls (`/rest/v1/rpc/variant_overview`) return 200.

**Post-Deploy Smoke Test**

1. `fly deploy`
2. Visit production URL.
3. **Functional checks:**
   - Play both variants → ensure countdown, timer, progress bar work.
   - Watch dashboard: variant stats, funnel, distribution update within 5s.
   - Check leaderboard highlights current user.
4. **Diagnostics:**
   - `fly logs -a soma-portfolio` for errors.
   - Run `curl` against Supabase RPCs to verify credentials.

---

## 10. Operations Manual

**Running Locally**

```bash
npm run dev
# Dashboard: http://localhost:4321/projects/ab-test-simulator
```

**Database Changes**
Apply updated SQL via Supabase UI or CLI:

```sql
CREATE OR REPLACE VIEW v_variant_overview AS ...;
```

**Deployment**

```bash
fly deploy
```

**Troubleshooting**

- **Charts not updating?** Disable ad-blocker, verify PostHog key/host.
- **Leaderboard empty?** `curl` the `leaderboard` RPC to confirm Supabase creds.
