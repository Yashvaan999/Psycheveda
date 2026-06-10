// Success Identity scoring engine.
// Ingests the 30 Likert responses from the Gut-Brain "Plan" questionnaire and
// returns score vectors, an overall percentage, the assigned master tier, and a
// pre-formatted unified parameter chart.

const TOTAL_QUESTIONS = 30;

// Questions whose agreement is a positive signal. Everything else is a
// biochemical / psychological "drainer" and has its scoring inverted.
const POSITIVE_ENABLERS = new Set([1, 2, 3, 7, 12, 14, 15, 17, 18, 25, 27]);

// Canonical Likert value -> base score (enabler orientation). Drainers invert.
const BASE_SCORE = {
  'strongly agree': 2,
  agree: 1,
  neutral: 0,
  disagree: -1,
  'strongly disagree': -2,
};

// Sub-parameter vector definitions. Each entry lists the question ids that feed
// the vector. Vector C additionally folds in the aggregated enabler average.
const VECTORS = [
  { code: 'A', key: 'bioEnergy', label: 'Bio-Energy Balance', questions: [9, 10, 11, 13, 16, 20] },
  { code: 'B', key: 'cognitive', label: 'Cognitive Performance', questions: [2, 3, 12, 14, 19, 28] },
  { code: 'C', key: 'goalReadiness', label: 'Goal-Pursuit Readiness', questions: [1, 7, 27], enablerAverage: true },
  { code: 'D', key: 'physicalAsset', label: 'Physical Base Asset', questions: [8, 17, 23, 24, 25, 26] },
  { code: 'E', key: 'stressResistance', label: 'Stress & Anxiety Resistance', questions: [4, 5, 6, 15, 21, 22, 29, 30] },
];

export const IDENTITY_STAGES = [
  {
    order: 1,
    name: 'SURVIVOR',
    title: 'Survivor',
    subtitle: 'Unconscious Creation & Resource Depletion',
    body:
      'The Survivor stage represents a state of complete biological and emotional bankruptcy. Operating in a chronic sympathetic nervous system loop (fight-or-flight), the body enters a protective "self-preservation mode" to preserve basic homeostatic functions. This manifests as intense brain fog, sugar cravings, daily energy crashes, and high systemic stress. Because physical energy is completely depleted, the brain actively hoards its resources, making it incredibly difficult to find the motivation or cognitive clarity needed to pursue personal, career, or financial goals.',
  },
  {
    order: 2,
    name: 'SOLDIER',
    title: 'Soldier',
    subtitle: 'Unconscious Creation & Willpower Overuse',
    body:
      'The Soldier stage defines an individual who is functional but deeply depleted. While Soldiers successfully execute their daily routines and get things done, they do so by forcing themselves forward through grueling, unsustainable willpower. This constant friction over-relies on psychological drive while ignoring baseline physical exhaustion, leading to common mid-afternoon crashes, mood swings, and a high vulnerability to stress or external criticism. The system operates on artificial adrenaline and stimulants, leaving the individual just one unexpected obstacle away from total burnout.',
  },
  {
    order: 3,
    name: 'WARRIOR',
    title: 'Warrior',
    subtitle: 'Conscious Creation & Variable Balance',
    body:
      'The Warrior stage marks the transition into conscious awareness, intentional lifestyle design, and active ambition. Warriors possess a strong internal sense of purpose, upright physical confidence, and solid histories of achieving the goals they set for themselves. However, they are still actively learning how to perfectly balance mental psychological drive with steady, predictable biochemistry. Because their energy resources still fluctuate, they suffer from occasional erratic energy spikes and sudden burnout phases when their physical engine fails to keep pace with their high mental standards.',
  },
  {
    order: 4,
    name: 'SUPERHERO',
    title: 'Superhero',
    subtitle: 'Conscious Creation & Optimal Flow',
    body:
      'The Superhero stage is the ultimate destination of total mind-body integration and unstoppable execution. In this peak performance state, actions flow natively and consistently without requiring heavy cognitive friction or forced willpower. Superheroes enjoy maximum cognitive processing clarity, exceptional adaptive resilience to changing environments, and highly balanced bio-energetic resources. Because their physical and mental systems operate in perfect unison, they achieve complex milestones with ease, though they must periodically audit their high drive to prevent environmental over-extension.',
  },
];

const TIERS = IDENTITY_STAGES.map((stage, index) => ({
  name: stage.name,
  max: index < IDENTITY_STAGES.length - 1 ? (index + 1) * 25 : Infinity,
  description: stage.subtitle,
}));

export function stageIndexForTier(tierName) {
  const idx = IDENTITY_STAGES.findIndex((s) => s.name === String(tierName || '').toUpperCase());
  return idx >= 0 ? idx : 0;
}

