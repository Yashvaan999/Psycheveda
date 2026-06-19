# Agent memory index

- [Expo Router server SSR + Supabase](expo-ssr-supabase.md) — Supabase client shims if `web.output` is `"server"`.
- [mobile/ is a separate npm project](mobile-npm-project.md) — install in `mobile/`; local web on **port 5001**.
- [Elevate plan generation](elevate-plan-generation.md) — rules matrix v2; 6–7 daily tasks; no progress logs.
- [Better You Tips](better-you-tips.md) — daily psychological popup from `psychologicaltips.json`.
- [Life Coach (coming soon)](life-coach.md) — placeholder `/life-coach` from assessment results.
- [Supabase migrations](supabase-migrations.md) — v1–**v6_5**; Reset Plan + coupons.
- [**Razorpay web checkout**](razorpay-web-checkout.md) — Standard Checkout, Edge Functions, test cards, debugging.
- [**Vercel deployment**](vercel-deployment.md) — host Expo web, env vars, Auth URLs.
- [Subscription paywall (deferred)](subscription-paywall.md) — **main app** subscription paused; Reset Plan is separate and shipped.

**Root docs (keep in sync with code):**

| File | Purpose |
|------|---------|
| `architecture.md` | File map, Reset Plan, payments, Vercel, APIs |
| `memory/PRD.md` | Product scope and shipped features |
| `memory/test_credentials.md` | Env vars, Razorpay test flows, Vercel |
| `README.md` | Quick start, payments, deploy |

**Tracking rule of thumb:** Manual goals → progress logs. Elevate goals → Dashboard mini-tasks only.

**Branding:** User-facing **Revive** (nav + `/hpa-axis`); **Plan** at `/gut-brain-plan` (gated). Web favicon: `favicon-v2.png`.

**Payments:** Web = Razorpay Standard Checkout (`create-order` / `verify-payment`). Mobile = RevenueCat (optional).

**Dashboard load:** Use `api.fetchDashboard()` — never nested `mini_tasks(*)` on list queries.
