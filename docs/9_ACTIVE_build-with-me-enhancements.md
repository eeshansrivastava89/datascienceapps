# Build Log Enhancements

**Goal**: Reframe `/build-with-me/` → `/build-log/` as solo-first learning journey with optional contribution.

**Package location**: `packages/build-log/`

---

## Prioritized Enhancement List

| Rank | Enhancement | Why It Matters | Effort | Status |
|------|-------------|----------------|--------|--------|
| **1** | **Activity Feed** — Recent claims/merges/opens with avatars | Creates momentum, social proof. | Medium | ✅ Done |
| **2** | **Hero Rewrite** — Stats bar, manifesto copy, video CTA | First impression sells the vision. | Low | ✅ Done |
| **3** | **Task Enrichment** — "You'll Learn" tags, "Good First Issue" badge | Makes tasks interesting. | Medium | ✅ Done |
| **4** | **Recently Merged / Shoutouts** — Contributor credit | Public credit = motivation. | Low | ✅ Done |
| **5** | **Leaderboard Upgrades** — Streak indicators | Gamification drives return visits. | Medium | ✅ Done |
| **6** | **Filter Pills** — Quick filters | Reduces friction. | Low | ✅ Done |
| **7** | **Start Here Guide** — Collapsible onboarding | Answers "how do I start?" | Low | ✅ Done |
| **8** | **Video Modal** — Overlay player | Visual learners. | Medium | ✅ Done |
| **9** | **Quick Nav Bar** — Section links | Navigation + scanability. | Low | ✅ Done |
| **10** | **Mobile Polish** — Responsive fixes | Critical for social sharing. | Medium | ✅ Done |
| **11** | **Route Rename** — `/build-with-me/` → `/build-log/` | Matches new branding. | Low | ✅ Done |
| **12** | **Build Log Reframe** — Reorder: Hero → Projects → Learnings → Contribute | 80/20 split. | Medium | ✅ Done |
| **13** | **Latest Learnings Section** — Blog post links | Content is the engine. | Low | ✅ Done |
| **14** | **Current Projects Section** — What's live, stats | Showcase before asking for help. | Low | ✅ Done |
| **15** | **Hero Copy Update** — "The Build Log" framing | Solo-first, AI-native. | Low | ✅ Done |
| **16** | **PostHog Tracking [Later]** — CTA clicks, scroll | Data to optimize. | Low | ⬜ Later |
| **17** | **Learnings YAML + Schema** — Data file for learnings ([#28](https://github.com/eeshansrivastava89/soma-portfolio/issues/28)) | YAML with JSON schema for VS Code autocomplete. | Low | ✅ Done |
| **18** | **Learnings Timeline** — Timeline component ([#29](https://github.com/eeshansrivastava89/soma-portfolio/issues/29)) | Visual timeline with type badges, pagination. | Medium | ✅ Done |
| **19** | **Filter Pills + Pagination** — Project filters ([#30](https://github.com/eeshansrivastava89/soma-portfolio/issues/30)) | Filter by project, 10 items per page. | Low | ⬜ Not started |
| **20** | **Contribute Page** — Separate `/build-log/contribute/` ([#31](https://github.com/eeshansrivastava89/soma-portfolio/issues/31)) | Move 20% contribution content to own page. | Medium | ⬜ Not started |
| **21** | **Contribute Nav Link** — Add to header ([#32](https://github.com/eeshansrivastava89/soma-portfolio/issues/32)) | Direct access to contribution page. | Low | ⬜ Not started |

---

## Progress Log

### Route Rename Complete ✅
**Completed:** 2025-11-27

**Summary:** Full rename from `build-with-me` → `build-log` including folder, package name, and all internal references.

**Changes:**
- Renamed folder: `packages/build-with-me/` → `packages/build-log/`
- Package name: `@soma/build-with-me` → `@soma/build-log`
- Astro config: `base: '/build-log'`, `outDir: '../../dist/build-log'`
- Dockerfile: Added `/build-log/` nginx location block
- Root package.json: `dev:bwm` → `dev:build-log`
- Header.astro: Nav link updated to `/build-log`
- Internal files renamed:
  - `build-with-me-config.js/ts` → `build-log-config.js/ts`
  - `build-with-me-data.json` → `build-log-data.json`
  - `validate-build-with-me.ts` → `validate-build-log.ts`
  - `BuildWithMeView.tsx` → `BuildLogView.tsx`
- All imports updated across 10+ component files

### Major Redesign: Design Consolidation ✅
**Completed:** 2025-11-25

**Summary:** Consolidated 3 sections into unified `ContributorCards`. Removed competitive elements.

**Key changes:**
- `ContributorCards.tsx`: Unified contributor display
- `index.astro`: Hero redesign with video, quick nav pills
- `StartHereGuide.tsx`: Always-visible expand/collapse
- `VideoModal.tsx`: Video overlay
- Deleted: `LeaderboardTable.tsx`, `Shoutouts.tsx`, `DataFreshness.tsx`
- React 19 upgrade

---

## Next Up: Build Log Reframe (Items 12-15)

### Page Structure Target

```
/build-log/ page layout:

1. Hero — "The Build Log" (AI-native journey, solo-first)
2. Current Projects — A/B Simulator card with status, stats, "Try it" CTA
3. Latest Learnings — Blog post links (empty state until first post)
4. Want to Contribute? — GitHub issues table (existing TasksTable)
5. Contributors — Credit section (existing ContributorCards)
```

### Copy Drafts

**Hero:**
- Title: The Build Log
- Subtitle: Learning AI-native product development in public — and documenting everything.
- Body: I'm building full-stack products with AI tools, then doing data science on real user data. Everything is open: the code, the decisions, the mistakes.
- CTAs: "See Current Project" / "Want to Contribute?"

**Current Projects:**
- Section Title: What I'm Building
- A/B Simulator card: ✅ Live, stack pills, "Try It →" CTA

**Learnings:**
- Section Title: What I've Learned
- Empty state: "First build log post coming soon. Explore the code on GitHub."

### Implementation Notes

- Keep all existing React components — just restructure layout in `index.astro`
- Add new sections (Projects, Learnings) above TasksTable
- Move TasksTable + ContributorCards lower (20% section)
- Update hero copy

---

### Learnings Infrastructure ✅
**Completed:** 2025-11-27

**Summary:** Added YAML-based learnings data with timeline component.

**New files:**
- `packages/shared/src/data/learnings.yaml` — Data file with 2 seed entries
- `packages/shared/src/data/learnings.schema.json` — JSON schema for VS Code autocomplete
- `packages/shared/src/lib/learnings.ts` — TypeScript loader with types + helpers
- `packages/build-log/src/components/LearningsTimeline.tsx` — Timeline component

**Features:**
- Type badges: 📝 Blog, 📰 Substack, 📄 Doc, 🎥 Video
- Featured items pinned to top
- External link indicators
- Tags display
- Built-in pagination (10 items per page)
- Empty state fallback

---
