# Psycheveda — Architecture Map

> Condensed root-level summary for LLM context. Pair with `design_guidelines.json`
> for UI tokens. **Primary shipped client:** `mobile/` (Expo + Supabase).

_Last updated: 2026-06-16 (Reset Plan, Razorpay Standard Checkout, Vercel deploy, favicon)_

## High-level

Psycheveda bridges behavioral psychology (CBT, NLP) with Vedic wellness.

| Layer | Stack | Role |
|--------|--------|------|
| **Primary app** | Expo 56 + Expo Router + React Native Web | Production UI (local + **Vercel**) |
| **Data** | **Supabase** (PostgreSQL + Auth) | Live store for `mobile/` |
| **Web payments** | Razorpay Standard Checkout + Supabase Edge Functions | `create-order`, `verify-payment` |
| **Mobile payments** | RevenueCat (optional) | iOS / Android IAP |
| **Legacy MVP** | CRA `frontend/` + FastAPI `backend/` + MongoDB | Original Emergent MVP; schema mirrored in SQL migrations |

- **Auth (mobile):** Supabase email/password (`mobile/src/lib/supabase.js`, `auth.js`)
- **Auth (legacy):** JWT email/password (`backend/server.py`)
- **Theme:** Light **Saffron, Sage & Linen** (`mobile/src/lib/theme.js`). **Revive** (`/hpa-axis`) is the only runtime-adaptive palette (device local time).

## Directory map

```
├── architecture.md              # ← this file
├── README.md                    # Repo overview + local run
├── design_guidelines.json       # Design system tokens & screen blueprints
├── database/
│   ├── supabase_migration.sql   # v1 core schema
│   ├── supabase_migration_v2.sql … v5.sql
│   ├── supabase_migration_v6.sql … v6_5.sql  # Reset Plan + Razorpay
├── supabase/
│   ├── config.toml              # Edge Function JWT settings
│   └── functions/
│       ├── create-order/        # Razorpay Standard Checkout (active)
│       ├── verify-payment/
│       ├── create-reset-checkout/  # legacy subscription path
│       └── _shared/razorpay.ts
├── mobile/                      # ★ Primary app (Expo + Supabase)
│   ├── package.json             # npm run web → 5001; export:web → dist/
│   ├── vercel.json              # SPA rewrites for production
│   ├── app.json                 # web.favicon → favicon-v2.png
│   ├── .env                     # EXPO_PUBLIC_SUPABASE_*, EXPO_PUBLIC_RAZORPAY_KEY_ID
│   ├── app/
│   │   ├── reset-subscribe.js   # Reset Plan paywall hub
│   │   ├── reset-payment.js     # Razorpay checkout (web)
│   │   ├── gut-brain-plan.js    # Gated — Success Identity + Elevate
│   │   ├── hpa-axis.js          # Revive → Plan routes to /reset-subscribe
│   ├── assets/
│   │   ├── brand-logo.png           # Header / auth logo
│   │   ├── favicon-v2.png           # Web favicon (icon only)
│   │   ├── psychologicaltips.json
│   │   └── daily-oracle-bg.png
│   └── src/
│       ├── lib/
│       │   ├── resetSubscription.js # Entitlement helpers, plan pricing
│       │   ├── razorpayWeb.js       # Standard Checkout modal (web)
│       │   ├── revenueCat.js        # Mobile IAP (iOS/Android)
│       │   ├── api.js               # fetchDashboard, createRazorpayOrder, …
│       │   ├── completionProbability.js
│       │   ├── elevatePlan.js       # Rules-matrix v2 plan builder
│       │   ├── elevateRulesMatrix.json
│       │   ├── psychologicalTips.js
│       │   ├── successIdentity.js   # IDENTITY_STAGES + scoring
│       │   ├── supabase.js, auth.js, theme.js, utils.js
│       └── components/
│           ├── DailyOracleCard.js   # Better You Tips trigger + popup modal
│           ├── TrackModal.js
│           ├── ElevateSubtaskHistory.js
│           ├── ResetPaywall.js
│           └── AppShell.js, ui.js, DateRangeCalendar.js, …
├── frontend/                    # Legacy CRA (FastAPI client)
├── backend/
│   ├── server.py
│   └── tests/backend_test.py
└── memory/                      # PRD, test_credentials
```

## Progress tracking (mobile)

### Two goal modes

| | **Manual goals** (`goals.source = 'manual'`) | **Elevate goals** (`goals.source = 'elevate'`) |
|---|---------------------------------------------|------------------------------------------------|
| Daily work | Optional **progress logs** (`goal_progress_logs`) | **Mini-task checkboxes** on Dashboard only |
| Completion % input | Progress-log days | `mini_tasks` completed / missed |
| Goal detail UI | Progress log form + history | Completion % + `ElevateSubtaskHistory` |
| Reminders | Yes — missing today's log | No — excluded from `goalReminders` |
| API | `logProgress`, `listProgressLogs` | Blocked / returns `[]`; `toggleTask` on Dashboard |

