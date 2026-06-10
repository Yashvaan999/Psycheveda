// Rule-matrix "Elevate Yourself" plan generator (v2).
//
// Reads elevateRulesMatrix.json and builds a customized daily goal plan from the
// user's context metrics. Output shape matches createElevateGoal in api.js.

import rulesMatrixDoc from './elevateRulesMatrix.json';

const TIER_ORDER = ['SURVIVOR', 'SOLDIER', 'WARRIOR', 'SUPERHERO'];
const TIER_TITLE = {
  SURVIVOR: 'Survivor',
  SOLDIER: 'Soldier',
  WARRIOR: 'Warrior',
  SUPERHERO: 'Superhero',
};

const DAILY_TASK_LIMIT = 7;

const PHASE_META = {
  morningPhase: { timeWindow: 'Morning', schedule: 'wake', baseOffset: 10, stagger: 20, maxSlots: 2 },
  afternoonPhase: { timeWindow: 'Afternoon', schedule: 'wake', baseOffset: 330, stagger: 25, maxSlots: 2 },
  eveningPhase: { timeWindow: 'Evening', schedule: 'sleep', baseOffset: -150, stagger: -30, maxSlots: 3 },
};

// Within each phase, earlier ids are kept when slots are tight.
const PHASE_RULE_ORDER = {
  morningPhase: ['m_hydration_base', 'm_circadian_light', 'm_psych_framing'],
  afternoonPhase: ['a_metabolic_fueling', 'a_stimulant_sunset'],
  eveningPhase: ['e_nlp_reframing', 'e_digital_sunset', 'e_somatic_output'],
};

// One optional evening/morning booster competes for the 7th slot after the 6 core habits.
const OPTIONAL_BOOSTER_RULES = ['e_somatic_output', 'm_psych_framing'];

const CORPORATE_OCCUPATION_HINTS = [
  'entrepreneur', 'corporate', 'founder', 'ceo', 'cto', 'coo', 'business', 'executive',
  'manager', 'consultant', 'startup', 'director', 'vp', 'software', 'engineer', 'developer',
  'analyst', 'banker', 'finance', 'sales', 'marketing', 'product', 'operations', 'lawyer',
  'accountant', 'architect', 'designer', 'professional',
];

// --- Time helpers ---------------------------------------------------------

function parseTime(str) {
  if (!str) return null;
  const s = String(str).trim().toLowerCase();
  const m = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  const ampm = m[3];
  if (Number.isNaN(h) || h > 23 || min > 59) return null;
  if (ampm === 'pm' && h < 12) h += 12;
  if (ampm === 'am' && h === 12) h = 0;
  return h * 60 + min;
}

function formatTime(totalMin) {
  let m = ((totalMin % 1440) + 1440) % 1440;
  const h24 = Math.floor(m / 60);
  const min = m % 60;
  const ampm = h24 < 12 ? 'AM' : 'PM';
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  return `~${h12}:${String(min).padStart(2, '0')} ${ampm}`;
}

function normalizeTierKey(tier) {
  const t = String(tier || 'SURVIVOR').toUpperCase();
  return TIER_ORDER.includes(t) ? t : 'SURVIVOR';
}

function tierTitle(tier) {
  return TIER_TITLE[normalizeTierKey(tier)];
}

