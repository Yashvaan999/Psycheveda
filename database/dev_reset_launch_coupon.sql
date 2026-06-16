-- Insert a ₹1 promo coupon for Standard Checkout (order amount = 100 paise).
-- Run after supabase_migration_v6_5.sql

insert into public.reset_promo_coupons (
  code,
  plan,
  discount_percent,
  checkout_price_inr,
  active
) values (
  'RESET-LAUNCH-1',
  'monthly',
  0,
  1,
  true
)
on conflict (code) do update set
  checkout_price_inr = excluded.checkout_price_inr,
  active = true;
