// Rule-based "Elevate Yourself" plan generator.
//
// Builds a customized daily goal plan from the user's input matrix WITHOUT any
// AI / external API. The output shape matches what createElevateGoal expects:
//   { planTitle, macroGoalDurationDays, dailyTasks: [{ taskId, taskTitle,
//     timeWindow, scheduledTimeRelative, psychologicalJustification }] }
//
// Personalization comes from: current tier (which transition the plan targets),
// the user's weakest parameter, food preference, and their actual wake/sleep
// schedule (task times are computed relative to those).

const TIER_ORDER = ['SURVIVOR', 'SOLDIER', 'WARRIOR', 'SUPERHERO'];
const TIER_DAYS = { SURVIVOR: 7, SOLDIER: 14, WARRIOR: 21, SUPERHERO: 21 };

const PLAN_TITLES = {
  SURVIVOR: 'Physiological Stabilization Loop',
  SOLDIER: 'Habit Automation Loop',
  WARRIOR: 'Peak Performance Loop',
  SUPERHERO: 'Mastery Maintenance Loop',
};

// --- Time helpers ---------------------------------------------------------

// Parses "06:30", "6:30 AM", "18:00", "6 PM" -> minutes since midnight.
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

function foodKind(pref) {
  const p = String(pref || '').toLowerCase();
  if (p.includes('vegan')) return 'vegan';
  if (p.includes('non')) return 'nonveg';
  if (p.includes('veg')) return 'veg';
  return 'any';
}

function nutritionTask(kind, atMin, audience) {
  const map = {
    vegan: 'Eat a warm, plant-protein lunch (lentils, tofu, or beans) with cooked greens',
    veg: 'Eat a warm, easy-digest vegetarian lunch with paneer or legumes and cooked greens',
    nonveg: 'Eat a lean-protein lunch (eggs, fish, or chicken) with vegetables',
    any: 'Eat a balanced, protein-forward lunch with vegetables',
  };
  return {
    taskId: 'midday_nutrition_anchor',
    taskTitle: map[kind] || map.any,
    timeWindow: 'Afternoon',
    scheduledTimeRelative: formatTime(atMin),
    psychologicalJustification: `An anti-inflammatory, protein-forward midday meal keeps blood sugar steady and prevents the afternoon energy crash${audience ? ` for ${audience}` : ''}.`,
  };
}

// Targeted task addressing the user's lowest-scoring parameter.
function weakestParamTask(label, wake) {
  const byLabel = {
    'Bio-Energy Balance': {
      taskId: 'bioenergy_breakfast',
      taskTitle: 'Eat a protein + fiber breakfast within 60 minutes of waking',
      timeWindow: 'Morning',
      at: wake + 45,
      why: 'Early, balanced fuel stabilizes blood sugar and rebuilds your bio-energy reserve, your weakest area.',
    },
    'Cognitive Performance': {
      taskId: 'single_task_focus_drill',
      taskTitle: 'Do one 15-minute single-task focus block with the phone in another room',
      timeWindow: 'Afternoon',
      at: wake + 360,
      why: 'Distraction-free reps directly train the cognitive performance you scored lowest on.',
    },
    'Goal-Pursuit Readiness': {
      taskId: 'priority_first_action',
      taskTitle: 'Write your #1 priority for the day and take the first small step before anything else',
      timeWindow: 'Morning',
      at: wake + 30,
      why: 'Acting on your top priority first builds the goal-pursuit momentum you currently lack.',
    },
    'Physical Base Asset': {
      taskId: 'mobility_routine',
      taskTitle: 'Do a 5-minute mobility and stretch routine',
      timeWindow: 'Morning',
      at: wake + 50,
      why: 'Daily gentle movement rebuilds the physical base that scored lowest, without overstretching you.',
    },
    'Stress & Anxiety Resistance': {
      taskId: 'box_breathing',
      taskTitle: 'Practice box breathing (inhale 4, hold 4, exhale 4, hold 4) for 5 minutes',
      timeWindow: 'Afternoon',
      at: wake + 420,
      why: 'Paced breathing down-regulates the nervous system and builds the stress resistance you scored lowest on.',
    },
  };
  const t = byLabel[label];
  if (!t) return null;
  return {
    taskId: t.taskId,
    taskTitle: t.taskTitle,
    timeWindow: t.timeWindow,
    scheduledTimeRelative: formatTime(t.at),
    psychologicalJustification: t.why,
  };
}

