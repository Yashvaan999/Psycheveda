-- =====================================================================
-- Psycheveda — Migration v6.5
-- Paid checkout coupons no longer require razorpay_offer_id (Standard Checkout uses order amount)
-- Run after v6.4
-- =====================================================================

alter table public.reset_promo_coupons
  drop constraint if exists reset_promo_coupons_discount_mode_check;

alter table public.reset_promo_coupons
  add constraint reset_promo_coupons_discount_mode_check check (
    (
      discount_percent = 100
      and checkout_price_inr is null
    )
    or (
      checkout_price_inr is not null
      and checkout_price_inr >= 1
    )
  );
