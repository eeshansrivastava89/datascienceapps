# SOMA Portfolio: Hugo → Astro Migration

**Status:** 🟢 LIVE | **Domain:** https://eeshans.com | **Build:** 1.07s | **Version:** Astro 4.4.15

---

## Stack & Deployment

**Core:** Astro 4.4.15 (static) + Tailwind + React + TypeScript  
**Infrastructure:** Fly.io (soma-portfolio, dfw, 2 machines)  
**SSL/TLS:** Let's Encrypt (eeshans.com + www, auto-renewing)  
**CI/CD:** GitHub Actions (push main → build → deploy)

**Critical Config:**

- `astro.config.mjs` - Site: `https://eeshans.com`
- `Dockerfile` - Nginx with `port_in_redirect off`
- `fly.toml` - No PORT env (keeps URLs clean)

---

## Working Principles

- Fix root causes, not symptoms
- Brutalize scope - remove what doesn't earn its weight
- Work in chunks & verify locally before pushing
- Commit small, clear changes
- Prefer code inspection over assumptions

---

## Project Timeline (14.75 hours total)

| Phase      | Work                                      | Time  | Result                  |
| ---------- | ----------------------------------------- | ----- | ----------------------- |
| 1          | Astro setup, theme clone                  | 0.5h  | Dev server running      |
| 2          | Blog posts, assets, timeline.yaml         | 0.75h | Content migrated        |
| 3          | Timeline component (React, 7 logos)       | 1.5h  | Animations working      |
| 4          | Homepage customization                    | 1h    | Personalized content    |
| 5          | A/B simulator page                        | 1h    | Puzzle game + Streamlit |
| 6          | PostHog integration                       | 1.5h  | Event tracking + flags  |
| 7          | UI redesign (489→250 lines JS, 130→0 CSS) | 1.5h  | 49% code reduction      |
| 8          | Framer-Motion removal                     | 0.5h  | Tailwind animations     |
| 9          | Fly.io deployment                         | 2h    | 11 pages live           |
| 10         | Custom domain & SSL                       | 1.5h  | Certificates ready      |
| 11         | Fix :8080 port issue                      | 1h    | URLs clean              |
| **Status** | **LIVE PRODUCTION**                       |       | ✅ Complete             |

---

## What Was Built

**11 Pages:** Homepage, /projects, /projects/ab-test-simulator, /blog, /blog/[slug], /tags, /search, /tools, /about, 404, sitemap

**Core Features:**

- React timeline with 7 company logos (Tailwind animations)
- Interactive A/B test puzzle game (250-line JS, 49% reduction)
- Leaderboard with localStorage
- PostHog event tracking (5 event types)
- Streamlit dashboard embedded
- Full blog system with search, tags, RSS

**Minimization:**

- JS: 489→250 lines (removed dead code, consolidated utilities)
- CSS: 130→0 custom (all Tailwind)
- Dependencies: Removed framer-motion, @astrojs/vercel, @astrojs/node

---

## Critical Fixes

| Issue                 | Fix                                                       | Commit  |
| --------------------- | --------------------------------------------------------- | ------- |
| `:8080` in URLs       | Added `port_in_redirect off;` in Dockerfile Nginx         | ad0994d |
| Broken canonical URLs | Changed site to `https://eeshans.com` in astro.config.mjs | 8732dcf |
| PORT env exposure     | Removed [env] section from fly.toml                       | 6fd76de |

---

## Deployment

**Build:** `npm run build` → 1.07s locally, 3.46s in GA  
**Docker:** Multi-stage (Node 20 → Nginx Alpine, ~23MB)  
**GitHub Actions:** Auto-deploys on main push (needs FLY_API_TOKEN secret)  
**DNS:** Cloudflare A + AAAA + CNAME  
**SSL:** Auto-renewing via Let's Encrypt

---

## Next Steps

1. Add `FLY_API_TOKEN` to GitHub secrets
2. Verify: `fly certs check eeshans.com` shows "Ready"
3. Test: https://eeshans.com (no :8080)
4. Archive soma-blog-hugo after 1 week

---

## Troubleshooting

- Build fails: Run `npm run build` locally
- Port :8080 showing: Check Dockerfile has `port_in_redirect off;`
- Site URL wrong: Verify `astro.config.mjs` site value
- Deploy fails: Ensure FLY_API_TOKEN configured in GitHub
- PostHog missing: Check `.env` has `PUBLIC_POSTHOG_KEY`
