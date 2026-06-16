-- =====================================================================
-- Psycheveda — Migration v6.1
-- Dev helper: expire active Reset subscription for current user (testing)
-- Run after v6
-- =====================================================================

create or replace function public.expire_reset_subscription_for_testing()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_count integer;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  update public.reset_subscriptions
  set status = 'expired', updated_at = now()
  where user_id = v_user and status = 'active';

  get diagnostics v_count = row_count;

  return jsonb_build_object('expired', v_count > 0, 'count', v_count);
end;
$$;

grant execute on function public.expire_reset_subscription_for_testing() to authenticated;
