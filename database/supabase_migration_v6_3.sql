-- =====================================================================
-- Psycheveda — Migration v6.3
-- Razorpay web subscriptions (provider + service-role sync RPC)
-- Run after v6 / v6.1 / v6.2
-- =====================================================================

alter table public.reset_subscriptions
  drop constraint if exists reset_subscriptions_provider_check;

alter table public.reset_subscriptions
  add constraint reset_subscriptions_provider_check
  check (provider in ('coupon', 'revenuecat', 'razorpay'));

-- Called from Supabase Edge Functions (service role) after Razorpay checkout / webhooks.
create or replace function public.admin_sync_reset_razorpay_subscription(
  p_user_id uuid,
  p_plan text,
  p_period_end timestamptz,
  p_provider_ref text,
  p_status text default 'active'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_end timestamptz;
begin
  if p_user_id is null then
    raise exception 'Missing user id';
  end if;

  if p_status in ('cancelled', 'expired', 'halted') then
    update public.reset_subscriptions
    set status = 'expired', updated_at = now()
    where user_id = p_user_id
      and status = 'active'
      and provider = 'razorpay'
      and (p_provider_ref is null or provider_ref = p_provider_ref);

    return jsonb_build_object('entitled', false);
  end if;

  if p_plan not in ('monthly', 'yearly') then
    raise exception 'Invalid plan';
  end if;

  if p_period_end is null or p_period_end <= now() then
    raise exception 'Invalid subscription period';
  end if;

  update public.reset_subscriptions
  set status = 'expired', updated_at = now()
  where user_id = p_user_id and status = 'active';

  insert into public.reset_subscriptions (
    user_id, plan, status, provider, provider_ref,
    current_period_start, current_period_end
  ) values (
    p_user_id, p_plan, 'active', 'razorpay', coalesce(p_provider_ref, 'razorpay'),
    now(), p_period_end
  );

  v_end := p_period_end;

  return jsonb_build_object(
    'entitled', true,
    'plan', p_plan,
    'provider', 'razorpay',
    'current_period_end', v_end,
    'days_remaining', greatest(0, ceil(extract(epoch from (v_end - now())) / 86400)::integer)
  );
end;
$$;

revoke all on function public.admin_sync_reset_razorpay_subscription(uuid, text, timestamptz, text, text) from public;
grant execute on function public.admin_sync_reset_razorpay_subscription(uuid, text, timestamptz, text, text) to service_role;
