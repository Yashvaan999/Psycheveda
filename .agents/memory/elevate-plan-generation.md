---
name: Elevate plan generation
description: How the "Elevate Yourself" plan is generated, stored, and tracked.
---

# Elevate plan generation & tracking

## Plan generation (local)

**Elevate Yourself** uses `buildElevatePlan(matrix)` in `mobile/src/lib/elevatePlan.js` — no LLM, no network.

**Screen:** `mobile/app/gut-brain-plan.js` (after Gut-Brain assessment).

**Output shape** (must match `createElevateGoal` in `api.js`):

```ts
{
  planTitle: string;
  macroGoalDurationDays: number;
  dailyTasks: Array<{
    taskId: string;
    taskTitle: string;
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

Users complete work on the **Dashboard** via mini-task checkboxes (`toggleTask`, +5 Bless).

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
