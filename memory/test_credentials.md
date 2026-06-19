# Psycheveda — Test Credentials & Environment

_Last updated: 2026-06-16_

## Mobile app (primary — Supabase)

### Environment

File: **`mobile/.env`** (gitignored)

```env
EXPO_PUBLIC_SUPABASE_URL=https://tqdpjzekotwxnueemacu.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
EXPO_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
```

Supabase Dashboard → **Project Settings** → **API** → Project URL + **anon public** key.

**Razorpay Key Secret** goes in **Supabase Edge Function secrets only** — never in `.env`.

### Vercel (production)

Same three `EXPO_PUBLIC_*` variables in **Vercel → Settings → Environment Variables → Production**. Redeploy after changes.

See `.agents/memory/vercel-deployment.md`.

### Run locally

```bash
cd mobile
npm install --legacy-peer-deps
npm run web
```

Open **http://localhost:5001** (not 5000 — often blocked by macOS AirPlay).

Restart:

```bash
lsof -ti:5001 | xargs kill -9 2>/dev/null
npm run web
```

## Legacy web MVP (FastAPI + Mongo)

| File | Variables |
|------|-----------|
| `backend/.env` | `MONGO_URL`, `DB_NAME`, `JWT_SECRET` |
| `frontend/.env` | `REACT_APP_BACKEND_URL=http://localhost:8001` |

API prefix: `/api`

## Test accounts

### Supabase / mobile

- Register a new user on the auth screen for full flows.
- Suggested: `tester+<timestamp>@psyche.app` / `Test1234`

### Legacy Mongo (optional)

- `seeker@psyche.app` / `Test1234`
- May already have 2 journal entries today (quota UI).

## Test flows

### Better You Tips

1. Sign in and open **Dashboard**.
2. **Better You Tips** card appears at the top (preview + Sunrise icon).
3. Modal auto-opens on first visit if not absorbed; tap **Absorb Strategy** to dismiss.
4. Tap the card again to reopen; pillar + content only (no title field in JSON).

### Revive + Plan assessment

1. Bottom nav → **Revive** (`/hpa-axis`).
2. Switch phase chips; verify hero copy updates.
3. Tap **Plan** → complete or resume 30-question assessment.
4. On results: tap info icon beside tier → stage carousel (Survivor → Superhero).
5. **Elevate Yourself** → demographics form → generates plan.
6. **Consult a Life Coach** → opens `/life-coach` coming-soon screen → **Return to my results**.

### Consult a Life Coach (placeholder)

1. Complete Plan assessment to reach **results**.
2. Tap **Consult a Life Coach** (below **Elevate Yourself**).
3. Verify coming-soon copy, feature pills, and back navigation.

### Elevate (mini-tasks, no progress logs)

1. Apply migrations **v1–v5** in Supabase.
2. Complete **Revive Plan** → **Elevate Yourself** → creates `source = 'elevate'` goal + `mini_tasks` (6–7 habits/day × plan duration).
3. On **Dashboard**, check off today's Elevate mini-tasks (instant checkbox feedback).
4. Open goal detail or **Track** → completion % and **sub-task history** (no Progress logs section).
5. Navigate away and back to Dashboard — content should refresh silently without long blank/spinner states.

### Manual goals (progress logs)

1. Create a goal via **onboarding** (non-Elevate).
2. On goal detail → **Log progress** with a note.
3. **Track** modal and reminders use progress-log days for completion %.

### Verify Elevate excludes progress logs

- `logProgress` on an Elevate goal should error in API.
- Goal detail for Elevate shows mini-task guidance, not the log form.
- Bell reminders list **manual** goals only.

### Reset Plan + Razorpay (web)

**Prerequisites:** migrations v6–v6_5; Supabase secrets `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET`; deploy `create-order` + `verify-payment`.

1. Sign in → **Revive** → **Plan** → paywall → **Continue to payment**.
2. **Pay ₹150** (or apply coupon first).
3. Razorpay test methods:
   - **Netbanking** → any bank → **Success**
   - **UPI:** `success@razorpay`
   - **Domestic card:** `5267 3181 8797 5449` (Mastercard)
   - **Visa:** `4111 1111 1111 1111` (may fail with "international cards" on some accounts)
4. After success → redirected to `/gut-brain-plan`.

**Free test coupon:** `RESET-QA-7K4M` (apply on payment page → instant access).

**₹1 promo:** run `database/dev_reset_launch_coupon.sql` → code `RESET-LAUNCH-1` → Apply → Pay ₹1.

**Reset test access:** `/reset-subscribe?reset=1` expires active subscription (dev).

### Razorpay debugging

| Symptom | Check |
|---------|--------|
| Authentication failed | Supabase secrets Key ID + Secret match; redeploy functions |
| 401 on create-order | Vercel anon key; Supabase Auth URLs; re-login |
| International cards | Use Netbanking or `5267...` domestic card |
| Pay works locally, fails on Vercel | Vercel env vars + redeploy |

Logs: Supabase → Edge Functions → `create-order` / `verify-payment`.
