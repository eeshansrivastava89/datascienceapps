# Build with Me: The Vision & Execution Plan

> **One-Liner:** Learn data science by building real products, not just analyzing datasets.

---

## 1. The Manifesto: Why This Exists

**The Problem: Data Science Education is Backwards**
Traditional education follows a linear path: `Theory → Dataset → Analysis`.
Students learn how to use `sklearn` on a clean CSV, but they have no idea how to:

- Instrument a product to track data.
- Design a database schema.
- Ship a feature to production.
- Make decisions based on messy real-time data.

**The Solution: Invert the Model**
We flip the script.
`Build Product → Get Users → Generate Data → Analyze → Iterate`.

**The Audience: The "Non-Elites"**
This project isn't for Stanford PhDs or ex-FAANG engineers. They have their own path.
**Build with Me** is for:

- Self-taught developers.
- Career changers.
- Grads from non-target schools.
- People who need to ship value at "normal" companies with messy data and strict budgets.

**Working Principles:**

1.  **Real Products:** We don't build toys. We build things people actually use.
2.  **Real Data:** We never download datasets. We generate them.
3.  **Full Lifecycle:** Students wear all hats: Product Manager, Engineer, Analyst, Marketer.
4.  **Open & Free:** Always open-source, always non-commercial.
5.  **Tools over Code:** We use production tools (PostHog, Supabase) instead of reinventing wheels.

---

## 2. The Mechanics: Monthly Build Cycles

We not only teach _what_ to build, but _how_ to ship. We run strict **4-week cycles** to replicate the pressure and focus of a real startup or product team.

### The Schedule

**Week 1: Launch & Foundation (The "PM/Eng" Week)**

- **Goal:** Get a "Hello World" specific to the domain live.
- **Activities:**
  - Publish the Product Spec (The "Why").
  - Initialize Repo & Deploy to Fly.io.
  - Set up "Help Wanted" issues for contributors.
