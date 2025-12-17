# A/B Simulator

Interactive memory game demonstrating real-world A/B testing with live analytics.

**→ [Try it live](https://eeshans.com/ab-simulator)** | **→ [View analysis](https://eeshans.com/projects/ab-simulator)**

## What It Does

Memory game where users memorize fruit positions for 7 seconds, then find hidden pineapples within 60 seconds. PostHog feature flags randomly assign users to:

- **Control (A):** Find 4 pineapples  
- **Variant (B):** Find 5 pineapples

Every game event flows through the analytics pipeline:
- **PostHog:** Session tracking, feature flags, event capture
- **Cloudflare Worker:** Reverse proxy to bypass ad blockers
- **Supabase:** Batch export + webhooks → PostgreSQL tables
- **Real-time dashboards:** Variant performance, conversion funnels, user leaderboards

## Architecture

**Frontend**
- Vanilla JavaScript ES6 modules (no build step for game logic)
- Astro page wrapper for layout and routing
- Tailwind CSS for styling
- Plotly.js for interactive charts

**Analytics Pipeline**
- PostHog SDK: Feature flags (`word_search_difficulty_v2`) and event tracking
- Cloudflare Worker: `api-v2.eeshans.com` proxy for reliability
- Supabase: PostgreSQL with RLS, PostgREST API, batch export from PostHog

**Data Science**
- Python notebooks (Pandas, Plotly, Statsmodels)
- Weekly automated execution via GitHub Actions + Papermill
- Published to `/public/analysis/ab-simulator/`

## Module Structure

```
packages/ab-simulator/
├── public/
│   ├── js/
│   │   ├── ab-sim/
│   │   │   ├── core.js           # Game state machine (IDLE → MEMORIZING → PLAYING → RESULT)
│   │   │   ├── analytics.js      # PostHog initialization, variant assignment, event tracking
│   │   │   ├── supabase-api.js   # PostgREST API wrapper for leaderboards
│   │   │   ├── dashboard.js      # Plotly chart rendering (conversion, time series)
│   │   │   ├── leaderboard-ui.js # DOM manipulation for rankings
│   │   │   └── personal-best.js  # localStorage for user PB tracking
│   │   └── puzzle-config.js      # Puzzle definitions for variants A & B
│   └── analysis/                 # Published notebook outputs
└── src/
    └── pages/
        └── ab-simulator/
            └── index.astro       # Game container page
```

## Key Features

- **Variant assignment:** PostHog feature flag splits traffic 50/50
- **Event tracking:** `game_started`, `game_completed`, `tile_clicked`
- **Real-time leaderboards:** Top 10 players per variant via Supabase RPC
- **Personal best:** Client-side localStorage + server verification
- **Analytics notebooks:** Chi-square tests, conversion rate analysis, time-series plots

## Related Pages

- **Game:** [/ab-simulator](https://eeshans.com/ab-simulator)
- **Project hub:** [/projects/ab-simulator](https://eeshans.com/projects/ab-simulator)
- **Source code:** [github.com/eeshansrivastava89/ds-apps-main](https://github.com/eeshansrivastava89/ds-apps-main/tree/main/packages/ab-simulator)
