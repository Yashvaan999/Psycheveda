-- =====================================================================
-- Psycheveda — Supabase / PostgreSQL Migration
-- =====================================================================
-- Paste this entire file into the Supabase SQL editor (or run via psql).
-- The schema mirrors the MongoDB document model used by the FastAPI MVP
-- (server.py) but is normalized for Postgres + Supabase Auth.
--
-- Tables:
--   • profiles            (1:1 with auth.users)
--   • goals               (time-tracked, days|hours estimate)
--   • mini_tasks          (auto-generated daily checklist items)
--   • journal_entries     (5-step NLP pipeline + optional bless gratitude)
--   • bless_transactions  (append-only ledger powering balance + streak)
--
-- Row-Level Security (RLS) is enabled with strict "owner only" policies.
-- =====================================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------
-- ENUMs
-- ---------------------------------------------------------------------
do $$ begin
  create type pillar_key as enum (
    'family_relationship',
    'career_business',
    'finance_money',
    'health',
    'inner_wellness'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type estimate_unit as enum ('days', 'hours');
exception when duplicate_object then null; end $$;

do $$ begin
  create type nlp_frame as enum (
    'Cause & Effect',
    'Result & Excuse',
    'Mind & Body as One System',
    'Perception is Projection',
    'Responsibility'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type journal_period as enum ('morning', 'evening');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- profiles — links 1:1 to Supabase auth.users
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text not null,
  bless_points_balance integer not null default 0,
  veda_streak integer not null default 0,
  last_activity_date date,
  selected_pillars pillar_key[] not null default '{}',
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- goals
-- ---------------------------------------------------------------------
create table if not exists public.goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  pillar pillar_key not null,
  title text not null check (char_length(title) between 2 and 240),
  estimate_unit estimate_unit not null,
  estimate_value integer not null check (estimate_value between 1 and 365),
  deadline_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_goals_user on public.goals(user_id);
create index if not exists idx_goals_pillar on public.goals(pillar);

-- ---------------------------------------------------------------------
-- mini_tasks — auto-generated daily breakdown of a goal
-- ---------------------------------------------------------------------
create table if not exists public.mini_tasks (
  id uuid primary key default uuid_generate_v4(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  title text not null,
  scheduled_for date not null,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_mini_tasks_goal on public.mini_tasks(goal_id);
create index if not exists idx_mini_tasks_date on public.mini_tasks(scheduled_for);

-- ---------------------------------------------------------------------
-- journal_entries — 5-step NLP reframing pipeline
-- entry_date is enforced unique-with-2-cap via the index + trigger below
-- ---------------------------------------------------------------------
create table if not exists public.journal_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  situation text not null check (char_length(situation) between 2 and 2000),
  natural_emotion text not null,
  nlp_frame nlp_frame not null,
  ease_of_transition integer not null check (ease_of_transition between 1 and 10),
  end_feeling text not null,
  period journal_period not null,
  bless_gratitude text,
  entry_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists idx_journal_user_date on public.journal_entries(user_id, entry_date);

-- Hard cap: max 2 journal entries per user per day
create or replace function public.enforce_journal_daily_limit()
returns trigger as $$
declare
  cnt integer;
begin
  select count(*) into cnt
  from public.journal_entries
  where user_id = NEW.user_id and entry_date = NEW.entry_date;
  if cnt >= 2 then
    raise exception 'Daily journal limit reached (max 2 entries per day)';
  end if;
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists trg_journal_daily_limit on public.journal_entries;
create trigger trg_journal_daily_limit
  before insert on public.journal_entries
  for each row execute function public.enforce_journal_daily_limit();

-- ---------------------------------------------------------------------
-- bless_transactions — append-only ledger driving balance + streak
-- ---------------------------------------------------------------------
create table if not exists public.bless_transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  delta integer not null,
  reason text not null,
  ref_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_bless_user on public.bless_transactions(user_id);

-- ---------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.goals enable row level security;
alter table public.mini_tasks enable row level security;
alter table public.journal_entries enable row level security;
alter table public.bless_transactions enable row level security;

drop policy if exists "profiles_self" on public.profiles;
create policy "profiles_self" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "goals_owner" on public.goals;
create policy "goals_owner" on public.goals
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "mini_tasks_owner" on public.mini_tasks;
create policy "mini_tasks_owner" on public.mini_tasks
  for all using (
    exists (
      select 1 from public.goals g
      where g.id = mini_tasks.goal_id and g.user_id = auth.uid()
    )
  );

drop policy if exists "journal_owner" on public.journal_entries;
create policy "journal_owner" on public.journal_entries
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "bless_owner" on public.bless_transactions;
create policy "bless_owner" on public.bless_transactions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- Auto-create profile row on signup
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
