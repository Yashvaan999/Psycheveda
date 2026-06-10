---
name: Better You Tips
description: Daily psychological framing popup on the dashboard.
---

# Better You Tips

User-facing name for the daily psychological tip feature (internal code may use `DailyOracle`, `oracle`, `psychologicalTips`).

## Content

- **File:** `mobile/assets/psychologicaltips.json`
- **Shape:** `{ id, pillar, content }` (no `title` or `nlp_framework` in current schema)
- **Pillars:** Health, Finance, Career, Relationships, Inner Wellness

## Selection

- `getDailyTip(userId, date)` — stable hash of user + ISO date → one tip per day
- `resolveDailyOracle(userId)` — in-memory cache per user/day after first resolve

## UI (`DailyOracleCard.js`)

| Element | Behavior |
|---------|----------|
| **Trigger** | Top of dashboard — Sunrise icon, label “Better You Tips”, content preview |
| **Modal** | Popup with `daily-oracle-bg.png`, pillar badge (left), content, **Absorb Strategy** |
| **First visit** | Auto-opens modal if not yet absorbed today |
| **After absorb** | AsyncStorage flag; trigger remains tappable to reopen |
| **Close** | X or backdrop — does not mark absorbed |

## State

- Storage key: `daily_oracle_{userId}_{YYYY-MM-DD}`
- `markOracleAbsorbed(userId, tipId)` — clears resolve cache

## Related files

- `mobile/src/lib/psychologicalTips.js`
- `mobile/app/dashboard.js` — wires trigger + modal + focus load (silent refresh)
