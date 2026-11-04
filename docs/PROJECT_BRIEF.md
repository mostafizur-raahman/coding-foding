# 🧭 Coding Foding — Project Brief (v2)

> **Last updated:** 2026-10-31 · Ei file ta project er **living source of truth**.
> Original brief theke ja bodleche tar list → [§13 Decision log](#13-decision-log-original-→-ekhon).
> Details: [`ARCHITECTURE.md`](./ARCHITECTURE.md) · [`BACKEND_DESIGN.md`](./BACKEND_DESIGN.md)

---

## 1. Tumi ke (Role)

Elite engineering team hisebe kaj korbe. Protiti decision 4 jon expert er chokh diye:

1. **Software Architect** — boundaries, trade-offs, scale (kintu over-engineering na)
2. **Senior Frontend Engineer** — pixel-perfect UI, GSAP animation, accessibility, Core Web Vitals
3. **Principal Backend Engineer** — Go, PostgreSQL, concurrency, security, clean architecture
4. **Senior Infra Engineer** — CI/CD, CDN, caching, observability, Docker

**Kaj er niyom:**
- Code er age **short plan**, tarpor step-by-step implement.
- Production-grade, typed, tested, documented. Placeholder **content** cholbe, placeholder **logic** na.
- Protiti major decision er **"keno"** choto kore likhbe. Unclear hole **assumption likhe** egiye jabe,
  kintu structure-bodlano decision er age user ke confirm korabe.
- Kaj sesh mane: build + lint + test pass **ar** real browser/real server e chaliye dekha.

---

## 2. Product vision

**Coding Foding — Learn how to learn.**
Je keu je kono kichu shikhte pare. Intern/Junior/Senior e bhag kora hoy na — shobar jonno ekটাই
path, shudhu speed alada.

- Problem: YouTube/tutorial e hariye jawa — random video, odhek dekha playlist, "erpor ki?" jani na.
- Solution: ekটা honest path (ups & downs soho), step-by-step, protita step e jano porer step ki.
- Tagline: `</> WHY → CODE → CRACK`
- Audience: Bangladeshi developer / student. Content **en + bn** (developer-Bangla).

---

## 3. Learning structure

### 3.1 Journey path (home page er signature)
Hand-drawn sketch theke neওয়া shape (bam → dan):

```
why? → Programming → DSA → Operating System → Networking Fundamentals → System Design → 🏁 Goal
 (start,     (first      (deepest       (climb)      (peak er por)       (LLD | HLD,       (T-bar
  stick       hill)       valley —                                         final steep       finish)
  figure)                 "এখানে সবাই আটকায়")                               climb)
```

- **System Design** ekটা dot, card e duto bhag: **LLD** (class, SOLID, pattern, UML) ar **HLD**
  (scalability, DB, cache, queue, trade-off).
- Goal: "তুমি শিখতে শিখে গেছ 🎉" → link to roadmap "Next".

### 3.2 Learn tracks (navbar → Learn ▾)
| Track | Journey te? |
|---|---|
| Programming (C/C++, Go, Java, Python, JS — user choose kore) | ✅ |
| DSA | ✅ |
| Operating System | ✅ |
| Networking Fundamentals | ✅ |
| System Design (LLD + HLD) | ✅ |
| Frontend System Design | Learn only |
| Backend First Principles | Learn only |

### 3.3 Baki navigation
- **Problems ▾** — DSA, AI/ML *(v1 e nei, pore)*
- **Blogs** — Git e markdown
- **Plan ▾ → Next · Horizon · Plan** — amader **public roadmap** (user er personal plan na)
- **Leaderboard** — Top 1% in BD 🇧🇩

---

## 4. Home page (ekhon jemon)

Order:
1. **Journey** (page er prothom section, `h1` = "Learn how to learn.")
   - Desktop: section pin, horizontal pan, camera walker ke follow kore. Mobile: vertical path.
   - Scroll e path draw hoy; stick figure hate (uphill e samne jhoke, downhill e pichone).
   - DSA valley te scroll 2× lage (walker slow, ghame, hint text). Peak e haat tole. Goal e confetti.
   - Dot e pouঁchale pop + glow → HUD card (title, desc, topics, hours, Explore).
   - Hand-drawn wobble stroke; dark theme e neon glow, Paper e ink-pen.
2. **আগে → এখন** — বাম: YouTube tile er upor jot-pakano scribble ("আগে YouTube এ track হারিয়ে
   ফেলতাম"). ডান: sad figure numbered step (1–4) dhore hete "understood ✓" e pouঁchay, hashi hoy.
3. **Leaderboard preview** — top 10, division filter, animated counter.
4. **Most Needed** — community vote grid.
5. **Roadmap** — Next (progress bar soho) · Horizon · Plan (dashed, "horizon er oparer").
6. **Stats + testimonials**
7. **Final CTA + Footer**

**Chrome:** floating glass pill navbar (scroll e compact), tar pichone progressive blur shade;
protita section er kone artist-style doodle (sparkle, spiral, `</>`, bulb, plane, coffee…).

**Animation rules:** `prefers-reduced-motion` e static final state; shudhu transform/opacity/
stroke-dashoffset; GSAP lazy-load (first-load JS e nei); lazy section gulo setup sesh e
`ScrollTrigger.sort() + refresh()`; pin er `refreshPriority` agee.

---

## 5. Appearance (user choose kore)

- **7 theme:** System, Midnight (default dark), **Obsidian** (true-black, amber), Paper (notebook),
  Dracula, Solarized, Matrix. Circular View-Transition reveal.
- **8 font pair** (Latin + Bangla): Modern (Inter + Hind Siliguri, default), Friendly (Nunito + Baloo
  Da 2), Anek (Anek Latin + Anek Bangla), Bookish (Source Serif + Tiro Bangla); **Mono:** JetBrains
  Mono, Fira Code, IBM Plex Mono, Space Mono (+ Hind/Anek Bangla).
- Ek ◐ "Appearance" menu e duto-i. `<head>` boot script → kono flash na. Non-default font lazy-load.
- Logged-in hole DB te save (`users.theme`, `users.font`), na hole `localStorage`.
- Protiti theme e WCAG AA contrast.

---

## 6. Language (en + bn)

- Route `/en/...`, `/bn/...` (next-intl), switcher `EN | বাং` (reload chara, scroll thake).
- **bn = developer-Bangla:** sentence/verb Bangla, technical term English
  (library, thread, deploy, API, cache…). Code/CLI sobsomoy English. Number English digit (10, না ১০).
  Tone: friendly senior bhaiya/apu. Glossary: [`content/glossary.json`](../content/glossary.json).
- Typography: Bangla e line-height 1.8; Bangla text kokhono character-level split na (word/grapheme).
- Translation na thakle `en` fallback + badge "এখনো বাংলায় আসেনি".

---

## 7. Content system

- **Content body Git e** (`content/` → pore alada repo), DB te shudhu metadata.
- Code example: protita example **real file** 5 language e
  (`content/examples/<slug>/solution.{cpp,go,py,java,js}` + `tests.json`).
  Lesson e `<CodeTabs example="…" />`; user er language choice mone thake.
- **CI protita example compile + test kore** → vul code merge hoy na.
- Syntax highlight build-time (Shiki), browser e extra JS na.
- Merge hole CI → `POST /admin/content/sync` (HMAC) → DB metadata upsert;
  bn er `translated_from` hash ≠ en hash → status `outdated`.

---

## 8. Frontend

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript 5.9 (strict; TS 6 Next 15 er sathe build e fail
kore) · Tailwind v4 + CSS variables · GSAP (ScrollTrigger) + Lenis · TanStack Query · Zustand ·
Radix/shadcn-style primitives (`packages/ui`) · RHF + Zod (form) · next-intl.

- Journey walker **own arc-length table** diye chole (MotionPathPlugin na): stroke, walker, dot, camera
  ek source theke → kokhono alada hoy na. Unit tested.
- Targets: LCP < 2.0s, CLS < 0.05, INP < 200ms, Lighthouse 95+. Home ekhon static (SSG), first-load ~143 KB.
- Pages (baki): `/learn/[track]`, `/lesson/[id]`, `/blogs`, `/leaderboard`, `/profile/[username]`,
  `/settings`, `/auth/{login,register,verify,reset}`, `/admin`.

---

## 9. Backend

**Stack:** Go 1.23+ · chi · PostgreSQL 16 · **pgx/v5 + pgxpool** (driver + connection pool) ·
**sqlc** (asol SQL lekho → type-safe Go; ORM na) · goose migrations · Redis 7 · Asynq jobs ·
slog JSON · go-playground/validator.

**Architecture:** modular monolith, hexagonal — `transport → service → domain ← repository`.
Service shudhu `domain` interface chene → fake diye unit test. Ek binary, `-mode=api|worker|all`.

**v1 scope:** identity · catalog (Git metadata) · progress (XP + streak) · leaderboard · community
votes · roadmap · admin/audit. **v1 e nei:** problem solving/judge, AI/ML problems, personal plan,
contest, in-app notification.

**Roles:** `learner` / `mentor` / `admin` (permission, seniority na).

**v1 tables:** users, sessions, user_tokens, oauth_accounts, tracks, lessons, lesson_locales,
content_syncs, lesson_progress, xp_events, leaderboard_snapshots, topics, votes, roadmap_items,
audit_logs. UUID v7, proper index/constraint.

**Correctness rules:**
- Postgres source of truth; Redis shob kichu rebuild-able (ZSET, cache, rate-limit, queue).
- XP ledger idempotent (`unique(user, source)`), counter same tx e, optimistic lock (`version`) + retry.
- One user one vote (PK). READ COMMITTED + constraint + row lock, SERIALIZABLE na.
- `context` propagate, timeout; bounded worker pool; `errgroup`; `go test -race` CI te must.
- Graceful shutdown: SIGTERM → `/readyz` fail → drain → close.

**API:** REST `/api/v1`, error `{"error":{"code","message","request_id"}}`, cursor pagination,
public endpoint e ETag/Cache-Control, OpenAPI 3.

---

## 10. Security

argon2id password · JWT access 15 min + rotating refresh (httpOnly, Secure, SameSite=Strict, path
`/api/v1/auth`) with **reuse detection** · CSRF double-submit (cookie endpoint) · rate limit (Redis
token bucket: global, auth 10/min, email 3/10 min) · login lockout 5 fail/15 min · token shudhu
sha256 hash e store · no account enumeration · RBAC middleware · strict security headers · audit log ·
secrets env/secret manager e · govulncheck, npm audit, gosec, CodeQL · PII minimal, password/token kokhono log na.

---

## 11. Infra & dev workflow

- `compose.yaml`: Postgres **:5433**, Redis **:6380**, Mailpit **:8025** (host er 5432/6379 er sathe clash na).
- API: `apps/api/.env` (git-ignored) → `go run ./cmd/migrate up` → `go run ./cmd/api -mode=all`.
- Web: `npm run dev` (port 3000).
- ⚠️ Verify build **kokhono** `.next` e na: `NEXT_DIST_DIR=.next-build next build` + port 3100 —
  naile running dev server bhenge jay.
- Docker multi-stage (distroless), GitHub Actions (lint, typecheck, test -race, build, security scan),
  Vercel/Cloudflare (web), container platform (API), OpenTelemetry + Prometheus + Sentry,
  Postgres daily backup + PITR.

---

## 12. Status

| Area | Status |
|---|---|
| Home page (journey, আগে→এখন, leaderboard, most needed, roadmap, stats, CTA) | ✅ done (preview data) |
| Themes (7) + fonts (8) + i18n en/bn | ✅ done |
| Floating navbar, mobile menu, progressive blur, doodles | ✅ done |
| Backend design doc (first principles, HLD, LLD) | ✅ done |
| Backend v1 schema + auth (register, login, verify, refresh, logout, forgot/reset, /me) | ✅ done, tested end-to-end |
| Frontend auth pages (`/auth/*`) | ⏭️ next |
| Google/GitHub OAuth routes | ⏭️ next (service logic ready) |
| Catalog + content sync, progress/XP, leaderboard API, votes API, roadmap API | 🔜 |
| Learn / lesson / blog pages, CodeTabs | 🔜 |
| Docker images, CI pipeline, deploy | 🔜 |
| Problems, AI/ML, contests | 🧊 later |

---

## 13. Decision log (original → ekhon)

| Original brief | Ekhon | Keno |
|---|---|---|
| Hero section ("Everything you need, in one path.") | **Baad**; journey e page shuru, headline "Learn how to learn." | User er chaওয়া; path i ashol golpo |
| Intern / Junior / Senior section + roles | **Baad**; roles learner/mentor/admin | "Any one can learn anything" |
| 10 milestone (Projects, Crack the job, Top 1% path e) | **why → Programming → DSA → OS → Networking → System Design → Goal** | Sketch er shape, focused path |
| Plan / Horizon = personal 30/60/90 day plan | **Next / Horizon / Plan = public roadmap** | Amra ki ki ante jacchi sheta dekhano |
| Content DB te (CMS editor) | **Git e**, DB te metadata | Code example CI te test, PR review, CDN speed |
| Problems & judge v1 e | **v1 theke baad** | Age foundation; judge alada boro kaj |
| 5+ theme | **7 theme** (+Obsidian) + **8 font pair** | User choice |
| Brief e nei | **আগে → এখন** section, artist doodles, floating glass navbar | User sketch/feedback |
| MotionPathPlugin | Own arc-length table | Stroke ar walker drift korto |
| Next.js 15 | Same, kintu **TS 5.9 pin** | TS 6 Next 15 e build fail |

---

## 14. Working agreement (user preference)

- Reply **Banglish** e; boro/ambiguous kaj er age "bujhechi" bole plan confirm.
- User section-by-section steer kore (sketch/screenshot diye) — oi order follow.
- **Git:** commit user er nam e (`mostafizur-raahman`), **kono Claude / Co-Authored-By line na**.
  Commit/push shudhu user bolle; push user nije kore (`git push -u origin main`).
- Running dev server (3000) ar `.next` e kokhono hat deওয়া na.
