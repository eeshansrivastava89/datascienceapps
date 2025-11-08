# SOMA Portfolio: Complete Project History

**Status:** 🟢 LIVE | **Domain:** https://eeshans.com | **Current Version:** Astro 4.4.15 | **Updated:** Nov 8, 2025

---

## Memory Refresh (Read This First)

**What is SOMA?** A demonstration portfolio site showcasing enterprise-grade analytics, experimentation, and data science workflows through an interactive A/B test simulator.

**Three Repos:**
1. `soma-blog-hugo` - Original Hugo blog (Oct 2025, now archived)
2. `soma-streamlit-dashboard` - Analytics dashboard (Oct 2025, still live)
3. `soma-portfolio` - New Astro portfolio (Nov 2025, current production)

**Key Insight:** Each phase solved a different problem. Hugo + PostHog + Supabase + Streamlit proved the concept. Astro migration consolidated everything into one clean, modern stack.

**Most Important File:** This file. Keep it current.

---

## Working Principles

Applied consistently across all three projects:

- **Fix root causes, not symptoms** — Research docs/code deeply before claiming to understand a problem
- **Chunk-based delivery** — Complete small, verifiable pieces. Test before proceeding to next chunk
- **Brutalize scope** — Remove features/configs/dependencies that don't earn their weight. Prefer simplicity over completeness
- **Enterprise mindset** — Every decision should be defensible in a real company context. No toy code
- **Tools over custom code** — Prefer established tools (PostHog, Streamlit, Tailwind) over rolling custom solutions
- **Test thoroughly before shipping** — Build locally, test all features, verify production-like behavior
- **Commit small, clear changes** — One logical fix per commit. Descriptive messages. Easy to review and rollback
- **Code inspection over assumptions** — Read actual files/output. Don't guess about behavior

**When restarting:** Re-read these principles first. They define your decision-making framework.

---

## Complete Project Timeline

### Phase 0: Hugo Blog Foundation (Sept 2025)
- **Work:** Set up Hugo site with custom CSS + custom JavaScript puzzle game
- **Result:** Basic portfolio + A/B test simulator page
- **Stack:** Hugo (Go templates) + custom CSS (130 lines) + vanilla JavaScript (489 lines)
- **Hosting:** Fly.io (soma-blog-hugo-shy-bird-7985.fly.dev)
- **Issue:** Custom code everywhere. Hard to iterate. Stats calculation scattered

### Phase 1: PostHog + Supabase Integration (Oct 25, 2025) — 11 hours
- **Chunk 1 (2h):** PostHog SDK integration, event tracking setup
- **Chunk 2 (3h):** PostHog webhook → Supabase pipeline, database schema
- **Chunk 3 (3h):** Streamlit dashboard built (Python + Pandas + Plotly)
- **Chunk 4 (0.5h):** Embedded Streamlit iframe in Hugo
- **Chunk 5 (0.5h):** End-to-end testing (events → Supabase → dashboard)
- **Chunk 6 (1h):** Removed FastAPI middleware (replaced with Streamlit)
- **Chunk 7 (1h):** Documentation + polish
- **Result:** Enterprise-grade data pipeline working. Custom dashboard removed
- **Key Achievement:** Proved PostHog + Supabase + Streamlit stack works well

### Phase 2: Hugo to Astro Migration (Nov 1-8, 2025) — 14.75 hours
- **Setup (0.5h):** Cloned Astro Theme Resume, fixed TypeScript errors
- **Content (0.75h):** Migrated blog posts, assets, timeline.yaml
- **Timeline (1.5h):** Built React component with 7 company logos, animations
- **Homepage (1h):** Personalized hero, about, projects sections
- **Simulator (1h):** Ported A/B puzzle game, integrated Streamlit embed
- **PostHog (1.5h):** Re-integrated PostHog SDK with safety checks
- **Minimization (1.5h):** Reduced JS 489→250 lines (49%), CSS 130→0 (Tailwind)
- **Removal (0.5h):** Deleted framer-motion dependency, kept animations via Tailwind
- **Deployment (2h):** Docker multi-stage build, Fly.io deployment, 11 pages live
- **Custom Domain (1.5h):** eeshans.com setup with Let's Encrypt SSL
- **Bug Fix (1h):** Fixed :8080 port issue in Nginx redirects
- **Result:** Modern portfolio site live at https://eeshans.com with all features

**Total Project Time:** ~25.75 hours | **Status:** ✅ Complete & Live

---

## Tech Stack & Architecture

### Current Stack (Astro Era)

**Frontend:** Astro 4.4.15 (static site generation) + Tailwind CSS + React (islands)  
**Runtime:** Node.js 20 (build time only)  
**Styling:** Tailwind utilities (no custom CSS)  
**Animations:** Tailwind transforms (formerly Framer Motion)  
**Components:** React for timeline, pure Astro/HTML for everything else