// --- Per-tier base routines ----------------------------------------------

function survivorTasks(wake, sleep, kind, audience) {
  return [
    {
      taskId: 'hydration_first',
      taskTitle: 'Drink a full glass of water before anything else',
      timeWindow: 'Morning',
      scheduledTimeRelative: formatTime(wake + 5),
      psychologicalJustification: 'Rehydrating on waking restarts basic metabolism with zero friction.',
    },
    {
      taskId: 'morning_daylight_anchor',
      taskTitle: 'Step into natural daylight for 10 minutes',
      timeWindow: 'Morning',
      scheduledTimeRelative: formatTime(wake + 15),
      psychologicalJustification: 'Morning light locks your circadian cortisol rhythm so sleep and energy can stabilize.',
    },
    {
      taskId: 'gentle_walk',
      taskTitle: 'Take a slow, easy 10-minute walk',
      timeWindow: 'Morning',
      scheduledTimeRelative: formatTime(wake + 60),
      psychologicalJustification: 'Light movement regulates the nervous system without the fatigue of a hard workout.',
    },
    nutritionTask(kind, wake + 360, audience),
    {
      taskId: 'screen_curfew',
      taskTitle: 'Switch off screens and dim the lights',
      timeWindow: 'Evening',
      scheduledTimeRelative: formatTime(sleep - 45),
      psychologicalJustification: 'Cutting blue light before bed lets melatonin rise so your body can finally restore.',
    },
    {
      taskId: 'gratitude_one_line',
      taskTitle: 'Write one line of gratitude before sleep',
      timeWindow: 'Evening',
      scheduledTimeRelative: formatTime(sleep - 90),
      psychologicalJustification: 'A single positive reflection calms the mind and improves sleep onset.',
    },
  ];
}

function soldierTasks(wake, sleep, kind, audience) {
  return [
    {
      taskId: 'morning_daylight_anchor',
      taskTitle: 'Get 10 minutes of daylight and a cold water splash on the face',
      timeWindow: 'Morning',
      scheduledTimeRelative: formatTime(wake + 15),
      psychologicalJustification: 'A consistent morning anchor automates alertness so you stop relying on willpower.',
    },
    {
      taskId: 'moderate_movement',
      taskTitle: 'Do a 20-minute brisk walk or light bodyweight workout',
      timeWindow: 'Morning',
      scheduledTimeRelative: formatTime(wake + 75),
      psychologicalJustification: 'Moderate movement builds a proactive energy buffer for the rest of the day.',
    },
    nutritionTask(kind, wake + 330, audience),
    {
      taskId: 'energy_buffer_snack',
      taskTitle: 'Have a small protein snack to pre-empt the afternoon dip',
      timeWindow: 'Afternoon',
      scheduledTimeRelative: formatTime(wake + 480),
      psychologicalJustification: 'A timed buffer prevents the post-lunch crash before it starts.',
    },
    {
      taskId: 'cognitive_journal',
      taskTitle: 'Spend 5 minutes journaling what drained and energized you today',
      timeWindow: 'Evening',
      scheduledTimeRelative: formatTime(sleep - 90),
      psychologicalJustification: 'Cognitive journaling builds self-awareness and mental momentum.',
    },
    {
      taskId: 'proactive_gratitude',
      taskTitle: 'Log three things you are grateful for',
      timeWindow: 'Evening',
      scheduledTimeRelative: formatTime(sleep - 60),
      psychologicalJustification: 'Proactive gratitude trains an optimistic baseline that compounds over weeks.',
    },
  ];
}

