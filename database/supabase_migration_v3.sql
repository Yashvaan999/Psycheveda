-- =====================================================================
-- Psycheveda — Migration v3
-- Adds goal_progress_logs table and notes column to goals
-- Run in Supabase SQL editor after v1 + v2 migrations
-- =====================================================================

-- Add optional notes/description column to goals
alter table public.goals add column if not exists notes text;

-- ---------------------------------------------------------------------
-- goal_progress_logs — free-text progress journal per goal
-- ---------------------------------------------------------------------
create table if not exists public.goal_progress_logs (
  id         uuid primary key default uuid_generate_v4(),
  goal_id    uuid not null references public.goals(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  note       text not null check (char_length(note) between 1 and 2000),
  logged_at  timestamptz not null default now(),
  entry_date date not null default current_date
);

create index if not exists idx_progress_logs_goal on public.goal_progress_logs(goal_id);
create index if not exists idx_progress_logs_user on public.goal_progress_logs(user_id);

-- Row-Level Security
alter table public.goal_progress_logs enable row level security;

drop policy if exists "progress_logs_owner" on public.goal_progress_logs;
create policy "progress_logs_owner" on public.goal_progress_logs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
