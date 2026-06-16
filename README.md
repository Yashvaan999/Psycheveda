# Psycheveda

Your mind power buddy — behavioral psychology (CBT, NLP) meets Vedic wellness.

## What runs today

The **primary app** is the Expo project in [`mobile/`](mobile/): React Native + Expo Router, backed by **Supabase** (Auth + Postgres).

A **legacy MVP** remains in [`frontend/`](frontend/) + [`backend/`](backend/) (FastAPI + MongoDB). See [`architecture.md`](architecture.md).

## Quick start (mobile)

### 1. Database

Create a [Supabase](https://supabase.com) project and run migrations **in order** in the SQL editor:

`database/supabase_migration.sql` → `v2` → `v3` → `v4` → `v5`

### 2. Environment

Create `mobile/.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

From Supabase Dashboard → **Project Settings** → **API**.

### 3. Install and run

```bash
cd mobile
npm install --legacy-peer-deps
npm run web
```

Open **http://localhost:5001**

| Note | Detail |
|------|--------|
| Port | **5001** — macOS often reserves **5000** for AirPlay |
| Script | `npm run web` = `expo start --web --port 5001` |
| Interactive | `npm start` opens Expo dev tools (scan QR / pick web) |

### 4. Web payments (Razorpay — test mode, no Play Store needed)

1. Run migration `database/supabase_migration_v6_3.sql` in Supabase SQL editor (after v6 / v6.2).
2. [Razorpay Dashboard](https://dashboard.razorpay.com) → **Test mode** → create two **Subscription plans**:
   - Monthly **₹150** → copy `plan_id`
   - Yearly **₹1500** → copy `plan_id`
3. Deploy Edge Functions (one-time). **Do not use `npm install -g`** (often permission denied on Mac). Use **`npx`** or Homebrew instead:

```bash
# Option A — npx (no global install)
cd /path/to/Psycheveda
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase secrets set \
  RAZORPAY_KEY_ID=rzp_test_xxx RAZORPAY_KEY_SECRET=xxx \
  RAZORPAY_PLAN_MONTHLY=plan_xxx RAZORPAY_PLAN_YEARLY=plan_xxx \
  RAZORPAY_WEBHOOK_SECRET=whsec_xxx
npx supabase functions deploy create-reset-checkout confirm-reset-razorpay razorpay-webhook

# Option B — Homebrew (one-time install)
# brew install supabase/tap/supabase
# then use `supabase` instead of `npx supabase`
```

4. Razorpay → **Webhooks** → URL  
   `https://YOUR_PROJECT_REF.supabase.co/functions/v1/razorpay-webhook`  
   Events: `subscription.activated`, `subscription.charged`, `subscription.cancelled`, `subscription.halted`
5. Add to `mobile/.env`:

```env
EXPO_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
```

6. Restart `npm run web` → Revive → **Plan** → paywall → **Pay**  
   Test card: `4111 1111 1111 1111`, any future expiry, any CVV.

Coupons still work on web without Razorpay. Mobile IAP (RevenueCat) is optional until App Store / Play setup.

### Restart dev server

```bash
# From mobile/
npm run web
```

If the port is stuck:

```bash
lsof -ti:5001 | xargs kill -9
npm run web
```

## Documentation

| File | Contents |
|------|----------|
| [`architecture.md`](architecture.md) | File map, Revive, Better You Tips, Elevate v2, dashboard perf, APIs |
| [`memory/PRD.md`](memory/PRD.md) | Product requirements and shipped features |
| [`memory/test_credentials.md`](memory/test_credentials.md) | Test accounts, ports, and test flows |
| [`design_guidelines.json`](design_guidelines.json) | UI design system |
| [`.agents/memory/`](.agents/memory/) | Agent runbooks (Elevate, Better You Tips, Life Coach, migrations, npm) |

## Key features

- Five **pillars**, goals, and daily **mini-tasks**
- **Better You Tips** — daily psychological framing popup from `mobile/assets/psychologicaltips.json` (pillar + content; absorb to dismiss)
- **Manual goals:** progress logs + completion % from logged days
- **Elevate plans:** generated locally from the Revive **Plan** assessment via `elevateRulesMatrix.json` (6–7 curated daily habits); tracked via mini-task checkboxes and sub-task history (no progress logs)
- **Consult a Life Coach** — coming-soon placeholder from assessment results (`/life-coach`)
- **Bless Points** (+5 task, +15 gratitude) and **Veda Streak**
- NLP **journal** (2/day) and **gratitude** ritual
- **Completion probability** per goal (Track modal)
- **Revive** — circadian wellness screen (time-adaptive palette; internal route `/hpa-axis`)