function capitalize(s) {
  const str = String(s || '').toLowerCase();
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function occupationMatches(userOccupation, required) {
  if (!required) return true;
  const u = String(userOccupation || '').toLowerCase().trim();
  if (!u) return false;
  if (required === 'Entrepreneurial / Corporate') {
    return CORPORATE_OCCUPATION_HINTS.some((hint) => u.includes(hint));
  }
  const parts = String(required).toLowerCase().split(/[/,&]+/).map((p) => p.trim()).filter(Boolean);
  return parts.some((part) => u.includes(part));
}

function matchesConditions(conditions, user) {
  if (!conditions || typeof conditions !== 'object') return true;

  const age = Number(user.age);
  if (conditions.minAge != null && (!Number.isFinite(age) || age < conditions.minAge)) return false;
  if (conditions.maxAge != null && (!Number.isFinite(age) || age > conditions.maxAge)) return false;

  if (Array.isArray(conditions.tier) && conditions.tier.length > 0) {
    const current = tierTitle(user.current_tier);
    if (!conditions.tier.includes(current)) return false;
  }

  if (Array.isArray(conditions.dietaryHabit) && conditions.dietaryHabit.length > 0) {
    const diet = String(user.food_preference || '').trim();
    if (!diet || !conditions.dietaryHabit.includes(diet)) return false;
  }

  if (conditions.occupation != null) {
    if (!occupationMatches(user.occupation, conditions.occupation)) return false;
  }

  if (conditions.hasExerciseRoutine === true && !user.hasExerciseRoutine) return false;
  if (conditions.hasExerciseRoutine === false && user.hasExerciseRoutine) return false;

  return true;
}

function resolveVariant(variants, user) {
  if (!variants || typeof variants !== 'object') return null;

  const diet = String(user.food_preference || '').trim();
  if (diet && variants[diet]) return variants[diet];

  const tier = tierTitle(user.current_tier);
  if (variants[tier]) return variants[tier];

  const age = Number(user.age);
  if (Number.isFinite(age)) {
    if (age >= 40 && variants.over_40) return variants.over_40;
    if (age < 40 && variants.under_40) return variants.under_40;
  }

  const exerciseType = user.exerciseType || 'general_exercise';
  if (variants[exerciseType]) return variants[exerciseType];

  if (variants.all) return variants.all;

  const keys = Object.keys(variants);
  return keys.length ? variants[keys[0]] : null;
}

function primaryActionStep(variant) {
  const steps = Array.isArray(variant?.actionSteps) ? variant.actionSteps.filter(Boolean) : [];
  return steps[0] || '';
}

function formatJustification(variant) {
  const steps = Array.isArray(variant?.actionSteps) ? variant.actionSteps.filter(Boolean) : [];
  const why = variant?.justification || '';
  if (steps.length <= 1) {
    return why || steps[0] || '';
  }
  const extra = steps.slice(1).join(' ');
  return extra ? `${why} Also: ${extra}` : why;
}

function scheduleTime(phaseKey, taskIndex, wake, sleep) {
  const meta = PHASE_META[phaseKey];
  if (!meta) return formatTime(wake);

  const anchor = meta.schedule === 'sleep' ? sleep : wake;
  const minutes = anchor + meta.baseOffset + taskIndex * meta.stagger;
  return formatTime(minutes);
}

function buildRuleTask(phaseKey, rule, user) {
  if (!matchesConditions(rule.conditions, user)) return null;

  const variant = resolveVariant(rule.variants, user);
  if (!variant) return null;

  const meta = PHASE_META[phaseKey];
  const action = primaryActionStep(variant);

  return {
    taskId: rule.ruleId,
    phaseKey,
    taskTitle: action || rule.taskTitle,
    timeWindow: meta?.timeWindow || 'Morning',
    psychologicalJustification: formatJustification(variant),
    durationMinutes: rule.durationMinutes || null,
    actionSteps: variant.actionSteps || [],
  };
}

function buildCandidateTasks(rulesMatrix, user) {
  const candidates = new Map();

  for (const [phaseKey, phaseDef] of Object.entries(rulesMatrix)) {
    const rules = Array.isArray(phaseDef?.conditionalTasks) ? phaseDef.conditionalTasks : [];
    for (const rule of rules) {
      const task = buildRuleTask(phaseKey, rule, user);
      if (task) candidates.set(task.taskId, task);
    }
  }

  return candidates;
}

function isOptionalBooster(taskId) {
  return OPTIONAL_BOOSTER_RULES.includes(taskId);
}

function curateDailyTasks(candidates, wake, sleep, limit = DAILY_TASK_LIMIT) {
  const selected = [];
  const selectedIds = new Set();

  const take = (taskId) => {
    if (selected.length >= limit || selectedIds.has(taskId)) return;
    const task = candidates.get(taskId);
    if (!task) return;
    selectedIds.add(taskId);
    selected.push(task);
  };

  // Core cross-phase coverage: 2 morning, up to 2 afternoon, 2 evening (~6 tasks).
  for (const phaseKey of Object.keys(PHASE_RULE_ORDER)) {
    const meta = PHASE_META[phaseKey];
    const order = PHASE_RULE_ORDER[phaseKey];
    let phaseCount = 0;

    for (const ruleId of order) {
      if (phaseCount >= meta.maxSlots) break;
      if (isOptionalBooster(ruleId)) continue;
      if (!candidates.has(ruleId)) continue;
      take(ruleId);
      phaseCount += 1;
    }
  }

  // One personalized booster when there is room (exercise flow or warrior psych framing).
  for (const ruleId of OPTIONAL_BOOSTER_RULES) {
    if (selected.length >= limit) break;
    take(ruleId);
  }

  // Reschedule within each phase after curation.
  const phaseOrder = Object.keys(PHASE_RULE_ORDER);
  selected.sort(
    (a, b) => phaseOrder.indexOf(a.phaseKey) - phaseOrder.indexOf(b.phaseKey)
      || PHASE_RULE_ORDER[a.phaseKey].indexOf(a.taskId) - PHASE_RULE_ORDER[b.phaseKey].indexOf(b.taskId),
  );

  const phaseIndexes = {};
  return selected.map((task) => {
    const idx = phaseIndexes[task.phaseKey] || 0;
    phaseIndexes[task.phaseKey] = idx + 1;
    const { phaseKey, ...rest } = task;
    return {
      ...rest,
      scheduledTimeRelative: scheduleTime(task.phaseKey, idx, wake, sleep),
    };
  });
}

export function inferExerciseRoutineFromAssessment(answers = {}) {
  const value = answers[17] ?? answers['17'];
  if (!value) return false;
  const v = String(value).trim().toLowerCase();
  return v === 'strongly agree' || v === 'agree';
}

export function buildElevatePlan(matrix = {}) {
  const normalizedTier = normalizeTierKey(matrix.current_tier);
  const tierLabel = tierTitle(matrix.current_tier);

  const tierDurations = rulesMatrixDoc.tierDurations || {};
  const duration = tierDurations[tierLabel]
    ?? (normalizedTier === 'SUPERHERO' ? 21 : 7);

  const idx = TIER_ORDER.indexOf(normalizedTier);
  const nextTier = TIER_ORDER[Math.min(idx + 1, TIER_ORDER.length - 1)];

  const wake = parseTime(matrix.wake_time) ?? 6 * 60 + 30;
  let sleep = parseTime(matrix.sleep_time) ?? 22 * 60 + 30;
  if (sleep <= wake) sleep = wake + 15 * 60;

  const user = {
    ...matrix,
    current_tier: normalizedTier,
    hasExerciseRoutine: matrix.hasExerciseRoutine ?? inferExerciseRoutineFromAssessment(matrix.assessmentAnswers),
    exerciseType: matrix.exerciseType || 'general_exercise',
  };

  const rulesMatrix = rulesMatrixDoc.rulesMatrix || {};
  const phaseOrder = ['morningPhase', 'afternoonPhase', 'eveningPhase'];
  const candidates = buildCandidateTasks(rulesMatrix, user);
  const dailyTasks = curateDailyTasks(candidates, wake, sleep, DAILY_TASK_LIMIT);

  if (dailyTasks.length === 0) {
    throw new Error('No matching plan tasks for your profile. Check age, tier, and food preference.');
  }

  const planTitle = `${duration}-Day Success Identity Transition (${capitalize(normalizedTier)} → ${capitalize(nextTier)})`;

  return {
    planTitle,
    macroGoalDurationDays: duration,
    dailyTasks,
    meta: {
      engineVersion: rulesMatrixDoc.engineMeta?.version || '2.0.0',
      tier: tierLabel,
      phases: phaseOrder.map((key) => rulesMatrix[key]?.phaseName).filter(Boolean),
    },
  };
}

export default buildElevatePlan;