function normalizeValue(value) {
  if (value == null) return null;
  const v = String(value).trim().toLowerCase();
  return v in BASE_SCORE ? v : null;
}

// Weighted score for a single question in the range [-2, +2].
// Missing/unexpected answers fall back to neutral (0) instead of breaking.
function scoreFor(questionId, value, validRef) {
  const v = normalizeValue(value);
  if (v === null) return 0;
  if (validRef) validRef.count += 1;
  const base = BASE_SCORE[v];
  return POSITIVE_ENABLERS.has(questionId) ? base : -base;
}

// Convert a set of component scores (each in [-2, +2]) into a 0-100% where
// 50% is the neutral midpoint.
function toPercentage(scores) {
  const n = scores.length;
  if (n === 0) return 50;
  const sum = scores.reduce((a, b) => a + b, 0);
  const min = -2 * n;
  const max = 2 * n;
  return Math.round(((sum - min) / (max - min)) * 100);
}

function tierFor(percentage) {
  return TIERS.find((t) => percentage < t.max) || TIERS[TIERS.length - 1];
}

function bar(percentage, width = 24) {
  const filled = Math.max(0, Math.min(width, Math.round((percentage / 100) * width)));
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

function pad(str, len) {
  const s = String(str);
  return s.length >= len ? s : s + ' '.repeat(len - s.length);
}

function buildUnifiedGraph(subList, overall, tier) {
  const labelWidth = Math.max(...subList.map((s) => s.label.length)) + 2;
  const lines = [];
  lines.push('╔══════════════════════════════════════════════════════════╗');
  lines.push('   SUCCESS IDENTITY  ·  UNIFIED PARAMETER MAP');
  lines.push('   0%' + ' '.repeat(labelWidth + 9) + '50%' + ' '.repeat(8) + '100%');
  lines.push('   ' + '─'.repeat(54));
  subList.forEach((s) => {
    lines.push(`   ${s.code}  ${pad(s.label, labelWidth)} ${bar(s.percentage)} ${pad(s.percentage + '%', 4)}`);
  });
  lines.push('   ' + '─'.repeat(54));
  lines.push(`   OVERALL  ${bar(overall)} ${overall}%`);
  lines.push(`   IDENTITY TIER  →  ${tier.name}`);
  lines.push('   ' + tier.description);
  lines.push('╚══════════════════════════════════════════════════════════╝');
  return lines.join('\n');
}

/**
 * Calculate the user's Success Identity from their questionnaire responses.
 *
 * @param {Array<{questionId:number, value:string}>} userResponses
 * @returns {{
 *   overallPercentage: number,
 *   assignedTier: string,
 *   tierDescription: string,
 *   subParameters: Object<string, number>,
 *   unifiedGraph: string,
 *   meta: { responsesParsed: number, complete: boolean }
 * }}
 */
export function calculateSuccessIdentity(userResponses) {
  if (!Array.isArray(userResponses)) {
    throw new TypeError('calculateSuccessIdentity expects an array of responses.');
  }

  // Build a questionId -> value lookup, tolerating odd entries.
  const byId = {};
  for (const r of userResponses) {
    if (r && r.questionId != null) byId[Number(r.questionId)] = r.value;
  }

  const validRef = { count: 0 };

  // Per-question weighted scores for all 30 questions (neutral fallback).
  const scores = {};
  for (let id = 1; id <= TOTAL_QUESTIONS; id += 1) {
    scores[id] = scoreFor(id, byId[id], validRef);
  }

  // Aggregated enabler average (a single component in [-2, +2]) for Vector C.
  const enablerIds = [...POSITIVE_ENABLERS];
  const enablerAverage =
    enablerIds.reduce((sum, id) => sum + scores[id], 0) / enablerIds.length;

  const subParameters = {};
  const subList = VECTORS.map((vec) => {
    const components = vec.questions.map((id) => scores[id]);
    if (vec.enablerAverage) components.push(enablerAverage);
    const percentage = toPercentage(components);
    subParameters[vec.key] = percentage;
    return { code: vec.code, label: vec.label, key: vec.key, percentage };
  });

  const overallPercentage = Math.round(
    subList.reduce((sum, s) => sum + s.percentage, 0) / subList.length
  );

  const tier = tierFor(overallPercentage);
  const unifiedGraph = buildUnifiedGraph(subList, overallPercentage, tier);

  return {
    overallPercentage,
    assignedTier: tier.name,
    tierDescription: tier.description,
    subParameters,
    unifiedGraph,
    meta: {
      responsesParsed: validRef.count,
      complete: validRef.count === TOTAL_QUESTIONS,
    },
  };
}

export default calculateSuccessIdentity;