function warriorTasks(wake, sleep, kind, audience) {
  return [
    {
      taskId: 'deep_framing',
      taskTitle: 'Do a 10-minute morning visualization of your day and identity',
      timeWindow: 'Morning',
      scheduledTimeRelative: formatTime(wake + 20),
      psychologicalJustification: 'Early deep framing primes focus and aligns actions with your peak-performance identity.',
    },
    {
      taskId: 'high_intensity_training',
      taskTitle: 'Complete a 30–45 minute resistance or high-intensity workout',
      timeWindow: 'Morning',
      scheduledTimeRelative: formatTime(wake + 90),
      psychologicalJustification: 'Structured intense training drives the biological optimization a Superhero tier demands.',
    },
    nutritionTask(kind, wake + 300, audience),
    {
      taskId: 'deep_work_block',
      taskTitle: 'Protect one 90-minute deep-work block with no notifications',
      timeWindow: 'Afternoon',
      scheduledTimeRelative: formatTime(wake + 420),
      psychologicalJustification: 'A daily deep-work block converts effort into measurable peak output.',
    },
    {
      taskId: 'sleep_hygiene_environment',
      taskTitle: 'Set the room cool and dark and stop screens for the night',
      timeWindow: 'Evening',
      scheduledTimeRelative: formatTime(sleep - 60),
      psychologicalJustification: 'Strict environmental sleep hygiene maximizes recovery for the next performance day.',
    },
    {
      taskId: 'recovery_journal',
      taskTitle: 'Review one win and one lesson, then plan tomorrow’s priority',
      timeWindow: 'Evening',
      scheduledTimeRelative: formatTime(sleep - 90),
      psychologicalJustification: 'Closing the loop each night sustains momentum and manages secondary stressors.',
    },
  ];
}

const TIER_BUILDERS = {
  SURVIVOR: survivorTasks,
  SOLDIER: soldierTasks,
  WARRIOR: warriorTasks,
  SUPERHERO: warriorTasks,
};

// --- Public API -----------------------------------------------------------

export function buildElevatePlan(matrix = {}) {
  const tier = String(matrix.current_tier || 'SURVIVOR').toUpperCase();
  const normalizedTier = TIER_ORDER.includes(tier) ? tier : 'SURVIVOR';

  const duration = TIER_DAYS[normalizedTier] || 7;
  const idx = TIER_ORDER.indexOf(normalizedTier);
  const nextTier = TIER_ORDER[Math.min(idx + 1, TIER_ORDER.length - 1)];

  // Default schedule: 6:30 AM wake, 10:30 PM sleep when not provided.
  const wake = parseTime(matrix.wake_time) ?? 6 * 60 + 30;
  let sleep = parseTime(matrix.sleep_time) ?? 22 * 60 + 30;
  // If sleep parses before wake (e.g. 11 PM stored as 23:00 is fine, but a bad
  // value), keep evening tasks sensible by ensuring sleep is after wake.
  if (sleep <= wake) sleep = wake + 15 * 60;

  const kind = foodKind(matrix.food_preference);
  const ageNum = Number(matrix.age);
  const audience = Number.isFinite(ageNum) && ageNum > 0
    ? `a ${ageNum}-year-old ${matrix.food_preference ? String(matrix.food_preference).toLowerCase() : 'person'}`
    : (matrix.food_preference ? `a ${String(matrix.food_preference).toLowerCase()} routine` : '');

  const builder = TIER_BUILDERS[normalizedTier] || survivorTasks;
  const dailyTasks = builder(wake, sleep, kind, audience);

  // Insert a task targeting the weakest parameter, de-duplicating by taskId.
  const weak = weakestParamTask(matrix.lowest_parameter, wake);
  if (weak && !dailyTasks.some((t) => t.taskId === weak.taskId)) {
    dailyTasks.splice(1, 0, weak);
  }

  const planTitle = `${duration}-Day ${PLAN_TITLES[normalizedTier]} (${capitalize(normalizedTier)} → ${capitalize(nextTier)})`;

  return {
    planTitle,
    macroGoalDurationDays: duration,
    dailyTasks,
  };
}

function capitalize(s) {
  const str = String(s || '').toLowerCase();
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default buildElevatePlan;
