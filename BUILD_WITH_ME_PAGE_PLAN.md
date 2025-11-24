# Build With Me Page – Sequential Implementation Plan

1. **Information Architecture & Copy**

- [x] Define sections: Hero/CTA, Active Cycle, Open Work (filterable), Hats & PRs, Leaderboard, Upcoming/Backlog, How-to-Ship checklist, FAQ/Compliance.
- [x] Draft short copy for each section (CTA text, contributor instructions, claim/PR language, non-commercial disclaimer).
  - Hero/CTA: “Build with Me — Real Products, Real Data.” Subcopy: “Monthly cycles, live apps, open contributions.” Primary CTA: “See Open Work” (anchor). Secondary: “How to Contribute” (checklist anchor).
  - Active Cycle: Card for current project/phase (e.g., “A/B Simulator · Week 3: Analysis”) with stats (open, claimed, merged this week) and one highlight bullet (e.g., “Variant B timing improved 20%”).
  - Open Work: Grid of cards showing category chips (Frontend, Backend, Analytics, Wiring/Infra), status badge (Open, Claimed, In Review, Merged), difficulty, assignees, last updated, and “View on GitHub.” Filters: category chips, status dropdown, search.
  - Hats & PRs: Horizontal strip of contributors with avatars and “hat” badges (FE/BE/DS/Docs), plus PR state (Claimed / PR Open #123 / Merged) with timeline dots.
  - Leaderboard: Points weighted by merged PRs, reviews, docs. Shows rank, name, points, merged PRs, reviews, docs; optional count-up animation.
  - Upcoming & Backlog: Teaser tiles for next projects (Basketball Shot Analyzer, Metal Lyrics NLP) with target skills and ETA.
  - How to Ship Checklist: Fork/branch naming (`feature/user-handle-topic`), env setup, test expectations, PR template preview, claim/comment guidance, optional demo gif.
  - FAQ/Compliance: Non-commercial disclaimer, time expectations, “Do I need PostHog/Supabase?”, “How do we choose winners?”, “What if issue is taken?”.

2. **Visual System**

- [x] Pick palette + typography for this page (bolder than current projects page); define Tailwind tokens (background gradient/pattern, category chip colors).
- [x] Decide interaction accents: hover states, micro-animations, section dividers (no generic PM board look).
  - Palette: Deep ink + warm accent. Primary bg: `#0C0F14`, card bg: `#11151D`, accent: `#F97316` (orange), secondary accent: `#7DD3FC` (cyan), neutrals from Tailwind gray-200/400. Gradient backdrop (radial) using slate/indigo overlay.
  - Typography: Heading: “Satoshi” or “Space Grotesk”-style (use existing stack if locked, but lean toward bold grotesk feel); body: system sans (Inter-compatible). Use tight letter spacing for labels/badges.
  - Category chip colors: FE `#22D3EE`, BE `#FACC15`, Analytics `#F97316`, Wiring/Infra `#A78BFA`, Docs `#34D399`. Status badges: Open (green), Claimed (amber), In Review (blue), Merged (emerald).
  - Accents: Card hover lift + border glow on accent color; chips with subtle inner shadow. Section dividers via subtle gridlines or noise overlay. Leaderboard count-up; filter chips animate press. Buttons with slight skew/tilt on hover.

3.  **Data Model (Front-End First)**

- [x] Define TypeScript interfaces for tasks, cycles, contributors, leaderboard entries.
- [x] Create local mock data (JSON) to drive layout while back end is GitHub.
- [x] Map category labels → color/style tokens; map statuses → badge text.
- Interfaces (draft):

  ```ts
  type Category = 'frontend' | 'backend' | 'analytics' | 'wiring' | 'docs'
  type Status = 'open' | 'claimed' | 'in-review' | 'merged'

  interface Task {
  	id: string
  	title: string
  	projectSlug: string
  	category: Category[]
  	status: Status
  	difficulty?: 'easy' | 'medium' | 'hard'
  	points?: number
  	assignees?: { name: string; avatar?: string }[]
  	labels?: string[]
  	lastUpdate?: string
  	githubUrl: string
  }

  interface Cycle {
  	slug: string
  	name: string
  	phase: string // e.g., "Week 3 — Analysis"
  	openTasks: number
  	claimed: number
  	mergedThisWeek: number
  	highlight?: string
  }

  interface ContributorHat {
  	name: string
  	avatar?: string
  	hats: Category[] // roles claimed
  	status: Status // claimed | in-review | merged
  	prNumber?: number
  }

  interface LeaderboardEntry {
  	name: string
  	avatar?: string
  	points: number
  	mergedPRs: number
  	reviews: number
  	docs: number
  }
  ```

- Category → style token map (example): `frontend: 'cyan'`, `backend: 'amber'`, `analytics: 'orange'`, `wiring: 'violet'`, `docs: 'emerald'`. Status badges: `open: green`, `claimed: amber`, `in-review: blue`, `merged: emerald`.
- Mock data (starter set):

  ```js
  const cycles = [
  	{
  		slug: 'ab-sim',
  		name: 'A/B Simulator',
  		phase: 'Week 3 — Analysis',
  		openTasks: 6,
  		claimed: 2,
  		mergedThisWeek: 3,
  		highlight: 'Variant B completion time down 20%'
  	},
  	{
  		slug: 'basketball',
  		name: 'Basketball Shot Analyzer',
  		phase: 'Week 1 — Foundation',
  		openTasks: 4,
  		claimed: 0,
  		mergedThisWeek: 0,
  		highlight: 'Need court heatmap prototype'
  	}
  ]

  const tasks = [
  	{
  		id: 'ab-frontend-grid',
  		title: 'Refine grid animations + accessibility',
  		projectSlug: 'ab-sim',
  		category: ['frontend'],
  		status: 'open',
  		difficulty: 'medium',
  		points: 8,
  		labels: ['a11y'],
  		githubUrl: '#'
  	},
  	{
  		id: 'ab-analytics-backfill',
  		title: 'Backfill PostHog events into Supabase view',
  		projectSlug: 'ab-sim',
  		category: ['backend', 'analytics'],
  		status: 'claimed',
  		difficulty: 'hard',
  		points: 13,
  		assignees: [{ name: 'Alex' }],
  		githubUrl: '#'
  	},
  	{
  		id: 'ab-dashboard-latency',
  		title: 'Dashboard polling backoff tuning',
  		projectSlug: 'ab-sim',
  		category: ['analytics', 'wiring'],
  		status: 'in-review',
  		points: 5,
  		assignees: [{ name: 'Priya' }],
  		githubUrl: '#'
  	},
  	{
  		id: 'bb-heatmap',
  		title: 'Shot chart heatmap prototype',
  		projectSlug: 'basketball',
  		category: ['frontend', 'analytics'],
  		status: 'open',
  		difficulty: 'medium',
  		points: 8,
  		githubUrl: '#'
  	},
  	{
  		id: 'bb-data-pipeline',
  		title: 'Ingest NBA shots API to Supabase',
  		projectSlug: 'basketball',
  		category: ['backend', 'wiring'],
  		status: 'open',
  		difficulty: 'hard',
  		points: 13,
  		githubUrl: '#'
  	}
  ]

  const hats = [
  	{ name: 'Alex', hats: ['backend', 'analytics'], status: 'claimed', prNumber: 123 },
  	{ name: 'Priya', hats: ['analytics'], status: 'in-review', prNumber: 124 },
  	{ name: 'Sam', hats: ['frontend', 'docs'], status: 'merged', prNumber: 121 }
  ]

  const leaderboard = [
  	{ name: 'Sam', points: 34, mergedPRs: 3, reviews: 2, docs: 1 },
  	{ name: 'Priya', points: 21, mergedPRs: 1, reviews: 4, docs: 0 },
  	{ name: 'Alex', points: 18, mergedPRs: 1, reviews: 1, docs: 1 }
  ]
  ```

4. **Page Skeleton in Astro**

- [x] Replace `/projects` with new Build With Me page (Astro + Tailwind).
- [x] Lay out sections with static mock data; ensure responsive grid for cards/leaderboard.
- [x] Add “How to contribute” anchor links and GitHub issue URL placeholders.
  - Sections implemented: Hero/CTA, Active Cycle card, Open Work grid, Hats & PRs strip, Leaderboard, Upcoming/Backlog, How-to-Ship checklist, FAQ/Compliance.

5. **Interactive Layer (React Island)**

- [x] Add lightweight filter layer for category/status (vanilla for now; React island optional later).
- [x] Wire state to mock data; ensure fallback to “all open” on load.

6. **Content & Guidance**

- [x] Embed contributor checklist: fork/branch naming, env setup, testing expectations, PR template preview.
- [x] Add compliance blurb (non-commercial, personal project).

7. **Visual Polish & Motion**

- [x] Apply gradients/pattern background (light, subtle), card depth, animated leaderboard count-up.
- [x] Add micro-hover lifts on key cards (hero CTA, cycles, tasks, hats, leaderboard, upcoming).
- [ ] Optional: staggered reveal + skeletons (defer for GitHub data load).

8. **QA & Accessibility**

- [x] Responsive checks (mobile/tablet/desktop) — layout adapts with grid stacks, hero wrap OK.
- [x] Keyboard navigation/focus states — focus-visible rings on CTA/filters; buttons reachable; filters now set aria-pressed.
- [ ] Light/dark contrast sanity (if applicable); aria labels for buttons/filters (pending contrast audit).

9. **GitHub Integration (Follow-Up)**

- [x] Add a serverless fetch or build-time script to pull GitHub issues/PRs, cache safely. (`npm run fetch:build-with-me`)
- [x] Map GitHub labels → categories/status; surface assignees/PR states; handle rate-limit fallback to cached data.
  - Centralized label/style config: `src/data/build-with-me-config.ts` (Astro) and `.js` (fetch script).
  - Label conventions:
    - Categories: `cat:frontend`, `cat:backend`, `cat:analytics`, `cat:wiring`, `cat:docs`.
    - Difficulty: `diff:easy`, `diff:medium`, `diff:hard`.
    - Points: `points:8` (integer).
    - Project: `project:ab-sim`, `project:basketball` (defaults to `ab-sim` if absent).
    - Status logic: open + no assignee → open; assignee → claimed; linked PR open → in-review; merged PR or closed issue → merged.

10. **Launch Checklist**

- [x] Replace nav link (Projects → Build With Me); update sitemap/rss if needed.
- [ ] Smoke test locally; deploy to Fly; validate production fetch (or mock fallback) works.
