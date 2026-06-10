---
name: Elevate plan generation
description: How the "Elevate Yourself" plan is generated, stored, and tracked.
---

# Elevate plan generation & tracking

## Plan generation (local, rules matrix v2)

**Elevate Yourself** uses `buildElevatePlan(matrix)` in `mobile/src/lib/elevatePlan.js` reading **`mobile/src/lib/elevateRulesMatrix.json`** — no LLM, no network.

**Screen:** `mobile/app/gut-brain-plan.js` (after Revive **Plan** / Success Identity assessment).

**Sibling CTA on results:** **Consult a Life Coach** → `/life-coach` (coming soon; not part of plan generation).

### Matrix inputs (`matrix` object)

| Field | Used for |
|-------|----------|
| `current_tier` | Duration + tier variants (Survivor / Soldier / Warrior) |
| `age` | `under_40` / `over_40` hydration variants; age conditions |
| `food_preference` | Vegetarian / Non-Vegetarian / Vegan midday fueling |
| `occupation` | Warrior psych-framing task (corporate/entrepreneur fuzzy match) |
| `wake_time`, `sleep_time` | Relative schedule strings for tasks |
| `assessmentAnswers` | Q17 → `hasExerciseRoutine` gates evening exercise task |
| `lowest_parameter` | Passed from UI; reserved for future matrix rules |

### Engine flow

1. **`tierDurations[currentTier]`** → `macroGoalDurationDays` (7 / 14 / 21).
2. Loop **`morningPhase`**, **`afternoonPhase`**, **`eveningPhase`** conditional tasks.
3. **`matchesConditions`** — age, tier, diet, occupation, exercise flag.
4. **`resolveVariant`** — diet → tier → age band → exercise type → `all`.
5. **`curateDailyTasks`** — cap at **7** tasks (2 morning, 2 afternoon, 2 evening core + 1 optional booster).

### Output shape (must match `createElevateGoal` in `api.js`)

```ts
{
  planTitle: string;
  macroGoalDurationDays: number;
  dailyTasks: Array<{
    taskId: string;
    taskTitle: string;           // primary action step text
    timeWindow: 'Morning' | 'Afternoon' | 'Evening';
    scheduledTimeRelative: string;
    psychologicalJustification: string;
  }>;
}
```

`createElevateGoal` inserts `goals` (`source: 'elevate'`) + `mini_tasks` for each habit × each plan day.

## Progress — mini-tasks only (no progress logs)

| Rule | Implementation |
|------|----------------|
| No progress log UI | `goals/[id].js` hides Progress logs for `source === 'elevate'` |
| No `logProgress` | `api.logProgress` throws for Elevate |
| No log list | `api.listProgressLogs` returns `[]` for Elevate |
| No reminders | `api.goalReminders` filters out `source === 'elevate'` |
| Completion % | `analyzeElevateSubTasks()` in `completionProbability.js` |
| History UI | `ElevateSubtaskHistory.js`, `TrackModal.js` |

Users complete work on the **Dashboard** via mini-task checkboxes (`toggleTask`, +5 Bless). Optimistic UI on toggle; `invalidateDashboardCache()` after complete.

## Completion probability

- Past incomplete `mini_task` = **miss**; completed = **hit**; future / today incomplete = **pending**
- Penalty rules: see `completionProbability.js` header comment
- **Dashboard** does not show % beside mini-tasks — only at goal level (Track / goal detail)

## Web / local dev

- `mobile/package.json`: `"web": "expo start --web --port 5001"`
- Local URL: http://localhost:5001 (5000 often taken by macOS AirPlay)
- `app.json`: `web.output: "single"` — no Expo API routes
- SSR shims: `mobile/src/lib/supabase.js` — see [expo-ssr-supabase.md](expo-ssr-supabase.md)

Do not reintroduce server-side plan generation without aligning `app.json` and consumers.
