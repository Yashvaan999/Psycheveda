# Agent memory index

- [Expo Router server SSR + Supabase](expo-ssr-supabase.md) — Supabase client shims if `web.output` is `"server"`.
- [mobile/ is a separate npm project](mobile-npm-project.md) — install in `mobile/`; local web on **port 5001**.
- [Elevate plan generation](elevate-plan-generation.md) — rules matrix v2 (`elevateRulesMatrix.json`); 6–7 daily tasks; no progress logs.
- [Better You Tips](better-you-tips.md) — daily psychological popup from `psychologicaltips.json`.
- [Life Coach (coming soon)](life-coach.md) — placeholder `/life-coach` from assessment results.
- [Supabase migrations](supabase-migrations.md) — v1–v5; `goals.source` required for Elevate behavior.
- [Subscription paywall (deferred)](subscription-paywall.md) — paused; goal tracking stays free when built.

**Root docs (keep in sync with code):**

| File | Purpose |
|------|---------|
| `architecture.md` | File map, manual vs Elevate tracking, completion % rules, local run |
| `memory/PRD.md` | Product scope and shipped features |
| `memory/test_credentials.md` | Env vars, ports, test flows |
| `README.md` | Quick start |

**Tracking rule of thumb:** Manual goals → progress logs. Elevate goals → Dashboard mini-tasks only.

**Branding:** User-facing **Revive** (nav + `/hpa-axis`); **Plan** assessment at `/gut-brain-plan`. Legacy DB/API names may still say `gut_brain`.

**Dashboard load:** Use `api.fetchDashboard()` — never nested `mini_tasks(*)` on list queries.

**Life Coach:** Placeholder only — `mobile/app/life-coach.js`, linked from assessment results. No backend yet.
