# Psycheveda — Product Requirements Document

_Last updated: 2026-05-19_

## Original problem statement (verbatim summary)

Build an MVP for **Psycheveda** — a mobile app bridging modern behavioral
psychology (CBT, NLP) with ancient Vedic wellness principles. Framed around
grounding, mindfulness, and circadian rhythm. Uniform **"Sacred Earth & Slate"**
dark theme everywhere, except an exclusive premium zone **"HPA Axis Fix"**
where UI adapts to the user's localized biological clock.

## Architectural pivot (vs spec)

- The spec asked for **Expo / React Native + Supabase**. To deliver a
  live-previewable, runnable artifact in the Emergent environment, the MVP
  was implemented as a **mobile-first React web app + FastAPI + MongoDB**.
- The original Supabase / PostgreSQL schema is delivered as a **production-ready
  migration script** at `/app/database/supabase_migration.sql` (paste into
  Supabase SQL editor). The Mongo models mirror the relational schema 1:1.

## User personas

| Persona | Needs |
|---|---|
| **Inner seeker** | Daily grounding + reflection cadence aligned with Vedic ideals |
| **Behavioral optimizer** | Concrete CBT/NLP reframing tooling + measurable streaks |
| **Burned-out professional** | Circadian-aware reset (HPA Axis Fix premium screen) |

## Core (static) requirements

1. **Sacred Earth & Slate** uniform dark theme (#161B22 / #21262D / #E58A44 / #52796F / #F0F4F8 / #8B949E).
2. **HPA Axis Fix** is the only exception — palette adapts to device-local time.
3. **5 Pillars**: Family & Relationship, Career & Business, Finance & Money, Health, Inner Wellness.
4. **5 simulated AI goal suggestions** per pillar + custom entry.
5. **Goals** include `days|hours` estimate that resolves to a `deadline_at` timestamp.
6. **Mini-Tasks** auto-generated daily from each goal (`ceil(hours/24)` for hour-estimates).
7. **NLP Cognitive Reframing Journal** — exactly 5 sequential steps + bless gratitude on evening entries.
8. **Max 2 journal entries per user per day** (API + Postgres trigger).
9. **Rule-based Bless ledger**: +5 task, +10 journal, +3 gratitude. Veda Streak = consecutive activity days.

## Implementation status (✅ shipped 2026-05-19)

- ✅ FastAPI backend with JWT auth, all endpoints under `/api`
- ✅ MongoDB collections: users, goals, mini_tasks, journal_entries, bless_transactions
- ✅ Sacred Earth & Slate design tokens (Tailwind + global CSS)
- ✅ Cormorant Garamond display + Outfit body fonts (loaded via Google Fonts)
- ✅ Auth screen with Sign In / Create Account tabs
- ✅ 2-step onboarding: pillar selector + per-pillar goal setup with AI suggestions, custom entry, days/hours estimate
- ✅ Dashboard with Bless Points, Veda Streak, Today's Mini-Tasks, Goal progress
- ✅ Journal — sequential 5-step flow (6 with Bless gratitude on evenings); 2/day hard cap; date-wise history
- ✅ HPA Axis Fix premium screen with cortisol_am / twilight / melatonin_pm palettes
- ✅ PostgreSQL migration script (`database/supabase_migration.sql`) with RLS + trigger
- ✅ `architecture.md` condensed file map at root
- ✅ 26/26 backend pytest tests pass; frontend E2E confirmed via Playwright

## Prioritized backlog

### P1 — next session candidates
- Streak-recovery & "Day-zero" gentle re-onboarding copy.
- Native push reminders (web push or Expo wrap).
- Real LLM-powered goal suggestions (gpt-5.2 / Claude Sonnet 4.5) gated behind Premium.
- Profile screen + edit name/avatar.

### P2
- Settings (theme override, quiet hours).
- Social-only sign-in (Google OAuth) — currently email/password only.
- Goal completion confetti + share card.
- Habits analytics screen (Bless trendline, frame distribution heatmap).

### P3 / future
- Coach-led courses module.
- Wearable integration (HRV → adaptive HPA recommendations).
- Multi-language (Sanskrit/Hindi/English UI).

## Known limitations / explicit non-goals for MVP

- AI goal suggestions are static per problem statement ("simulate an AI engine").
- No social sign-in yet (problem statement listed it; not blocking).
- Bless Points are not redeemable for anything (intentional MVP scope).

## Files of record

- `/app/architecture.md` — full file map + API surface + rules
- `/app/design_guidelines.json` — design system
- `/app/database/supabase_migration.sql` — relational schema
- `/app/memory/test_credentials.md` — test accounts

## Next action items

1. Confirm preferred path if you want native iOS/Android (we'd wrap with Expo or build a true RN version).
2. Decide if AI suggestions should be upgraded to a real LLM call.
3. Pick OAuth provider(s) if social sign-in is wanted.
