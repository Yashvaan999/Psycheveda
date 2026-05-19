# Psycheveda — Architecture Map

> Condensed root-level summary of the Psycheveda MVP codebase. This file is the
> *single source of truth* for layout to minimize LLM context-window overhead.

## High-level

Psycheveda bridges modern behavioral psychology (CBT, NLP) with Vedic wellness.
The MVP is delivered as a **mobile-first responsive web app** using:

- **Frontend**: React 18 + React Router + Tailwind CSS + lucide-react
- **Backend**: FastAPI (Python) + Motor (async MongoDB)
- **Auth**: JWT email/password (bcrypt)
- **Theme**: Uniform `Sacred Earth & Slate` dark palette across all screens,
  with one exception — `/hpa-axis` adapts to the device's local time.
- **Database parity**: Mongo is the live store. The schema mirrors the
  Supabase / PostgreSQL migration in `database/supabase_migration.sql`,
  so the layer is portable to Supabase if the user later swaps BaaS.

## Directory map

```
/app
├── architecture.md                  # ← this file
├── design_guidelines.json           # Design system tokens & screen blueprints
├── backend/
│   ├── server.py                    # FastAPI app — all /api/* routes
│   ├── requirements.txt
│   └── .env                         # MONGO_URL, DB_NAME, JWT_SECRET, …
├── database/
│   └── supabase_migration.sql       # PostgreSQL migration (paste into Supabase)
├── frontend/
│   ├── package.json
│   ├── tailwind.config.js           # Psycheveda + HPA palette tokens
│   ├── postcss.config.js
│   ├── public/index.html            # Loads Cormorant Garamond + Outfit fonts
│   └── src/
│       ├── index.js                 # React bootstrap
│       ├── index.css                # Tailwind + global Sacred-Earth styles
│       ├── App.js                   # Router (AuthProvider + Protected routes)
│       ├── App.css                  # minimal app-level overrides
│       ├── theme/
│       │   └── tokens.js            # Color tokens, pillar meta, getHpaPhase()
│       ├── lib/
│       │   ├── api.js               # axios client w/ JWT interceptor
│       │   ├── auth.jsx             # AuthProvider + useAuth hook
│       │   └── utils.js             # cn(), date formatters
│       ├── components/
│       │   ├── AppShell.jsx         # Header + bottom nav for protected views
│       │   └── ui/primitives.jsx    # Button, Card, Input, Textarea, Label, Badge, Divider
│       └── screens/
│           ├── AuthScreen.jsx       # Sign in / Register
│           ├── OnboardingScreen.jsx # 2-step pillar + goal setup w/ estimate
│           ├── DashboardScreen.jsx  # Bless/Streak + Daily Mini-Tasks + Goals
│           ├── JournalScreen.jsx    # Sequential 5-step NLP flow (+ bless on PM)
│           ├── JournalHistoryScreen.jsx # Date-wise timeline
│           └── HpaAxisScreen.jsx    # Premium time-adaptive palette screen
└── memory/                          # PRD, test_credentials, runbooks
```

## API surface (FastAPI)

All routes are prefixed `/api`.

| Method | Path                                | Purpose                                              |
|--------|-------------------------------------|------------------------------------------------------|
| GET    | /api/health                         | Liveness probe                                       |
| POST   | /api/auth/register                  | Email/password registration → JWT                    |
| POST   | /api/auth/login                     | Email/password sign-in → JWT                         |
| GET    | /api/auth/me                        | Current user profile                                 |
| GET    | /api/pillars                        | List the 5 pillars                                   |
| GET    | /api/pillars/{pillar}/suggestions   | 5 simulated AI goal suggestions for that pillar      |
| POST   | /api/onboarding/pillars             | Persist user's selected pillars + complete onboarding |
| POST   | /api/goals                          | Create goal (auto-generates daily mini-tasks)        |
| GET    | /api/goals                          | List user's goals + tasks                            |
| GET    | /api/tasks/today                    | Today's mini-tasks across goals                      |
| PATCH  | /api/tasks/{task_id}                | Toggle completion → updates bless ledger + streak    |
| GET    | /api/journal/frames                 | NLP frame catalog                                    |
| POST   | /api/journal                        | Create journal entry (hard cap 2/day)                |
| GET    | /api/journal                        | Date-wise grouped entries                            |
| GET    | /api/stats                          | Bless balance, streak, today's progress              |
| GET    | /api/hpa-axis/phase                 | Server hint for the circadian phase                  |

## Behavioral rules — Bless ledger

- `+5` Bless Points per mini-task completion (revoked on un-toggle)
- `+10` Bless Points per journal entry sealed
- `+3` Bless Points for an evening Bless-Point gratitude
- **Veda Streak** = consecutive days with ≥ 1 bless-earning activity.
  Resets to `1` if a day is skipped; preserved if same-day re-activity.

## Theme architecture

- Global tokens live in `tailwind.config.js` (`psy.*` namespace) and
  `src/theme/tokens.js`.
- The **HPA Axis Fix** screen is the only place that swaps palettes at runtime
  based on `new Date().getHours()`:
    - `05:00 – 13:59` → `cortisol_am`
    - `14:00 – 16:59` → `twilight`
    - `17:00 – 04:59` → `melatonin_pm`
- Palette swap is purely client-side; `/api/hpa-axis/phase` returns only a hint.

## Reflection notes (per problem statement)

- **Journal validation** is enforced at TWO layers: API count check + the
  Supabase migration trigger `enforce_journal_daily_limit()`. Bulletproof against
  client-side bypass.
- **Days vs. Hours** is converted at goal-creation time:
  `deadline_at = now() + interval (estimate_value * unit)`; mini-task
  generation uses `ceil(hours/24)` for sub-day estimates so the dashboard
  always shows at least one task.
- **Context preservation**: this single `architecture.md` (plus
  `design_guidelines.json`) is enough to reconstruct the layout map without
  re-reading every file.
