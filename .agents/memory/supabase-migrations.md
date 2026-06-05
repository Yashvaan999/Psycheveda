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
| `database/supabase_migration_v5.sql` | Profile matrix (age, wake_time, …), **`goals.source`** (`manual` \| `elevate`), Elevate **`mini_tasks`** metadata |

**Rule:** New DDL → append `database/supabase_migration_v<N>.sql`. User runs in Supabase SQL editor; anon key cannot run DDL.

## Progress-related tables

| Table | Used by |
|-------|---------|
| `mini_tasks` | All goals; **Elevate** completion % and history |
| `goal_progress_logs` | **Manual goals only** (Elevate API returns empty / rejects writes) |
| `goals.source` | Distinguishes tracking mode |
| `bless_transactions` / `profiles` | Bless balance + streak |

## App resilience

Optional tables wrapped in **try/catch** in `api.js` so the UI survives missing migrations.

## After migrating

Update `architecture.md` and `memory/PRD.md` if behavior changes. Elevate goals need **v5** `source` column or they fall back to manual progress-log behavior.
