import AsyncStorage from '@react-native-async-storage/async-storage';
import psychologicalTips from '../../assets/psychologicaltips.json';

const STORAGE_PREFIX = 'daily_oracle';

const TIPS_BY_ID = Object.fromEntries(
  (Array.isArray(psychologicalTips) ? psychologicalTips : []).map((t) => [t.id, t]),
);

let oracleResolveCache = { userId: null, dateKey: null, result: null };

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function storageKey(userId, date = new Date()) {
  return `${STORAGE_PREFIX}_${userId}_${todayKey(date)}`;
}

function stableIndex(seed, len) {
  if (len <= 0) return 0;
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) {
    h = ((h << 5) - h) + seed.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h) % len;
}

export function getDailyTip(userId, date = new Date()) {
  const tips = Array.isArray(psychologicalTips) ? psychologicalTips : [];
  if (tips.length === 0) return null;
  const seed = `${userId || 'guest'}_${todayKey(date)}`;
  return tips[stableIndex(seed, tips.length)];
}

export async function getOracleState(userId, date = new Date()) {
  if (!userId) return { absorbed: false, tipId: null };
  try {
    const raw = await AsyncStorage.getItem(storageKey(userId, date));
    if (!raw) return { absorbed: false, tipId: null };
    const parsed = JSON.parse(raw);
    return {
      absorbed: Boolean(parsed.absorbed),
      tipId: parsed.tipId || null,
    };
  } catch {
    return { absorbed: false, tipId: null };
  }
}

export async function markOracleAbsorbed(userId, tipId, date = new Date()) {
  if (!userId) return;
  await AsyncStorage.setItem(
    storageKey(userId, date),
    JSON.stringify({
      absorbed: true,
      tipId,
      absorbedAt: date.toISOString(),
    }),
  );
  oracleResolveCache = { userId: null, dateKey: null, result: null };
}

/**
 * Resolves whether Better You Tips should render expanded, collapsed, or hidden.
 */
export async function resolveDailyOracle(userId, date = new Date()) {
  const dk = todayKey(date);
  if (
    oracleResolveCache.userId === userId
    && oracleResolveCache.dateKey === dk
    && oracleResolveCache.result
  ) {
    return oracleResolveCache.result;
  }

  const tip = getDailyTip(userId, date);
  if (!tip) return { mode: null, tip: null };

  const state = await getOracleState(userId, date);

  let result;
  if (state.absorbed) {
    const absorbedTip = state.tipId ? (TIPS_BY_ID[state.tipId] || tip) : tip;
    result = { mode: 'collapsed', tip: absorbedTip };
  } else {
    result = { mode: 'expanded', tip };
  }

  oracleResolveCache = { userId, dateKey: dk, result };
  return result;
}
