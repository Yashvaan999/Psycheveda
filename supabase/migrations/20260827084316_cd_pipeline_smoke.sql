-- Dummy CD smoke migration — does not affect Psycheveda app behavior.
-- App code never reads or writes this table.

create table if not exists public.cd_pipeline_smoke (
  id bigint generated always as identity primary key,
  note text not null default 'ok',
  applied_at timestamptz not null default now()
);

comment on table public.cd_pipeline_smoke is
  'Smoke-test table for GitHub Supabase CD. Unused by the application.';

alter table public.cd_pipeline_smoke enable row level security;

insert into public.cd_pipeline_smoke (note)
values ('cd-smoke-ok');
