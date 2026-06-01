-- =====================================================================
-- Psycheveda — Migration v5
-- Adds:
--   • Demographic / lifestyle profile fields (used by the AI "Elevate
--     Yourself" plan generator on the Success Identity results screen)
--   • goals.source        — 'manual' (default) | 'elevate'
--   • mini_tasks.source / time_window / scheduled_time / justification
--     so AI-generated daily tasks can be highlighted with a special icon
-- Run in Supabase SQL editor after v1 + v2 + v3 + v4 migrations
-- =====================================================================

-- ---------------------------------------------------------------------
-- profiles — capture the AI "User Input Matrix"
-- ---------------------------------------------------------------------
alter table public.profiles add column if not exists age              integer;
alter table public.profiles add column if not exists gender           text;
alter table public.profiles add column if not exists occupation       text;
alter table public.profiles add column if not exists marital_status   text;
alter table public.profiles add column if not exists region           text;
alter table public.profiles add column if not exists food_preference  text;
alter table public.profiles add column if not exists wake_time        text;
alter table public.profiles add column if not exists sleep_time       text;

-- ---------------------------------------------------------------------
-- goals — distinguish AI-generated elevation plans from manual goals
-- ---------------------------------------------------------------------
alter table public.goals add column if not exists source text not null default 'manual';

-- ---------------------------------------------------------------------
-- mini_tasks — richer metadata for AI-generated daily tasks
-- ---------------------------------------------------------------------
alter table public.mini_tasks add column if not exists source         text not null default 'manual';
alter table public.mini_tasks add column if not exists time_window    text;   -- Morning | Afternoon | Evening
alter table public.mini_tasks add column if not exists scheduled_time text;   -- e.g. "~6:30 AM"
alter table public.mini_tasks add column if not exists justification  text;   -- psychological rationale
