import { todayIso } from './utils';

/** Calendar-day gap between two YYYY-MM-DD strings. */
export function daysBetween(fromIso, toIso) {
  const from = new Date(`${fromIso}T12:00:00`);
  const to = new Date(`${toIso}T12:00:00`);
  return Math.round((to - from) / (24 * 60 * 60 * 1000));
}

/** Streak shown in UI — 0 if the user missed a full day. */
export function effectiveVedaStreak(storedStreak, lastActivityDate, today = todayIso()) {
  if (!lastActivityDate) return 0;
  const gap = daysBetween(lastActivityDate, today);
  if (gap <= 1) return storedStreak || 0;
  return 0;
}

/** Streak to persist after a bless-earning act (mini-task, gratitude, manual progress). */
export function nextVedaStreakOnActivity(storedStreak, lastActivityDate, today = todayIso()) {
  if (!lastActivityDate) return 1;
  if (lastActivityDate === today) return storedStreak || 0;
  const gap = daysBetween(lastActivityDate, today);
  if (gap === 1) return (storedStreak || 0) + 1;
  return 1;
}

export function resolveVedaStreak(storedStreak, lastActivityDate, today = todayIso()) {
  const stored = storedStreak || 0;
  const effective = effectiveVedaStreak(stored, lastActivityDate, today);
  const gap = lastActivityDate ? daysBetween(lastActivityDate, today) : null;
  const shouldResetStored = gap !== null && gap >= 2 && stored > 0;
  return { effective, shouldResetStored };
}
