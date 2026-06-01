---
name: Subscription paywall (deferred)
description: Confirmed plan for subscriptions/premium Gut-Brain/bless coupons — paused by user, to build later.
---

# Subscription, Premium Gut-Brain & Bless Coupons — DEFERRED

User confirmed this plan, then paused it ("implement later"). Full plan draft was in
`.local/tasks/subscription-paywall-plan.md`. Build only when user asks.

## Confirmed decisions
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