### Data model (Supabase)

| Table / field | Tracks |
|---------------|--------|
| `mini_tasks` | Daily sub-tasks (`scheduled_for`, `completed`); Elevate: `source`, `time_window`, `scheduled_time` |
| `goal_progress_logs` | **Manual goals only** — free-text daily notes |
| `goals.source` | `manual` \| `elevate` (v5 migration) |
| `bless_transactions` + `profiles.bless_points_balance` | Bless ledger |
| `profiles.veda_streak`, `last_activity_date` | Activity streak |
| `journal_entries` | NLP journal (max 2/day) |
| `gratitude_entries` | Three blessings (+15 Bless) |
| `gut_brain_assessments` | Success Identity questionnaire |

Run migrations **v1 → v6_5** in order in the Supabase SQL editor.

### Reset Plan subscriptions (v6+)

| Table / RPC | Role |
|-------------|------|
| `reset_subscriptions` | Active entitlement per user (`provider`: coupon, revenuecat, razorpay) |
| `reset_promo_coupons` | Multi-use codes; 100% off or `checkout_price_inr` (e.g. ₹1) |
| `get_reset_entitlement()` | Client read — entitled?, days remaining |
| `redeem_reset_coupon()` | Free monthly access (test codes) |
| `validate_reset_checkout_coupon()` | Paid promo before Razorpay checkout |
| `admin_sync_reset_razorpay_subscription()` | Edge Function grants access after payment |

**Gating:** `gut-brain-plan.js` redirects if not entitled; dashboard hides Elevate content when lapsed.

**Pricing:** ₹150/month, ₹1500/year. Web: Razorpay Standard Checkout. Mobile: RevenueCat (when configured).

### Completion probability (`completionProbability.js`)

Starting score **100%**. Penalties on miss events in chronological order:

| Scenario | Penalty |
|----------|---------|
| 1 missed (edge streak) | −5% |
| 2 consecutive misses | −25% (one application per run) |
| 3 consecutive | −50% |
| k ≥ 4 consecutive | −min(5^k / 10, 80)% |
| Scattered singleton (hits before and after) | −2% × scattered index |

- **Floor:** 5% minimum score  
- **Cap:** total penalty ≤ 95%  
- **Elevate:** each past incomplete `mini_task` = miss; today incomplete = pending  
- **Manual:** each past day without progress log = miss  

Color bands in UI (`probColorForScore` in `utils.js`): ≥75% green, 50–74% amber, 30–49% orange, &lt;30% red.

### Key API methods (`mobile/src/lib/api.js`)

| Method | Behavior |
|--------|----------|
| `fetchDashboard` | **Single batched load** for dashboard: slim goals + today's tasks + stats; 4s in-memory cache; `invalidateDashboardCache()` on task toggle |
| `listGoals` | Slim goal list (no nested `mini_tasks`; detail uses `getGoal`) |
| `tasksToday` | Today's `mini_tasks` (selected columns only) |
| `toggleTask` | Mark mini-task complete (+5 Bless) |
| `logProgress` | Manual goals only; rejects `elevate` |
| `listProgressLogs` | Returns `[]` for Elevate goals |
| `goalTrackingData` | Per-goal %, timeline, `taskHistory` (Elevate) |
| `goalReminders` | Manual goals missing today's progress log |
| `generateElevatePlan` | Local rules-matrix plan (`elevatePlan.js` + `elevateRulesMatrix.json`) |
| `createElevateGoal` | Inserts goal + all plan `mini_tasks` |
| `getResetEntitlement` | RPC wrapper for Plan gating |
| `createRazorpayOrder` | Edge Function `create-order` |
| `verifyRazorpayPayment` | Edge Function `verify-payment` |
| `redeemResetCoupon` | Free coupon redemption |

### Better You Tips (`psychologicalTips.js` + `DailyOracleCard.js`)

| Concern | Behavior |
|---------|----------|
| Content | `mobile/assets/psychologicaltips.json` — `{ id, pillar, content }` per tip |
| Selection | Stable daily tip per user + date (hash seed) |
| UI | Dashboard trigger at top → **popup modal** (background image, pillar badge, content, **Absorb Strategy**) |
| State | AsyncStorage per user/day; reopen via trigger anytime; auto-opens first visit if not absorbed |
| Naming | User-facing **Better You Tips** (internal files may still say `oracle` / `DailyOracle`) |

### Revive screen (`hpa-axis.js`)

- Bottom nav label: **Revive** (route `/hpa-axis` unchanged).
- Layout: phase chips → hero (tagline + phase description) → **Plan** button → intro copy.
- Phase copy in `hpaPalettes` (`theme.js`): Morning / Afternoon / Night with tailored descriptions.
- **Plan** → `/reset-subscribe` (paywall) → `/reset-payment` (web Razorpay) or `/gut-brain-plan` if entitled.

### Success Identity (`successIdentity.js` + `gut-brain-plan.js`)

