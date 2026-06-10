# Psycheveda — Product Requirements Document

_Last updated: 2026-06-04_

## Vision

MVP bridging behavioral psychology (CBT, NLP) with Vedic wellness. Light **Saffron, Sage & Linen** UI; **Revive** adapts palette to local time.

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
| **Burned-out professional** | Circadian reset (Revive) |

## Core requirements

1. Five **pillars**, goal suggestions, custom goals (`days` \| `hours`).
2. **Mini-tasks** per goal; Elevate = one sub-task per habit × plan duration.
3. **NLP journal** — max **2/day**.
4. **Gratitude** — three blessings, **+15 Bless**, once per day.
5. **Bless** — +5 per completed mini-task; **Veda Streak** on profile.
6. **Revive Plan** → Success Identity tiers + stage guide modal; **Elevate Yourself** → local rules-matrix plan.
7. **Consult a Life Coach** — coming-soon screen from assessment results (live booking deferred).
8. **Better You Tips** — one daily psychological framing tip (popup + dashboard trigger).
9. **Completion probability** per **goal** (not per dashboard mini-task).
10. **Revive** — dynamic palette and phase copy by time of day.

## Better You Tips

- Tips from `mobile/assets/psychologicaltips.json` (`id`, `pillar`, `content`).
- One tip per user per calendar day; deterministic selection.
- Dashboard trigger at top; modal with background art, pillar badge, **Absorb Strategy**.
- Reopen anytime via trigger; absorbed state persisted in AsyncStorage.

## Revive (formerly Gut-Brain / HPA Axis in UI)

- Bottom nav: **Revive** → `/hpa-axis`.
- Phase explorer (Morning / Afternoon / Night) with tailored taglines and descriptions.
- **Plan** button → Success Identity assessment (`/gut-brain-plan`).
- Internal routes/tables may retain `gut_brain` / `gut-brain-plan` names.

## Success Identity & Elevate

### Assessment

- 30-question Likert → Survivor / Soldier / Warrior / Superhero.
- `IDENTITY_STAGES` — carousel modal with full stage copy (info icon on results).
- Sub-parameter breakdown with info tooltips.

### Elevate plan (v2)

- `elevateRulesMatrix.json` + `buildElevatePlan()` — conditional morning / afternoon / evening tasks.
- Duration: 7 / 14 / 21 days by tier.
- Personalization: age, tier, diet, occupation, exercise (from Q17).
- **6–7 daily tasks** after curation (not full matrix dump).
- Creates `source = 'elevate'` goal + scheduled `mini_tasks`.

## Consult a Life Coach (coming soon)

- Button on assessment **results** screen, below **Elevate Yourself**.
- Navigates to `/life-coach` — styled placeholder (no booking, payments, or coach matching yet).
- Back / **Return to my results** returns to assessment results.

## Goal tracking modes

### Manual goals

- User may **log progress** (free text) on the goal detail screen.
- Completion % uses **progress-log days** (`goalTrackingData` → `analyzeManualDays`).
- **Reminders** in AppShell when today's log is missing.
- `logProgress` can auto-complete same-day mini-tasks for that goal.

### Elevate goals

- **No progress logs** — UI, API (`logProgress`, `listProgressLogs`), and reminders all exclude Elevate.
- User completes **Dashboard mini-tasks** (checkboxes; optimistic toggle).
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
- ✅ Dashboard batched load (`fetchDashboard`) + stale-while-revalidate on focus

### Goals & tasks
- ✅ Onboarding, dashboard mini-tasks, goal list (slim queries)
- ✅ Manual goal detail: progress logs
- ✅ Elevate goal detail: completion % + `ElevateSubtaskHistory`
- ✅ Track modal (all goals)
- ✅ Optimistic mini-task checkbox on dashboard

### Progress & analytics
- ✅ `goalTrackingData`, penalty engine, sparkline
- ✅ Elevate sub-task history (completed / missed / pending by date)

### Wellness
- ✅ Journal, gratitude
- ✅ Revive screen + Plan assessment + Success Identity stages
- ✅ Elevate plan (rules matrix v2, local)
- ✅ Better You Tips daily popup
- ✅ Consult a Life Coach coming-soon page (`life-coach.js`)

### Gamification
- ✅ Bless points modal, Veda streak, manual-goal reminders

## Progress tracking — files of record

| Concern | Files |
|---------|--------|
| API | `mobile/src/lib/api.js` |
| Dashboard batch | `fetchDashboard`, `invalidateDashboardCache` |
| Completion % | `mobile/src/lib/completionProbability.js` |
| Elevate plans | `elevatePlan.js`, `elevateRulesMatrix.json` |
| Assessment | `successIdentity.js` |
| Better You Tips | `psychologicalTips.js`, `DailyOracleCard.js`, `psychologicaltips.json` |
| Revive UI | `hpa-axis.js`, `theme.js` (`hpaPalettes`) |
| Assessment UI | `gut-brain-plan.js`, `life-coach.js` |
| UI | `TrackModal.js`, `ElevateSubtaskHistory.js`, `dashboard.js`, `goals/[id].js` |
| Schema | `database/supabase_migration.sql` … `v5.sql` |

## Local development

```bash
cd mobile && npm install --legacy-peer-deps && npm run web
```

→ http://localhost:5001 (avoid 5000 on macOS — AirPlay)

## Backlog (abbreviated)

**P1:** Push reminders, profile screen, optional LLM suggestions, **live Life Coach booking**  
**P2:** OAuth, settings, analytics  
**Deferred:** Subscription paywall (`.agents/memory/subscription-paywall.md`)

## Known limitations

- No live LLM for Elevate or pillar suggestions in production path.
- Manual completion % depends on **progress logs**, not task checkboxes alone.
- `toggleTask` is complete-only (no un-check in mobile client).
- Bless Points not redeemable in MVP.
- Goals without `source = 'elevate'` after Elevate flow need v5 migration applied.
- Legacy route `/gut-brain-plan` and table `gut_brain_assessments` not renamed in DB.

## Related docs

- [`architecture.md`](../architecture.md)
- [`memory/test_credentials.md`](test_credentials.md)
- [`design_guidelines.json`](../design_guidelines.json)
- [`.agents/memory/better-you-tips.md`](../.agents/memory/better-you-tips.md)
- [`.agents/memory/elevate-plan-generation.md`](../.agents/memory/elevate-plan-generation.md)
- [`.agents/memory/life-coach.md`](../.agents/memory/life-coach.md)
