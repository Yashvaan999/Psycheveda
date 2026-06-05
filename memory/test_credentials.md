# Psycheveda — Test Credentials & Environment

_Last updated: 2026-06-04_

## Mobile app (primary — Supabase)

### Environment

File: **`mobile/.env`** (gitignored)

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

Supabase Dashboard → **Project Settings** → **API** → Project URL + **anon public** key.

### Run locally

```bash
cd mobile
npm install --legacy-peer-deps
npm run web
```

Open **http://localhost:5001** (not 5000 — often blocked by macOS AirPlay).

Restart:

```bash
lsof -ti:5001 | xargs kill -9 2>/dev/null
npm run web
```

## Legacy web MVP (FastAPI + Mongo)

| File | Variables |
|------|-----------|
| `backend/.env` | `MONGO_URL`, `DB_NAME`, `JWT_SECRET` |
| `frontend/.env` | `REACT_APP_BACKEND_URL=http://localhost:8001` |

API prefix: `/api`

## Test accounts

### Supabase / mobile

- Register a new user on the auth screen for full flows.
- Suggested: `tester+<timestamp>@psyche.app` / `Test1234`

### Legacy Mongo (optional)

- `seeker@psyche.app` / `Test1234`
- May already have 2 journal entries today (quota UI).

## Test flows

### Elevate (mini-tasks, no progress logs)

1. Apply migrations **v1–v5** in Supabase.
2. Complete **Gut-Brain** → **Elevate Yourself** → creates `source = 'elevate'` goal + `mini_tasks`.
3. On **Dashboard**, check off today's Elevate mini-tasks.
4. Open goal detail or **Track** → completion % and **sub-task history** (no Progress logs section).

### Manual goals (progress logs)

1. Create a goal via **onboarding** (non-Elevate).
2. On goal detail → **Log progress** with a note.
3. **Track** modal and reminders use progress-log days for completion %.

### Verify Elevate excludes progress logs

- `logProgress` on an Elevate goal should error in API.
- Goal detail for Elevate shows mini-task guidance, not the log form.
- Bell reminders list **manual** goals only.
