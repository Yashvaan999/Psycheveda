---
name: Elevate plan generation
description: How the "Elevate Yourself" plan is generated and the output-shape contract it must honor.
---

The "Elevate Yourself" plan is generated **fully locally** by a rule-based generator (`buildElevatePlan(matrix)` in `mobile/src/lib/elevatePlan.js`). There is no AI/LLM, no network call, and no OpenAI key involved.

**Why:** The user's OpenAI key kept returning 429 quota-exceeded errors, so they chose to replace AI entirely with a free, instant, deterministic generator.

**How to apply:**
- The generator output (`{ planTitle, macroGoalDurationDays, dailyTasks:[{ taskId, taskTitle, timeWindow, scheduledTimeRelative, psychologicalJustification }] }`) is consumed by `createElevateGoal`. Any change to one side's field names/shape must change the other in lockstep, or goal creation silently drops data.
- `current_tier` drives duration + which transition the plan targets; `lowest_parameter` (one of the 5 sub-parameter labels) injects a targeted task; `food_preference` varies the nutrition task; task times are computed relative to `wake_time`/`sleep_time`.
- Do not reintroduce a server API route for this without also changing `mobile/app.json` web `output` back to `server` (it is `single` now that there are no API routes).
