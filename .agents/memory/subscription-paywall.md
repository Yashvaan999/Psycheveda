---
name: Subscription paywall (deferred)
description: Main app subscription plan — paused. Reset Plan (Revive) is shipped separately.
---

# Main app subscription — DEFERRED

User confirmed this plan, then paused it ("implement later"). Build only when user asks.

## Shipped separately: Reset Plan (Revive → Plan)

**Reset Plan is live** — not part of this deferred scope:

| Item | Detail |
|------|--------|
| Product | Success Identity assessment + Elevate habits |
| Price | ₹150/month, ₹1500/year |
| Web payments | Razorpay Standard Checkout (`create-order`, `verify-payment`) |
| Mobile payments | RevenueCat IAP (optional) |
| Coupons | `RESET-QA-*` (free), `RESET-LAUNCH-1` (₹1) |
| Docs | `.agents/memory/razorpay-web-checkout.md` |

## Confirmed decisions (main app — not built)
- **Trial**: 7 calendar days since signup (derive from `profiles.created_at`). Full access during trial.
- **After trial**: lock **Journal** and **Gratitude** until app-subscribed. **Goal tracking stays free forever.** Dashboard goal features free.
- **App plan pricing**: ₹96/year or ₹122/month. (Note: ₹96/yr < one ₹122 month — user confirmed as-is.)
- **Gut-Brain**: separate premium add-on, ₹195/month, always gated regardless of app sub.
- **Bless coupons**: 1000 bless points → ₹5 coupon. Mint in 1000 increments. One coupon per checkout (no stacking, no expiry, no partial-1000). Discount capped at plan price.
- **Payments**: placeholder/simulated checkout now (dev-preview-only on Replit web). Wire **RevenueCat** when published to app stores.

## Planned shape (not built)
- New migration: `subscriptions` + `coupons` tables, owner-only RLS. Coupon mint writes negative `bless_transactions` row + decrements cached balance (ledger is source of truth).
- Entitlements computed on read, surfaced through auth context (`trialActive`, `trialEndsAt`, `appSubscribed`, `gutBrainSubscribed`).
- `/subscribe` screen + per-feature gating; Gut-Brain lock state; bless wallet UX.
