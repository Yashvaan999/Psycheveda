/**
 * Completion probability from chronological hit/miss events (sub-tasks or days).
 *
 * Penalties (cumulative per consecutive run, cap 95%, floor 5%):
 *   1 miss → 5% | 2 consecutive → 25% | 3 → 50% | k≥4 → min(5^k/10, 80)%
 *   Scattered singleton (hit before AND after) → 2% × scatteredIndex
 */

const FLOOR = 5;
const PENALTY_CAP = 95;

export function consecutiveRunPenalty(runLength) {
  if (runLength <= 0) return 0;
  if (runLength === 1) return 5;
  if (runLength === 2) return 25;
  if (runLength === 3) return 50;
  return Math.min(5 ** runLength / 10, 80);
}

/**
 * @param {Array<{ type: 'hit' | 'miss' }>} events — past outcomes in order
 */
export function computePenalty(events) {
  const relevant = events.filter((e) => e.type === 'hit' || e.type === 'miss');
  let penalty = 0;
  let scatteredIdx = 0;
  let i = 0;

  while (i < relevant.length) {
    if (relevant[i].type !== 'miss') {
      i += 1;
      continue;
    }
    let j = i;
    while (j < relevant.length && relevant[j].type === 'miss') j += 1;
    const runLen = j - i;

    if (runLen >= 2) {
      penalty += consecutiveRunPenalty(runLen);
    } else {
      const hasBefore = relevant.slice(0, i).some((e) => e.type === 'hit');
      const hasAfter = relevant.slice(j).some((e) => e.type === 'hit');
      if (hasBefore && hasAfter) {
        scatteredIdx += 1;
        penalty += 2 * scatteredIdx;
      } else {
        penalty += 5;
      }
    }
    i = j;
  }

  return Math.min(PENALTY_CAP, penalty);
}

export function computeCompletionProbability(events) {
  const relevant = events.filter((e) => e.type === 'hit' || e.type === 'miss');
  return Math.max(FLOOR, Math.round(100 - computePenalty(relevant)));
}

function todayStrLocal() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function sortTasks(a, b) {
  const d = a.scheduled_for.localeCompare(b.scheduled_for);
  if (d !== 0) return d;
  const w = (a.time_window || '').localeCompare(b.time_window || '');
  if (w !== 0) return w;
  return (a.title || '').localeCompare(b.title || '');
}

/**
 * Elevate goals: each mini_task is a sub-task; past incomplete = miss.
 * @param {Array<object>} miniTasks
 * @param {string} [today] — YYYY-MM-DD
 */