**Deployment Stack:**
```
npm run build          → Astro compiles pages to dist/ (1.07s locally)
Docker multi-stage    → Node 20 build → Nginx Alpine (~23MB image)
Fly.io                → soma-portfolio app, dfw region, 2 machines
Let's Encrypt         → SSL/TLS (eeshans.com + www, auto-renewing)
GitHub Actions        → Auto-deploy on main push (needs FLY_API_TOKEN secret)
Cloudflare            → DNS records (A + AAAA + CNAME for www)
```

### Previous Stack (Hugo Era - ARCHIVED)

**Frontend:** Hugo (Go templates) + Rusty Typewriter theme + custom CSS  
**Backend:** FastAPI (Python) on Fly.io - REMOVED  
**Analytics:** PostHog SDK → Supabase Edge Function webhook → PostgreSQL  
**Dashboard:** Streamlit app (still live, embedding in Astro now)

### Shared Infrastructure (Both Eras)

**PostHog:** Feature flags + event tracking
- API Key: `phc_zfue5Ca8VaxypRHPCi9j2h2R3Qy1eytEHt3TMPWlOOS`
- Host: `https://us.i.posthog.com`
- Feature flag: `word_search_difficulty_v2` (50/50 A/B test)

**Supabase:** PostgreSQL database + Edge Functions
- Project: `nazioidbiydxduonenmb`
- Host: `aws-1-us-east-2.pooler.supabase.com` (connection pooler on port 6543)
- Webhook: PostHog → Edge Function → Events table
- Views: v_variant_stats, v_conversion_funnel, v_stats_by_hour

**Streamlit:** Analytics dashboard (Python app)
- URL: `https://soma-app-dashboard-bfabkj7dkvffezprdsnm78.streamlit.app`
- Repo: soma-streamlit-dashboard
- Refresh: 10-second cache TTL
- Embedding: Iframe in `/projects/ab-test-simulator` page

### Configuration Files (Critical)

**astro.config.mjs** - Site URL must be `https://eeshans.com` (affects canonical URLs & sitemap)  
**Dockerfile** - Nginx must have `port_in_redirect off;` (prevents :8080 in URLs)  
**fly.toml** - No PORT env variable (kept bloat-free)  
**.env** - Contains `PUBLIC_POSTHOG_KEY` and `PUBLIC_POSTHOG_HOST` (git-ignored)

---

## Critical Fixes (All Issues & Solutions)

| Issue | Phase | Root Cause | Solution | Commit |
|-------|-------|-----------|----------|--------|
| FastAPI overhead | Phase 1 | Too much custom middleware | Replaced with Streamlit | N/A (Hugo) |
| 130 lines custom CSS | Phase 2 | Old Hugo approach | Converted to Tailwind utilities | ad0994d |
| 489 lines JS | Phase 2 | Dead code + utility bloat | Minimized to 250 lines (49% reduction) | ad0994d |
| Framer-motion dependency | Phase 2 | Animation overkill | Removed, used Tailwind instead | N/A |
| :8080 in URLs | Phase 2 | Nginx including internal port | Added `port_in_redirect off;` | ad0994d |
| Canonical URLs broken | Phase 2 | astro.config.mjs had wrong site | Changed to `https://eeshans.com` | 8732dcf |
| PORT env exposure | Phase 2 | fly.toml had unnecessary [env] | Removed PORT var | 6fd76de |
| PostHog undefined errors | Phase 2 | No safety checks on SDK calls | Added if-statements before all posthog.* | PHASE_6 |

---

## What Actually Works Now

**11 Production Pages:**
- Homepage (hero, about, timeline with 7 company logos, projects showcase)
- /projects (landing page for all projects)
- /projects/ab-test-simulator (puzzle game + Streamlit dashboard + leaderboard)
- /blog (post listing with pagination)
- /blog/[slug] (individual posts with code highlighting)
- /tags (tag index + per-tag pages)
- /search (full-text search)
- /tools (resources page)
- /about (detailed about page)
- /404 (error page)
- /sitemap.xml (SEO sitemap)

**Core Features:**
- A/B test puzzle game (word search, 60-second timer, leaderboard)
- PostHog feature flags (50/50 variant assignment A vs B)
- Event tracking (puzzle_started, puzzle_completed, puzzle_failed, puzzle_repeated)
- Real-time leaderboard (localStorage persistence + badges: Bronze/Silver/Gold)
- Embedded Streamlit dashboard (live stats, variant performance, funnel analysis)
- Timeline component (React, 7 company logos, scroll animations)
- Full blog system (MDX posts, tags, search, RSS feed)
- Dark mode toggle (theme provider in header)

