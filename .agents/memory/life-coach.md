---
name: Life Coach (coming soon)
description: Placeholder screen for future human coaching feature.
---

# Consult a Life Coach

## Status

**Coming soon** — UI placeholder only. No API, booking, payments, or coach directory.

## Routes & entry

| Item | Value |
|------|--------|
| Screen | `mobile/app/life-coach.js` |
| Route | `/life-coach` |
| Entry | Assessment **results** in `gut-brain-plan.js` → **Consult a Life Coach** button (below **Elevate Yourself**) |

## UX

- Saffron/sage gradient card on linen background
- **Coming soon** eyebrow, title, short description, feature pills
- **Return to my results** + back arrow → `router.back()` to assessment results

## Future implementation (not started)

- Coach matching by Success Identity tier
- Session booking / video or chat
- May integrate with subscription paywall (see `subscription-paywall.md`)

Do not wire fake API endpoints until product spec exists.
