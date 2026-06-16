-- =====================================================================
-- Psycheveda — Migration v6
-- Reset Plan subscription + reusable monthly test coupons (100% off)
-- Run in Supabase SQL editor after v1–v5 migrations
-- =====================================================================

-- ---------------------------------------------------------------------
-- reset_promo_coupons — multi-use codes (same code, many users)
-- ---------------------------------------------------------------------
create table if not exists public.reset_promo_coupons (
  code text primary key,
  plan text not null default 'monthly' check (plan = 'monthly'),
  discount_percent integer not null default 100 check (discount_percent = 100),
  active boolean not null default true,
  expires_at timestamptz,
  redemption_count integer not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- reset_subscriptions — one active row per user at a time (upserted)
-- ---------------------------------------------------------------------
create table if not exists public.reset_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan text not null check (plan in ('monthly', 'yearly')),
  status text not null default 'active' check (status in ('active', 'expired', 'cancelled')),
  provider text not null check (provider in ('coupon', 'revenuecat')),
  provider_ref text,
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_reset_subs_user on public.reset_subscriptions(user_id);
create index if not exists idx_reset_subs_active on public.reset_subscriptions(user_id, status, current_period_end desc);

-- ---------------------------------------------------------------------
-- reset_promo_redemptions — audit log (many users per coupon)
-- ---------------------------------------------------------------------
create table if not exists public.reset_promo_redemptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  coupon_code text not null references public.reset_promo_coupons(code),
  redeemed_at timestamptz not null default now()
);

create index if not exists idx_reset_redemptions_user on public.reset_promo_redemptions(user_id);

-- ---------------------------------------------------------------------
-- Seed 10 reusable monthly test coupons (100% off)
-- ---------------------------------------------------------------------
insert into public.reset_promo_coupons (code) values
  ('RESET-QA-7K4M'),
  ('RESET-QA-9P2X'),
  ('RESET-QA-3N8R'),
  ('RESET-QA-5T6V'),
  ('RESET-QA-2H9W'),
  ('RESET-BETA-6M1P'),
  ('RESET-BETA-1C5Z'),
  ('RESET-BETA-9L2D'),
  ('RESET-BETA-8F3K'),
  ('RESET-BETA-4J7Q')
on conflict (code) do nothing;

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.reset_promo_coupons enable row level security;
alter table public.reset_subscriptions enable row level security;
alter table public.reset_promo_redemptions enable row level security;

-- Coupons: no direct client access (redeem via RPC only)
drop policy if exists "reset_coupons_deny" on public.reset_promo_coupons;
create policy "reset_coupons_deny" on public.reset_promo_coupons
  for all using (false);

drop policy if exists "reset_subs_select_own" on public.reset_subscriptions;
create policy "reset_subs_select_own" on public.reset_subscriptions
  for select using (user_id = auth.uid());

drop policy if exists "reset_redemptions_select_own" on public.reset_promo_redemptions;
create policy "reset_redemptions_select_own" on public.reset_promo_redemptions
  for select using (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- Entitlement check (read-only for clients)
-- ---------------------------------------------------------------------
create or replace function public.get_reset_entitlement()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_sub public.reset_subscriptions%rowtype;
begin
  if v_user is null then
    return jsonb_build_object('entitled', false);
  end if;

  update public.reset_subscriptions
  set status = 'expired', updated_at = now()
  where user_id = v_user and status = 'active' and current_period_end <= now();

  select * into v_sub
  from public.reset_subscriptions
  where user_id = v_user
    and status = 'active'
    and current_period_end > now()
  order by current_period_end desc
  limit 1;

  if not found then
    select current_period_end into v_sub.current_period_end
    from public.reset_subscriptions
    where user_id = v_user
    order by current_period_end desc
    limit 1;

    return jsonb_build_object(
      'entitled', false,
      'current_period_end', v_sub.current_period_end
    );
  end if;

  return jsonb_build_object(
    'entitled', true,
    'plan', v_sub.plan,
    'provider', v_sub.provider,
    'current_period_end', v_sub.current_period_end,
    'days_remaining', greatest(0, ceil(extract(epoch from (v_sub.current_period_end - now())) / 86400)::integer)
  );
end;
$$;

-- ---------------------------------------------------------------------
-- Redeem coupon — monthly only, 100% off, multi-use per code
-- ---------------------------------------------------------------------
create or replace function public.redeem_reset_coupon(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_coupon public.reset_promo_coupons%rowtype;
  v_existing public.reset_subscriptions%rowtype;
  v_end timestamptz;
  v_norm text;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  v_norm := upper(trim(p_code));

  select * into v_coupon
  from public.reset_promo_coupons
  where upper(trim(code)) = v_norm
    and active = true
    and (expires_at is null or expires_at > now());

  if not found then
    raise exception 'Invalid or expired coupon';
  end if;

  select * into v_existing
  from public.reset_subscriptions
  where user_id = v_user
    and status = 'active'
    and current_period_end > now()
  order by current_period_end desc
  limit 1;

  if v_existing.id is not null then
    v_end := v_existing.current_period_end + interval '30 days';
    update public.reset_subscriptions
    set
      current_period_end = v_end,
      updated_at = now(),
      provider = 'coupon',
      provider_ref = v_norm,
      plan = 'monthly'
    where id = v_existing.id;
  else
    update public.reset_subscriptions
    set status = 'expired', updated_at = now()
    where user_id = v_user and status = 'active';

    v_end := now() + interval '30 days';
    insert into public.reset_subscriptions (
      user_id, plan, status, provider, provider_ref,
      current_period_start, current_period_end
    ) values (
      v_user, 'monthly', 'active', 'coupon', v_norm,
      now(), v_end
    );
  end if;

  insert into public.reset_promo_redemptions (user_id, coupon_code)
  values (v_user, v_coupon.code);

  update public.reset_promo_coupons
  set redemption_count = redemption_count + 1
  where code = v_coupon.code;

  return jsonb_build_object(
    'entitled', true,
    'plan', 'monthly',
    'provider', 'coupon',
    'current_period_end', v_end,
    'days_remaining', greatest(0, ceil(extract(epoch from (v_end - now())) / 86400)::integer)
  );
end;
$$;

grant execute on function public.get_reset_entitlement() to authenticated;
grant execute on function public.redeem_reset_coupon(text) to authenticated;