- Tiers: Survivor, Soldier, Warrior, Superhero (from 30-question assessment).
- `IDENTITY_STAGES` — full stage descriptions; info icon on results opens stage carousel modal.
- Results screen CTAs (in order): **Elevate Yourself** (primary) → **Consult a Life Coach** (secondary) → retake link.
- Elevate uses `current_tier` + demographics + assessment answers (e.g. Q17 exercise) for plan matrix.

### Consult a Life Coach (`life-coach.js`)

- Route: `/life-coach` — static **coming soon** screen (no API/backend yet).
- Entry: assessment results → **Consult a Life Coach** button below **Elevate Yourself**.
- UI: saffron/sage gradient card, feature pills, **Return to my results** + back navigation.
- Planned: human coaching sessions aligned to Success Identity tier (not implemented).

### Elevate plan engine v2 (`elevatePlan.js` + `elevateRulesMatrix.json`)

| Input | Used for |
|-------|----------|
| `tierDurations` | 7 / 14 / 21 days (Survivor / Soldier / Warrior) |
| `rulesMatrix` phases | morningPhase, afternoonPhase, eveningPhase |
| Conditions | age, tier, food preference, occupation, `hasExerciseRoutine` |
| Variants | age band, tier, diet, exercise type, `all` fallback |
| Output cap | **6–7 daily tasks** via phase-balanced curation (core habits + one optional booster) |

### UI map

| Screen / component | Shows |
|------------------|--------|
| `dashboard.js` | Better You Tips trigger; mini-tasks; devotions; goals; stale-while-revalidate refresh on focus |
| `goals/[id].js` | Manual: progress logs; Elevate: % + sub-task history |
| `TrackModal.js` | Goal-level completion %, sparkline, Elevate history |
| `ElevateSubtaskHistory.js` | Date-wise completed / missed / pending sub-tasks |
| `AppShell.js` | Bless, streak, manual-goal reminders (reminders only — no duplicate stats fetch) |
| `gut-brain-plan.js` | 30-Q assessment, tier results, Elevate modal, Life Coach link |
| `life-coach.js` | Coming soon placeholder for coaching feature |

## API surface (legacy FastAPI)

Used by `frontend/` only. Routes prefixed `/api`.

| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/health | Liveness |
| POST | /api/auth/register, /api/auth/login | JWT auth |
| GET | /api/auth/me | Profile + bless + streak |
| GET/POST | /api/goals, /api/onboarding/pillars | Goals + pillars |
| GET | /api/tasks/today | Today's mini-tasks |
| PATCH | /api/tasks/{id} | Toggle task |
| GET/POST | /api/journal | NLP journal |
| GET | /api/stats | Dashboard stats |
| GET | /api/hpa-axis/phase | Circadian hint |

## Bless ledger (mobile)

- **+5** per mini-task completed (`toggleTask`)
- **+15** per daily gratitude (`createGratitude`)
- Journal does **not** award Bless in the Supabase app
- **Veda Streak:** consecutive bless-earning days (tasks, gratitude; progress log may bump streak on manual goals)

## Revive circadian phases

`getHpaPhase()` in `theme.js` (used by Revive `/hpa-axis`):

- `05:00 – 13:59` → `cortisol_am` (Morning — Cortisol Rise)
- `14:00 – 16:59` → `twilight` (Afternoon — Twilight Pause)
- `17:00 – 04:59` → `melatonin_pm` (Night — Melatonin Descent)

## Local run (mobile)

```bash
cd mobile
npm install --legacy-peer-deps
npm run web            # → http://localhost:5001
npm run export:web     # → dist/ (Vercel production build)
```

## Production (Vercel)

- Root: `mobile/`, output: `dist/`, see `mobile/vercel.json`
- Env: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_RAZORPAY_KEY_ID`
- Supabase Auth Site URL must match Vercel domain
- Details: `.agents/memory/vercel-deployment.md`

Legacy: Mongo + `uvicorn` on :8001 + CRA `frontend` on :3000.

## Reflection notes

- **Journal quota:** API + Postgres trigger `enforce_journal_daily_limit()`.
- **Hour goals:** `ceil(hours/24)` mini-task span; `deadline_at` from estimate at create.
- **Completion %** only on goals (Track modal / Elevate goal page), not beside dashboard mini-tasks.
- **Elevate goals** must have `goals.source = 'elevate'` in Supabase (v5); otherwise they behave as manual goals.
- **Dashboard perf:** do not reintroduce `select('*, mini_tasks(*)')` on list views — use `fetchDashboard` / slim selects; full tasks load on goal detail only.
- **Internal routes:** `/gut-brain-plan`, `gut_brain_assessments` table names are legacy; user-facing brand is **Revive** + **Plan**.
- **Web favicon:** `mobile/assets/favicon-v2.png` via `app.json` `web.favicon` (icon only, not full logo).
- **Web payments:** Razorpay Standard Checkout only needs `RAZORPAY_KEY_ID` + `SECRET` in Supabase secrets — no subscription `plan_id` for current flow.
