-- =====================================================================
-- Psycheveda — Migration v6.2
-- Sync Reset Plan subscription after RevenueCat purchase (client → Supabase)
-- Run after v6 / v6.1
-- =====================================================================

create or replace function public.sync_reset_revenuecat_subscription(
  p_plan text,
  p_period_end timestamptz,
  p_provider_ref text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  if p_plan not in ('monthly', 'yearly') then
    raise exception 'Invalid plan';
  end if;

  if p_period_end is null or p_period_end <= now() then
    raise exception 'Invalid subscription period';
  end if;

  update public.reset_subscriptions
  set status = 'expired', updated_at = now()
  where user_id = v_user and status = 'active';

  insert into public.reset_subscriptions (
    user_id, plan, status, provider, provider_ref,
    current_period_start, current_period_end
  ) values (
    v_user, p_plan, 'active', 'revenuecat', coalesce(p_provider_ref, 'revenuecat'),
    now(), p_period_end
  );

  return jsonb_build_object(
    'entitled', true,
    'plan', p_plan,
    'provider', 'revenuecat',
    'current_period_end', p_period_end,
    'days_remaining', greatest(0, ceil(extract(epoch from (p_period_end - now())) / 86400)::integer)
  );
end;
$$;

grant execute on function public.sync_reset_revenuecat_subscription(text, timestamptz, text) to authenticated;
