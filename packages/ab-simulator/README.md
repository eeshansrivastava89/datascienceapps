# A/B Simulator

Interactive memory game with real A/B testing, live stats, and analytics pipeline.

**Live:** [eeshans.com/ab-simulator](https://eeshans.com/ab-simulator)

## What It Does

A memory game where users find hidden pineapples in a grid. PostHog feature flags randomly assign users to:
- **Control (A):** 3 pineapples to find
- **Variant (B):** 4 pineapples to find

All events flow to Supabase for real-time dashboards and analysis.

## Stack

- **Frontend:** Vanilla JS (ES6 modules), Astro page wrapper
- **Analytics:** PostHog SDK + feature flags
- **Database:** Supabase (PostgREST)
- **Charts:** Plotly.js

## Module Structure

```
public/js/ab-sim/
├── core.js           # State machine (IDLE → MEMORIZING → PLAYING → RESULT)
├── analytics.js      # PostHog event tracking
├── supabase-api.js   # PostgREST wrapper
├── dashboard.js      # Plotly chart rendering
├── leaderboard-ui.js # DOM rendering
└── personal-best.js  # localStorage management
```

## Development

```bash
# From repo root
pnpm dev:ab-sim
```

## Routes

- `/ab-simulator` — The game (this package)
- `/projects/ab-simulator` — Project hub with stats and analysis
