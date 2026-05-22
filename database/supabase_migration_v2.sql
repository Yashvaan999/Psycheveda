-- =====================================================================
-- Psycheveda — Supabase Migration v2
-- =====================================================================
-- Run this AFTER supabase_migration.sql
-- Adds: gratitude_entries table, initial_frame column on journal_entries
-- =====================================================================

-- ---------------------------------------------------------------------
-- gratitude_entries — daily three-blessing ritual
-- ---------------------------------------------------------------------
create table if not exists public.gratitude_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  point_1 text not null check (char_length(point_1) between 1 and 240),
  point_2 text not null check (char_length(point_2) between 1 and 240),
  point_3 text not null check (char_length(point_3) between 1 and 240),
  entry_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists idx_gratitude_user_date
  on public.gratitude_entries(user_id, entry_date);

alter table public.gratitude_entries enable row level security;

drop policy if exists "gratitude_entries_owner" on public.gratitude_entries;
create policy "gratitude_entries_owner" on public.gratitude_entries
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- Add initial_frame column to journal_entries (used by the NLP screen)
-- ---------------------------------------------------------------------
alter table public.journal_entries
  add column if not exists initial_frame text;
