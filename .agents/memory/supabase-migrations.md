---
name: Supabase migrations workflow
description: How schema changes are applied for this app's external Supabase database.
---

# Supabase schema changes

The Expo app in `mobile/` uses an **external Supabase** project (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `mobile/.env`). It is **not** the Replit built-in Postgres.

## Migration files (run in order)

| File | Adds |
|------|------|
| `database/supabase_migration.sql` | Core: profiles, goals, mini_tasks, journal_entries, bless_transactions, RLS, journal 2/day trigger |
| `database/supabase_migration_v2.sql` | `gratitude_entries` |
| `database/supabase_migration_v3.sql` | `goal_progress_logs`, `goals.notes` |
| `database/supabase_migration_v4.sql` | `gut_brain_assessments` |
| `database/supabase_migration_v5.sql` | Profile matrix, **`goals.source`** (`manual` \| `elevate`), Elevate **`mini_tasks`** metadata |
| `database/supabase_migration_v6.sql` | **Reset Plan:** `reset_subscriptions`, `reset_promo_coupons`, `get_reset_entitlement`, `redeem_reset_coupon`; seeds 10 test coupons |
| `database/supabase_migration_v6_1.sql` | `expire_reset_subscription_for_testing()` |
| `database/supabase_migration_v6_2.sql` | `sync_reset_revenuecat_subscription()` (mobile IAP) |
| `database/supabase_migration_v6_3.sql` | `razorpay` provider + `admin_sync_reset_razorpay_subscription()` |
| `database/supabase_migration_v6_4.sql` | Paid checkout coupons (`checkout_price_inr`, `validate_reset_checkout_coupon`) |
| `database/supabase_migration_v6_5.sql` | Coupons without Razorpay `offer_id` (Standard Checkout uses order amount) |

**Helper SQL (optional):**

| File | Purpose |
|------|---------|
| `database/dev_reset_reset_access.sql` | Expire Reset access for QA |
| `database/dev_reset_launch_coupon.sql` | Insert `RESET-LAUNCH-1` (Pay ₹1) |

**Rule:** New DDL → append `database/supabase_migration_v<N>.sql`. User runs in Supabase SQL editor; anon key cannot run DDL.

## Reset Plan tables

| Table | Used by |
|-------|---------|
| `reset_subscriptions` | Active Plan entitlement (`coupon`, `revenuecat`, `razorpay`) |
| `reset_promo_coupons` | Multi-use promo codes |
| `reset_promo_redemptions` | Audit log |

## Progress-related tables (v1–v5)

| Table | Used by |
|-------|---------|
| `mini_tasks` | All goals; **Elevate** completion % and history |
| `goal_progress_logs` | **Manual goals only** |
| `goals.source` | Distinguishes tracking mode |
| `bless_transactions` / `profiles` | Bless balance + streak |

## App resilience

Optional tables wrapped in **try/catch** in `api.js` so the UI survives missing migrations.

## After migrating

Update `architecture.md`, `README.md`, and `memory/test_credentials.md` if behavior changes. Reset Plan requires **v6+**; paid coupons require **v6_4** and **v6_5**.
