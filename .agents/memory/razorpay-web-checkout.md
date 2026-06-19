---
name: Razorpay Standard Web Checkout (Reset Plan)
description: Web payment flow, Supabase Edge Functions, env vars, test cards, and debugging.
---

# Razorpay Standard Web Checkout — Reset Plan

Web payments use **Razorpay Standard Checkout** (one-time orders), not subscriptions.

## Flow

```
Pay button (web)
  → supabase.functions.invoke('create-order')
  → Razorpay POST /v1/orders (Supabase secrets)
  → checkout.js modal (order_id + key_id from server)
  → verify-payment (HMAC-SHA256 signature)
  → admin_sync_reset_razorpay_subscription → Plan access
```

Mobile IAP (RevenueCat) is a separate path for iOS/Android only.

## Edge Functions (active)

| Function | JWT | Role |
|----------|-----|------|
| `create-order` | yes | Create Razorpay order; validate paid coupons |
| `verify-payment` | yes | Verify signature; grant entitlement |
| `create-reset-checkout` | yes | Legacy subscription checkout (unused on web) |
| `confirm-reset-razorpay` | yes | Legacy subscription confirm |
| `razorpay-webhook` | no | Subscription webhooks (legacy) |

Deploy:

```bash
SUPABASE_ACCESS_TOKEN=sbp_xxx npx supabase functions deploy create-order verify-payment --project-ref tqdpjzekotwxnueemacu
```

## Secrets (Supabase only — never frontend)

```bash
SUPABASE_ACCESS_TOKEN=sbp_xxx npx supabase secrets set --project-ref tqdpjzekotwxnueemacu \
  RAZORPAY_KEY_ID=rzp_test_xxx \
  RAZORPAY_KEY_SECRET=xxx
```

`RAZORPAY_KEY_ID` must match `EXPO_PUBLIC_RAZORPAY_KEY_ID` in `mobile/.env` / Vercel.

## Frontend env

`mobile/.env` (local) and Vercel (production):

```env
EXPO_PUBLIC_SUPABASE_URL=https://tqdpjzekotwxnueemacu.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxx
```

**Never** put `RAZORPAY_KEY_SECRET` in `.env` or Vercel.

## Migrations (run after v1–v5)

| File | Purpose |
|------|---------|
| `v6.sql` | `reset_subscriptions`, coupons, entitlement RPCs |
| `v6_1.sql` | Test helper: expire subscription |
| `v6_2.sql` | RevenueCat sync RPC |
| `v6_3.sql` | Razorpay provider + admin sync RPC |
| `v6_4.sql` | Paid checkout coupons (`checkout_price_inr`) |
| `v6_5.sql` | Coupons without `razorpay_offer_id` (order amount discount) |

## Coupons

| Type | Behavior |
|------|----------|
| Test codes (`RESET-QA-*`) | 100% off → free month via `redeem_reset_coupon` |
| Paid promo (`RESET-LAUNCH-1`) | `checkout_price_inr: 1` → Pay ₹1 via Standard Checkout |

Seed: `database/dev_reset_launch_coupon.sql`

## Test mode (Razorpay dashboard → Test mode ON)

| Method | Details |
|--------|---------|
| Netbanking | Any bank → mock **Success** page |
| UPI | `success@razorpay` |
| Domestic card | `5267 3181 8797 5449` (Mastercard) |
| Domestic Visa | `4111 1111 1111 1111` (may flag as international on some accounts) |

**International cards not supported** on default India test accounts.

## Common errors

| Error | Fix |
|-------|-----|
| `Authentication failed` | Regenerate test Key ID + Secret; set Supabase secrets; redeploy functions |
| `401` on create-order | JWT/session: Vercel anon key, Auth URLs, re-login; or was Razorpay auth (now 500) |
| `Invalid JWT` | Wrong `EXPO_PUBLIC_SUPABASE_ANON_KEY` on Vercel; redeploy |
| International cards | Use domestic test card or Netbanking |
| Key ID mismatch | `key_id` from create-order used in checkout modal (fixed in `razorpayWeb.js`) |

## Key files

- `mobile/app/reset-payment.js` — Pay flow
- `mobile/src/lib/razorpayWeb.js` — Standard Checkout modal
- `mobile/src/lib/api.js` — `createRazorpayOrder`, `verifyRazorpayPayment`, `invokeEdgeFunction`
- `supabase/functions/create-order/index.ts`
- `supabase/functions/verify-payment/index.ts`
- `supabase/functions/_shared/razorpay.ts`

## Live mode (after KYC)

1. Razorpay Live → generate `rzp_live_` keys
2. Update Supabase secrets + Vercel `EXPO_PUBLIC_RAZORPAY_KEY_ID`
3. Redeploy Edge Functions + Vercel
4. Test on hosted URL with real card
