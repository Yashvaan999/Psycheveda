---
name: Supabase migrations workflow
description: How schema changes are applied for this app's external Supabase database.
---

# Supabase schema changes

This Expo app talks to an **external Supabase** project (env: EXPO_PUBLIC_SUPABASE_URL / ANON_KEY,
mirrored from VITE_SUPABASE_* secrets). It is NOT the Replit built-in Postgres.

**Rule:** Schema/DDL changes go into `database/supabase_migration_v<N>.sql` (versioned, append-only).
The **user** pastes/runs them in the Supabase SQL editor — the app's anon key cannot run DDL.

**How to apply:** After writing a new migration file, tell the user to run it in Supabase.
App code that touches a new table should tolerate the table not existing yet (try/catch, warn)
so the UI doesn't crash before the user runs the migration. This mirrors existing patterns
(e.g. bless_transactions / goal_progress_logs writes are wrapped in try/catch).