**Code Quality:**
- 0 external CSS files (all Tailwind)
- 250-line game JS (down from 489)
- 0 framer-motion dependency
- 0 custom CSS (except global animations)
- 11 pages building cleanly in 1.07s
- 23MB Docker image (multi-stage optimized)

---

## How to Maintain This

**If you need to change the puzzle game:**
- Edit: `public/js/ab-simulator.js`
- Test: `npm run dev` → navigate to `/projects/ab-test-simulator`
- Verify: Play game, check PostHog events 30 seconds later
- Deploy: `git add -A && git commit -m "fix: ..."` → `git push origin main`

**If you need to change styling:**
- Edit: `tailwind.config.js` or `src/styles/app.css`
- No custom CSS files (everything is Tailwind)
- Test locally, then deploy

**If you need to add a blog post:**
- Create: `src/content/post/[slug].md` with frontmatter
- Test: `npm run dev` → check `/blog` and `/blog/[slug]`
- Deploy: Push to main

**If PostHog events aren't tracking:**
- Check: `.env` has `PUBLIC_POSTHOG_KEY` and `PUBLIC_POSTHOG_HOST`
- Test: Open browser DevTools → Network → look for posthog requests
- Verify: Post to `https://us.i.posthog.com/e/` should exist
- Check PostHog dashboard directly

**If site won't build:**
- Run: `npm run build` locally to see error details
- Check: All astro.config.mjs settings correct
- Verify: No TypeScript errors
- Test: `npm run preview` to simulate production

---

## Deployment Checklist

Before pushing to production:

- [ ] `npm run build` succeeds locally (no errors)
- [ ] `npm run preview` renders all pages correctly
- [ ] A/B simulator playable and events track to PostHog
- [ ] Blog posts display with correct styling
- [ ] Timeline renders with logos
- [ ] Mobile responsive (test on phone)
- [ ] No console errors (check DevTools)
- [ ] Streamlit iframe loads (check iframe URL in browser)
- [ ] Dark mode toggle works
- [ ] Git status clean (no uncommitted changes)

After pushing:

- [ ] GitHub Actions workflow completes (check Actions tab)
- [ ] Fly.io deployment succeeds (`fly logs` shows success)
- [ ] Visit https://eeshans.com and spot-check pages
- [ ] No :8080 in any URLs
- [ ] PostHog dashboard shows new events from production

---

## Quick Reference

**Critical Files to Know:**
- `astro.config.mjs` - Build config, integrations, site URL
- `Dockerfile` - Container build (Node 20 → Nginx Alpine)
- `fly.toml` - Fly.io config (app name, region, port)
- `src/pages/index.astro` - Homepage
- `src/pages/projects/ab-test-simulator.astro` - Puzzle page
- `public/js/ab-simulator.js` - Game logic & PostHog tracking
- `.env` - PostHog credentials (git-ignored)
- `.github/workflows/deploy.yml` - CI/CD pipeline

**Most Common Commands:**
- `npm run dev` - Start dev server (localhost:4321)
- `npm run build` - Build for production (creates dist/)
- `npm run preview` - Test production build locally
- `fly deploy` - Deploy to Fly.io manually
- `fly logs` - Check deployment logs
- `fly certs check eeshans.com` - Verify SSL certificate

**Useful One-Liners:**
```bash
# Deploy and see live logs
git push origin main && sleep 5 && fly logs -a soma-portfolio

# Test production build works
npm run build && npm run preview

# Reset PostHog variant (in browser console)
localStorage.clear(); posthog.reset(); location.reload();
```

---

## The Complete Story in One Picture

```
Phase 0: Hugo + Custom Code (Sept 2025)
├─ Problem: Everything custom-built, hard to iterate
└─ Result: Works, but painful

Phase 1: PostHog + Supabase + Streamlit (Oct 2025)
├─ Problem: FastAPI middleware unnecessary, stats code scattered
├─ Solution: Use established tools instead of custom code
└─ Result: Modern data pipeline, dashboard easier to modify

Phase 2: Astro Migration (Nov 2025)
├─ Problem: Hugo works but aging, want modern React ecosystem
├─ Solution: Migrate to Astro Theme Resume, keep all integrations
├─ Minimization: JS -49%, CSS -100% (Tailwind), remove framer-motion
└─ Result: Clean, fast, modern portfolio site at eeshans.com

Today: Production Live
├─ All features working
├─ Domain custom (eeshans.com with SSL)
├─ GitHub Actions auto-deploy ready
└─ PostHog → Supabase → Streamlit pipeline still pumping data
```

---

## For Future Sessions

1. Read the "Working Principles" section above (defines how you think)
2. Check the "Tech Stack & Architecture" section (current state)
3. Understand the three repos: Hugo (archived), Streamlit (still running), Astro (current)
4. If something breaks, look at "Critical Fixes" first (you've seen these problems before)
5. Keep this file updated with each major change

This document is your north star. Update it. Reference it.

