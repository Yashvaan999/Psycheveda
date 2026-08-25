# Psycheveda

Your mind power buddy — behavioral psychology (CBT, NLP) meets Vedic wellness.

## What runs today

The **primary app** is the Expo project in [`mobile/`](mobile/): React Native + Expo Router + React Native Web, backed by **Supabase** (Auth + Postgres).

- **Web:** `npm run web` locally or **Vercel** in production
- **Payments (web):** Razorpay Standard Checkout via Supabase Edge Functions
- **Payments (mobile):** RevenueCat IAP (optional; App Store / Play)
- **Legacy MVP:** [`frontend/`](frontend/) + [`backend/`](backend/) — see [`architecture.md`](architecture.md)

## Quick start (local)

### 1. Database

Run migrations **in order** in the Supabase SQL editor:

`supabase_migration.sql` → `v2` → `v3` → `v4` → `v5` → **`v6`** → `v6_1` → `v6_2` → `v6_3` → `v6_4` → `v6_5`

See [`.agents/memory/supabase-migrations.md`](.agents/memory/supabase-migrations.md).

### 2. Environment

Create `mobile/.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
EXPO_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
```

### 3. Install and run

```bash
cd mobile
npm install --legacy-peer-deps
npm run web
```

Open **http://localhost:5001** (port 5001 — macOS often reserves 5000 for AirPlay).

### 4. Web payments (Razorpay test mode)

1. [Razorpay Dashboard](https://dashboard.razorpay.com) → **Test mode** → **Settings → API Keys** → generate test Key ID + Secret
2. Set Supabase secrets and deploy Edge Functions:

```bash
cd /path/to/Psycheveda
SUPABASE_ACCESS_TOKEN=sbp_xxx npx supabase secrets set --project-ref YOUR_PROJECT_REF \
  RAZORPAY_KEY_ID=rzp_test_xxx RAZORPAY_KEY_SECRET=xxx
SUPABASE_ACCESS_TOKEN=sbp_xxx npx supabase functions deploy create-order verify-payment --project-ref YOUR_PROJECT_REF
```

3. Revive → **Plan** → Payment → **Pay**
4. Test: **Netbanking → Success**, or card **`5267 3181 8797 5449`**, or UPI **`success@razorpay`**

Coupons: test codes (`RESET-QA-7K4M`) = free access; `RESET-LAUNCH-1` = Pay ₹1 (after `dev_reset_launch_coupon.sql`).

Full guide: [`.agents/memory/razorpay-web-checkout.md`](.agents/memory/razorpay-web-checkout.md)

## Production build

From repo root or `mobile/`:

```bash
# from root (delegates to mobile/)
npm run build

# or from mobile/
cd mobile && npm install --legacy-peer-deps && npm run build
```

Output: `mobile/dist/`. Preview locally with `npm run preview` (from root or `mobile/`).

## Production deploy (Vercel)

| Vercel setting | Value |
|----------------|--------|
| Root Directory | `mobile` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install --legacy-peer-deps` |

**Environment variables (Production):** same three `EXPO_PUBLIC_*` vars as `mobile/.env`. Redeploy after changes.

**Supabase Auth:** set Site URL + Redirect URLs to your Vercel domain.

Details: [`.agents/memory/vercel-deployment.md`](.agents/memory/vercel-deployment.md)

## Documentation

| File | Contents |
|------|----------|
| [`architecture.md`](architecture.md) | File map, Reset Plan, payments, APIs |
| [`memory/PRD.md`](memory/PRD.md) | Product requirements |
| [`memory/test_credentials.md`](memory/test_credentials.md) | Env vars, test flows, Razorpay test cards |
| [`.agents/memory/razorpay-web-checkout.md`](.agents/memory/razorpay-web-checkout.md) | Payment flow, secrets, debugging |
| [`.agents/memory/vercel-deployment.md`](.agents/memory/vercel-deployment.md) | Hosting checklist |
| [`.agents/memory/supabase-migrations.md`](.agents/memory/supabase-migrations.md) | Migration index v1–v6_5 |

## Key features

- Five **pillars**, goals, daily **mini-tasks**, **Better You Tips**, **Revive** (`/hpa-axis`)
- **Reset Plan** — Success Identity assessment + Elevate (₹150/mo, ₹1500/yr on web via Razorpay)
- **Bless Points** (+5 task, +15 gratitude) and **Veda Streak**
- NLP **journal** (2/day) and **gratitude** ritual
- **Elevate plans** from Plan assessment; **Life Coach** placeholder
