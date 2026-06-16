-- =====================================================================
-- Psycheveda — Migration v6.4
-- Paid checkout coupons (e.g. pay ₹1 via Razorpay offer on first month)
-- Run after v6.3
-- =====================================================================

alter table public.reset_promo_coupons
  drop constraint if exists reset_promo_coupons_discount_percent_check;

alter table public.reset_promo_coupons
  add column if not exists checkout_price_inr integer,
  add column if not exists razorpay_offer_id text;

alter table public.reset_promo_coupons
  add constraint reset_promo_coupons_discount_mode_check check (
    (
      discount_percent = 100
      and checkout_price_inr is null
      and razorpay_offer_id is null
    )
    or (
      checkout_price_inr is not null
      and checkout_price_inr >= 1
      and razorpay_offer_id is not null
    )
  );

-- Validate a paid-checkout coupon (does not grant access yet).
create or replace function public.validate_reset_checkout_coupon(
  p_code text,
  p_plan text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_norm text;
  v_coupon public.reset_promo_coupons%rowtype;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  if p_plan not in ('monthly', 'yearly') then
    raise exception 'Invalid plan';
  end if;

  v_norm := upper(trim(p_code));

  select * into v_coupon
  from public.reset_promo_coupons
  where upper(trim(code)) = v_norm
    and active = true
    and (expires_at is null or expires_at > now());

  if not found then
    return jsonb_build_object('valid', false, 'error', 'Invalid or expired coupon');
  end if;

  if v_coupon.checkout_price_inr is null then
    return jsonb_build_object(
      'valid', false,
      'error', 'This code is for free access. Use Apply coupon instead of Pay.',
      'free_grant', true
    );
  end if;

  if v_coupon.plan <> p_plan then
    return jsonb_build_object(
      'valid', false,
      'error', format('This coupon applies to the %s plan only.', v_coupon.plan)
    );
  end if;

  return jsonb_build_object(
    'valid', true,
    'code', v_coupon.code,
    'plan', v_coupon.plan,
    'checkout_price_inr', v_coupon.checkout_price_inr,
    'razorpay_offer_id', v_coupon.razorpay_offer_id
  );
end;
$$;

-- Record redemption after Razorpay payment succeeds (idempotent per user+coupon).
create or replace function public.record_reset_checkout_coupon_redemption(p_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_norm text;
  v_coupon public.reset_promo_coupons%rowtype;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  v_norm := upper(trim(p_code));

  select * into v_coupon
  from public.reset_promo_coupons
  where upper(trim(code)) = v_norm;

  if not found then
    return;
  end if;

  if not exists (
    select 1 from public.reset_promo_redemptions
    where user_id = v_user and coupon_code = v_coupon.code
  ) then
    insert into public.reset_promo_redemptions (user_id, coupon_code)
    values (v_user, v_coupon.code);

    update public.reset_promo_coupons
    set redemption_count = redemption_count + 1
    where code = v_coupon.code;
  end if;
end;
$$;

grant execute on function public.validate_reset_checkout_coupon(text, text) to authenticated;
grant execute on function public.record_reset_checkout_coupon_redemption(text) to authenticated;

-- Example production coupon — replace offer_id after creating Live offer in Razorpay.
-- Offer: Flat ₹149 off, Single use (first cycle), linked to monthly ₹150 plan → customer pays ₹1.
-- insert into public.reset_promo_coupons (
--   code, plan, discount_percent, checkout_price_inr, razorpay_offer_id
-- ) values (
--   'RESET-LAUNCH-1', 'monthly', 0, 1, 'offer_xxxxxxxx'
-- ) on conflict (code) do update set
--   checkout_price_inr = excluded.checkout_price_inr,
--   razorpay_offer_id = excluded.razorpay_offer_id,
--   active = true;