- **Deliverable:** A live URL (even if it's just a skeleton).

**Week 2: Build & Instrument (The "Data Engineering" Week)**

- **Goal:** Make the feature functional and tracked.
- **Activities:**
  - Build core app logic.
  - Implement PostHog tracking (Tracking Plan).
  - Wire up Supabase DB & Views.
- **Deliverable:** Functional app generating real data points.

**Week 3: Analysis & Optimization (The "Data Science" Week)**

- **Goal:** Generate insights from the data.
- **Activities:**
  - Build the Real-Time Dashboard.
  - Analyze initial user data (drop-offs, bugs).
  - Ship one iteration based on data (e.g., "Make puzzle easier").
- **Deliverable:** Insight-driven product update.

**Week 4: Polish & Publish (The "Content" Week)**

- **Goal:** Share the learning.
- **Activities:**
  - Final code cleanup and documentation.
  - Write the "What We Learned" technical deep-dive.
  - Add contributors to the Hall of Fame.
- **Deliverable:** Final Blog Post + LinkedIn Recap.

### Multi-Hat Learning

Every project forces the student to switch contexts:

- **Product Manager:** Defining scope ("3 words vs 4 words").
- **Engineer:** Choosing the stack (Astro vs React).
- **Data Scientist:** Defining metrics (Conversion Rate, Retention).
- **Marketer:** Getting people to actually click the link.

---

## 3. The Project Portfolio

### #1: A/B Testing Simulator (✅ Live)

- **Concept:** A memory game ("Find the Pineapples") to generate behavioral data.
- **The Experiment:** Does increasing difficulty (3 vs 4 items) reduce completion rates?
- **Tech Stack:** Astro, PostHog, Supabase (PostgREST), Plotly.js.
- **Status:** Production. Proves the concept works.

### #2: Basketball Shot Analyzer (Next)

- **Concept:** Visualize NBA shot data to compare player efficiencies.
- **The Experiment:** Can we identify "hot zones" for specific players vs league average?
- **Tech Stack:** Python (FastAPI/Scripts), Pandas, Plotly, official NBA API.
- **Focus:** Geospatial analysis, API integration, heavy data transformation.

### #3: Metal Lyrics NLP (Planned)

- **Concept:** Analyze themes and sentiment across Heavy Metal subgenres (Doom vs Power Metal).
- **The Experiment:** Quantifying "aggression" or "sadness" in lyrics over time.
- **Tech Stack:** Python, spaCy/NLTK, Genius API.
- **Focus:** NLP pipelines, text classification, unstructured data.

### Future Ideas

- **Health Tracker:** Wearable data analysis (Apple Health export).
- **Finance Dashboard:** Plaid integration + spending classification.
- **Crypto Backtester:** Simulating trading strategies on historical data.

---

## 4. Strategic Roadmap & Strategy

### Phase 1: Validation (Current)

- [x] **Build the Proof:** A/B Simulator is live and collecting data.
- [x] **Create the Blueprint:** Documentation structure is standardized.
- [ ] **Documentation Deep Dive:** Write the "How I built this" series to seed content.

### Phase 2: Platform Launch (Next 4-6 Weeks)

- [ ] **The Landing Page:** Build `/build-with-me` on `eeshans.com`.
  - Show "Active", "Upcoming", and "Completed" projects.
  - Contributor Leaderboard.
- [ ] **The Announcement:** Launch on LinkedIn with the "Non-Elite" manifesto.
- [ ] **Outreach:** Email CWRU professors (Rakesh Niraj, Jagdip Singh) to share as a resource.

### Phase 3: Scale (Month 3+)

- [ ] **Multi-Project Cycle:** Run "Basketball" and "Metal" simultaneously to test throughput.
- [ ] **Contributor Ecosystem:** Achieve 10+ external contributors submitting PRs.
- [ ] **Content Machine:** Regular YouTube Shorts (60s demos) and Blog deep-dives.

---

## 5. Marketing & Launch Positioning

**The Hook:**

> "I'm not from Google. I'm not from an Ivy League. I'm a Data Science Manager at Starbucks who has been shipping analytics products for 12 years.
>
> Most courses are taught by academics who have never pushed code to production.
> **Build with Me** teaches how data science actually works at 99% of companies: messy data, strict budgets, and the need to ship."

**Draft Launch Post (LinkedIn):**

> "I'm launching Build with Me - an open-source initiative to learn data science by building real products.
>
> Not another tutorial site. Not Kaggle with extra steps.
>
> We build products from scratch, get real users, generate real data, then analyze it.
>
> First project (live): A/B Testing Simulator - 1000+ users, real behavioral data, Bayesian stats.
> Next: Basketball analytics, Metal lyrics NLP.
>
> This is for the self-taught, the career changers, the 'non-elites'.
>
> Monthly cycles. Open contributions. Full credit for your work.
> [Link]"

**Brand Identity:**

- **Name:** "Build with Me" (Personal, collaborative, action-oriented).
- **Voice:** Honest, Anti-Academic, Practical ("This is how it really works").
- **Visuals:** Screenshots of code and dashboards. No stock photos.

---

## 6. Value Propositions

**For Students:**

- **Portfolio Power:** "I built a production analytics app" > "I did a Titanic CSV tutorial."
- **Real Skills:** Experience with the _messy_ parts of DS (Deployment, Logging, SQL Schema).
- **Networking:** Collaboration with a senior industry mentor.

**For You (Eeshan):**

- **O1 Visa Evidence:** Leading a critical open-source educational initiative.
- **Thought Leadership:** Positioning as "The guy who teaches practical DS".
- **Entrepreneurship Test:** Validating content creation and community building skills (non-commercial).

---

## 7. Legal & Compliance (H-1B Safe Mode)

**Status:** Personal Educational Project. **Strictly Non-Commercial.**

**The Golden Rules:**

1.  **Zero Revenue:** No ads, no sponsors, no donations, no courses. Not even $1.
2.  **No "Employees":** Contributors are "volunteers learning together." use language like "community," not "team."
3.  **No Employer IP:** Use only public tools/data. Genericize all work anecdotes ("At large companies...").
4.  **Personal Time Only:** Nights/Weekends, personal equipment only.

**Q&A Defense (If asked):**

- **Q: What is this?**
  - A: "It's a personal educational project, like a blog with coding examples. It helps me learn new tools and share knowledge."
- **Q: Do you make money?**
  - A: "No. Zero revenue. It is purely open-source."
- **Q: Are you managing people?**
  - A: "No. It is an open collaboration on GitHub, similar to contributing to React or Linux."

**Required Disclaimer (Footer/Repo):**

> "Build with Me is a personal educational project by Eeshan Srivastava. All content is open-source (MIT), non-commercial, and created independently for learning purposes. Views are personal and do not represent any employer."

---

## 8. Risks & Mitigations

| Risk                | Mitigation                                                       |
| ------------------- | ---------------------------------------------------------------- |
| **No Contributors** | You build anyway. The content/portfolio value exists even solo.  |
| **Takes Too Long**  | Strict monthly timebox. Feature cuts ("Brutalize Scope").        |
| **O1 Doesn't Care** | You still have a killer portfolio and network.                   |
| **Copycats**        | Execution > Idea. You have the "Proof" (Simulator) already live. |
