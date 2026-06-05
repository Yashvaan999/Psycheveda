# Psycheveda — Product Requirements Document

_Last updated: 2026-06-04_

## Vision

MVP bridging behavioral psychology (CBT, NLP) with Vedic wellness. Light **Saffron, Sage & Linen** UI; **HPA Axis** adapts palette to local time.

## Architecture (current)

| Track | Stack | Status |
|--------|--------|--------|
| **Primary** | Expo (`mobile/`) + Supabase | Active — local (`:5001`) + Replit |
| **Legacy** | CRA (`frontend/`) + FastAPI + MongoDB | Maintained; SQL migrations mirror schema |

## User personas

| Persona | Needs |
|---------|--------|
| **Inner seeker** | Daily grounding and reflection |
| **Behavioral optimizer** | CBT/NLP tools, streaks, goal completion % |
| **Burned-out professional** | Circadian reset (HPA Axis) |

## Core requirements

1. Five **pillars**, goal suggestions, custom goals (`days` \| `hours`).
2. **Mini-tasks** per goal; Elevate = one sub-task per habit × plan duration.
3. **NLP journal** — max **2/day**.
4. **Gratitude** — three blessings, **+15 Bless**, once per day.
5. **Bless** — +5 per completed mini-task; **Veda Streak** on profile.
6. **Gut-Brain** → Success Identity tiers; **Elevate Yourself** → local plan (`elevatePlan.js`).
7. **Completion probability** per **goal** (not per dashboard mini-task).
8. **HPA Axis** — dynamic palette by time of day.

## Goal tracking modes

### Manual goals

- User may **log progress** (free text) on the goal detail screen.
- Completion % uses **progress-log days** (`goalTrackingData` → `analyzeManualDays`).
- **Reminders** in AppShell when today's log is missing.
- `logProgress` can auto-complete same-day mini-tasks for that goal.

### Elevate goals

- **No progress logs** — UI, API (`logProgress`, `listProgressLogs`), and reminders all exclude Elevate.
- User completes **Dashboard mini-tasks** (checkboxes).
- Completion % and **date-wise sub-task history** from `mini_tasks` (`analyzeElevateSubTasks`).
- Requires `goals.source = 'elevate'` (migration v5).

## Completion probability rules

Implemented in `mobile/src/lib/completionProbability.js`:

- Consecutive miss runs: −5% / −25% / −50% / −min(5^k/10, 80)% for k≥4
- Scattered isolated misses: −2% × index (when sandwiched by hits)
- Floor **5%**, total penalty cap **95%**
- UI colors: ≥75% green, 50–74% amber, 30–49% orange, &lt;30% red

## Shipped features

### Platform
- ✅ Expo Router + Supabase Auth
- ✅ Legacy FastAPI + Mongo MVP

### Goals & tasks
- ✅ Onboarding, dashboard mini-tasks, goal list
- ✅ Manual goal detail: progress logs
- ✅ Elevate goal detail: completion % + `ElevateSubtaskHistory`
- ✅ Track modal (all goals)

### Progress & analytics
- ✅ `goalTrackingData`, penalty engine, sparkline
- ✅ Elevate sub-task history (completed / missed / pending by date)

### Wellness
- ✅ Journal, gratitude, Gut-Brain, Elevate plan (local), HPA Axis

### Gamification
- ✅ Bless points modal, Veda streak, manual-goal reminders

## Progress tracking — files of record

| Concern | Files |
|---------|--------|
| API | `mobile/src/lib/api.js` |
| Completion % | `mobile/src/lib/completionProbability.js` |
| Elevate plans | `mobile/src/lib/elevatePlan.js` |
| Assessment | `mobile/src/lib/successIdentity.js` |
| UI | `TrackModal.js`, `ElevateSubtaskHistory.js`, `dashboard.js`, `goals/[id].js` |
| Schema | `database/supabase_migration.sql` … `v5.sql` |

## Local development

```bash
cd mobile && npm install --legacy-peer-deps && npm run web
```

→ http://localhost:5001 (avoid 5000 on macOS — AirPlay)

## Backlog (abbreviated)

**P1:** Push reminders, profile screen, optional LLM suggestions  
**P2:** OAuth, settings, analytics  
**Deferred:** Subscription paywall (`.agents/memory/subscription-paywall.md`)

## Known limitations

- No live LLM for Elevate or pillar suggestions in production path.
- Manual completion % depends on **progress logs**, not task checkboxes alone.
- `toggleTask` is complete-only (no un-check in mobile client).
- Bless Points not redeemable in MVP.
- Goals without `source = 'elevate'` after Elevate flow need v5 migration applied.

## Related docs

- [`architecture.md`](../architecture.md)
- [`memory/test_credentials.md`](test_credentials.md)
- [`design_guidelines.json`](../design_guidelines.json)