export function analyzeElevateSubTasks(miniTasks, today = todayStrLocal()) {
  const sorted = [...(miniTasks || [])].sort(sortTasks);

  const events = sorted.map((t) => ({
    id: t.id,
    title: t.title,
    dateStr: t.scheduled_for,
    time_window: t.time_window || null,
    scheduled_time: t.scheduled_time || null,
    completed: !!t.completed,
    type:
      t.scheduled_for > today
        ? 'pending'
        : t.completed
          ? 'hit'
          : 'miss',
  }));

  const scored = events.filter((e) => e.type === 'hit' || e.type === 'miss');
  const probability = computeCompletionProbability(scored);

  const tasksCompleted = scored.filter((e) => e.type === 'hit').length;
  const tasksMissed = scored.filter((e) => e.type === 'miss').length;
  const tasksPending = events.filter((e) => e.type === 'pending').length;
  const tasksTotal = events.length;

  const historyByDate = {};
  for (const e of events) {
    if (e.type === 'pending' && e.dateStr > today) continue;
    if (!historyByDate[e.dateStr]) {
      historyByDate[e.dateStr] = {
        dateStr: e.dateStr,
        subtasks: [],
        completed: 0,
        missed: 0,
        pending: 0,
        total: 0,
      };
    }
    const row = historyByDate[e.dateStr];
    const status = e.type === 'pending' ? 'pending' : e.type === 'hit' ? 'completed' : 'missed';
    row.subtasks.push({
      id: e.id,
      title: e.title,
      status,
      time_window: e.time_window,
      scheduled_time: e.scheduled_time,
    });
    row.total += 1;
    if (status === 'completed') row.completed += 1;
    else if (status === 'missed') row.missed += 1;
    else row.pending += 1;
  }

  const taskHistory = Object.values(historyByDate).sort((a, b) => b.dateStr.localeCompare(a.dateStr));

  const uniqueDates = [...new Set(events.map((e) => e.dateStr))].sort();
  const timeline = [];
  let processed = [];

  for (const dateStr of uniqueDates) {
    const dayEvents = events.filter((e) => e.dateStr === dateStr);
    const isPast = dateStr < today;
    const isToday = dateStr === today;
    const actionable = dayEvents.filter((e) => e.type === 'hit' || e.type === 'miss');
    const pendingToday = dayEvents.filter((e) => e.type === 'pending');

    if (isPast || isToday) {
      processed = processed.concat(actionable);
    }

    const dayHit =
      actionable.length > 0 && actionable.every((e) => e.type === 'hit');
    const dayMiss = isPast && actionable.some((e) => e.type === 'miss');

    timeline.push({
      dateStr,
      logged: dayHit,
      isPast: isPast || isToday,
      prob: computeCompletionProbability(processed.filter((e) => e.type === 'hit' || e.type === 'miss')),
      subtasksCompleted: actionable.filter((e) => e.type === 'hit').length,
      subtasksMissed: actionable.filter((e) => e.type === 'miss').length,
      subtasksPending: pendingToday.length,
      subtasksTotal: dayEvents.length,
    });
  }

  const totalDays = uniqueDates.length;
  const daysElapsed = timeline.filter((t) => t.dateStr <= today && t.isPast).length;
  const daysLogged = timeline.filter((t) => t.dateStr <= today && t.logged).length;

  return {
    probability,
    timeline,
    taskHistory,
    tasksCompleted,
    tasksMissed,
    tasksPending,
    tasksTotal,
    totalDays,
    daysElapsed,
    daysLogged,
    trackingMode: 'subtasks',
  };
}

/**
 * Manual goals: one outcome per calendar day (progress log = hit).
 */
export function analyzeManualDays({ totalDays, createdAt, logDates }, today = todayStrLocal()) {
  const created = new Date(createdAt);
  created.setHours(0, 0, 0, 0);
  const logSet = logDates instanceof Set ? logDates : new Set(logDates || []);

  const events = [];
  const timeline = [];
  let processed = [];

  const displayDays = Math.min(totalDays, 60);
  for (let i = 0; i < displayDays; i += 1) {
    const d = new Date(created);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const isPast = dateStr < today;
    const isToday = dateStr === today;

    let type = 'pending';
    if (isPast) type = logSet.has(dateStr) ? 'hit' : 'miss';
    else if (isToday) type = logSet.has(dateStr) ? 'hit' : 'pending';

    events.push({ dateStr, type });

    if (type === 'hit' || type === 'miss') {
      processed.push({ type });
    }

    timeline.push({
      dateStr,
      logged: type === 'hit',
      isPast: isPast || isToday,
      prob: computeCompletionProbability(processed),
    });
  }

  const scored = events.filter((e) => e.type === 'hit' || e.type === 'miss');
  const probability = computeCompletionProbability(scored);
  const daysElapsed = Math.max(0, scored.length);
  const daysLogged = scored.filter((e) => e.type === 'hit').length;

  const taskHistory = timeline
    .filter((t) => t.isPast && (t.logged || t.dateStr < today))
    .map((t) => ({
      dateStr: t.dateStr,
      subtasks: [],
      completed: t.logged ? 1 : 0,
      missed: t.logged ? 0 : 1,
      pending: 0,
      total: 1,
      dayLogged: t.logged,
    }))
    .reverse();

  return {
    probability,
    timeline,
    taskHistory,
    tasksCompleted: daysLogged,
    tasksMissed: Math.max(0, daysElapsed - daysLogged),
    tasksPending: 0,
    tasksTotal: totalDays,
    totalDays,
    daysElapsed,
    daysLogged,
    trackingMode: 'days',
  };
}
