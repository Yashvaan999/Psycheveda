-- =====================================================================
-- Psycheveda — Migration v4
-- Adds gut_brain_assessments table (Success Identity Test responses)
-- Run in Supabase SQL editor after v1 + v2 + v3 migrations
-- =====================================================================

-- ---------------------------------------------------------------------
-- gut_brain_assessments — one row per user (latest attempt).
-- answers is a JSON map of question_id -> selected option, e.g.
--   { "1": "Strongly Agree", "2": "Agree", ... }
-- The end-result scoring is computed later from these answers.
-- ---------------------------------------------------------------------
create table if not exists public.gut_brain_assessments (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null unique references public.profiles(id) on delete cascade,
  answers      jsonb not null default '{}'::jsonb,
  completed    boolean not null default false,
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_gut_brain_assessments_user
  on public.gut_brain_assessments(user_id);

-- Row-Level Security
alter table public.gut_brain_assessments enable row level security;

drop policy if exists "gut_brain_assessments_owner" on public.gut_brain_assessments;
create policy "gut_brain_assessments_owner" on public.gut_brain_assessments
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
