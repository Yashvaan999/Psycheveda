import { supabase } from './supabase';
import { buildElevatePlan } from './elevatePlan';
import { analyzeElevateSubTasks, analyzeManualDays } from './completionProbability';
import {
  effectiveVedaStreak,
  nextVedaStreakOnActivity,
  resolveVedaStreak,
} from './vedaStreak';
import {
  filterElevateContent,
  parseEntitlement,
} from './resetSubscription';
import { todayIso } from './utils';

const PILLAR_LABELS = {
  family_relationship: 'Family & Relationship',
  career_business: 'Career & Business',
  finance_money: 'Finance & Money',
  health: 'Health',
  inner_wellness: 'Inner Wellness',
};

const DASHBOARD_CACHE_MS = 4000;
let dashboardCache = { at: 0, data: null };

export function invalidateDashboardCache() {
  dashboardCache = { at: 0, data: null };
}

/** Read `{ error }` from Edge Function non-2xx responses (Supabase hides it in `error.context`). */
async function invokeEdgeFunction(name, body) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Please log in again to continue checkout.');
  }

  const { data, error } = await supabase.functions.invoke(name, {
    body,
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (data?.error) throw new Error(data.error);
  if (error) {
    let msg = error.message;
    let status = null;
    try {
      const res = error.context;
      status = res?.status ?? null;
      if (res?.json) {
        const parsed = await res.json();
        if (parsed?.error) msg = parsed.error;
        if (parsed?.code === 401 && parsed?.message && !parsed?.error) {
          msg = parsed.message;
        }
      }
    } catch { /* use default msg */ }
    if (status === 401 && msg?.includes('JWT')) {
      throw new Error('Session expired. Log out and log in again on this site.');
    }
    throw new Error(msg || `Could not call ${name}`);
  }
  return data;
}

async function applyBlessStreakUpdate(userId) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('veda_streak, last_activity_date')
    .eq('id', userId)
    .single();
  if (!profile) return;
  const today = todayIso();
  const next = nextVedaStreakOnActivity(profile.veda_streak, profile.last_activity_date, today);
  await supabase.from('profiles')
    .update({ veda_streak: next, last_activity_date: today })
    .eq('id', userId);
}

function streakFromProfile(profile) {
  if (!profile) return 0;
  return effectiveVedaStreak(profile.veda_streak, profile.last_activity_date);
}

export const api = {
  register: async ({ email, password, full_name }) => {
    const { data, error } = await supabase.auth.signUp({
      email, password, options: { data: { full_name } },
    });
    if (error) throw error;
    return { token: data.session?.access_token, user: data.user };
  },

  login: async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return { token: data.session?.access_token, user: data.user };
  },

  me: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  fetchProfile: async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, onboarding_complete, bless_points_balance, veda_streak, last_activity_date, selected_pillars')
      .eq('id', userId)
      .single();
    if (!data) return {};
    const { effective, shouldResetStored } = resolveVedaStreak(data.veda_streak, data.last_activity_date);
    if (shouldResetStored) {
      await supabase.from('profiles').update({ veda_streak: 0 }).eq('id', userId);
    }
    return { ...data, veda_streak: effective };
  },

  listPillars: async () => [
    { key: 'family_relationship', label: 'Family & Relationship' },
    { key: 'career_business', label: 'Career & Business' },
    { key: 'finance_money', label: 'Finance & Money' },
    { key: 'health', label: 'Health' },
    { key: 'inner_wellness', label: 'Inner Wellness' },
  ],

  suggestions: async (pillar) => {
    const SUGGESTIONS = {
      family_relationship: [
        'Hold a 20-minute screen-free conversation with my partner daily',
        'Write one appreciation note to a family member each week',
        'Schedule a recurring Sunday family ritual (meal or walk)',
        'Resolve a long-pending miscommunication with a sibling',
        'Plan and host a small family gathering within the timeframe',
      ],
      career_business: [
        'Ship one meaningful deliverable that stretches my comfort zone',
        'Build a focused learning loop in a high-leverage skill',
        'Network intentionally with 3 mentors or peers each week',
        'Publish a portfolio piece or thought-leadership article',
        'Map and pitch a new revenue stream or initiative',
      ],
      finance_money: [
        'Track every rupee/dollar of spending into a clean ledger',
        'Cut three recurring expenses and redirect into savings',
        'Open and fund a dedicated emergency reserve',
        'Begin a small, consistent investing habit (SIP/DCA)',
        'Read one personal-finance book and apply 3 lessons',
      ],
      health: [
        'Walk 8,000 steps every day with intent',
        'Sleep before 11pm and wake by sunrise consistently',
        'Cook at least one whole-food meal daily',
        'Complete a 30-minute movement practice (yoga/strength)',
        'Hydrate to 2.5L per day and cut sugary drinks',
      ],
      inner_wellness: [
        'Practice 10 minutes of stillness meditation each morning',
        'Maintain a daily gratitude entry of three blessings',
        'Take a weekly digital sabbath for 4 hours',
        'Read 10 pages of a wisdom/scripture text daily',
        'Perform a weekly self-reflection retrospective',
      ],
    };
    return { suggestions: SUGGESTIONS[pillar] || [] };
  },

  setSelectedPillars: async (pillars) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.email.split('@')[0],
      selected_pillars: pillars,
      onboarding_complete: true,
    }, { onConflict: 'id' });
    if (error) throw error;
    return { success: true };
  },

  createGoal: async (data) => {
    const { data: { user } } = await supabase.auth.getUser();
    const deadline = new Date();
    const totalDays = data.estimate_unit === 'days'
      ? Number(data.estimate_value)
      : Math.ceil(Number(data.estimate_value) / 24);
    if (data.estimate_unit === 'days') {
      deadline.setDate(deadline.getDate() + totalDays);
    } else {
      deadline.setHours(deadline.getHours() + Number(data.estimate_value));
    }
    const payload = {
      user_id: user.id,
      pillar: data.pillar,
      title: data.title,
      estimate_unit: data.estimate_unit,
      estimate_value: Number(data.estimate_value),
      deadline_at: deadline.toISOString(),
    };
    if (data.notes !== undefined) payload.notes = data.notes;
    const { data: goal, error } = await supabase
      .from('goals')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;

    const tasks = [];
    for (let i = 0; i < Math.min(totalDays, 365); i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      tasks.push({
        goal_id: goal.id,
        title: `Day ${i + 1}: ${data.title}`,
        scheduled_for: d.toISOString().slice(0, 10),
      });
    }
    if (tasks.length > 0) await supabase.from('mini_tasks').insert(tasks);
    return goal;
  },

  listGoals: async () => {
    const { data, error } = await supabase
      .from('goals')
      .select('id, title, pillar, source, estimate_unit, estimate_value, created_at, deadline_at')
      .order('created_at', { ascending: false });
    if (error) throw error;

    return (data || []).map((g) => {
      const totalDays = g.estimate_unit === 'days'
        ? g.estimate_value
        : Math.ceil(g.estimate_value / 24);
      return {
        ...g,
        pillar_label: PILLAR_LABELS[g.pillar] || g.pillar,
        mini_tasks: [],
        progress_log_count: 0,
        total_days: totalDays,
      };
    });
  },

  fetchDashboard: async ({ force = false } = {}) => {
    const now = Date.now();
    if (!force && dashboardCache.data && now - dashboardCache.at < DASHBOARD_CACHE_MS) {
      return dashboardCache.data;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const empty = { goals: [], tasks: [], stats: {} };
      dashboardCache = { at: now, data: empty };
      return empty;
    }

    const today = new Date().toISOString().slice(0, 10);
    const [goalsRes, tasksRes, profileRes, journalRes, gratitudeRes, resetEnt] = await Promise.all([
      supabase
        .from('goals')
        .select('id, title, pillar, source, estimate_unit, estimate_value, created_at, deadline_at')
        .order('created_at', { ascending: false }),
      supabase
        .from('mini_tasks')
        .select('id, title, completed, source, time_window, scheduled_time')
        .eq('scheduled_for', today),
      supabase.from('profiles').select('bless_points_balance, veda_streak, last_activity_date').eq('id', user.id).single(),
      supabase.from('journal_entries').select('id').eq('user_id', user.id).eq('entry_date', today),
      supabase.from('gratitude_entries').select('id').eq('user_id', user.id).eq('entry_date', today),
      api.getResetEntitlement(),
    ]);

    if (goalsRes.error) throw goalsRes.error;
    if (tasksRes.error) throw tasksRes.error;

    const entitled = resetEnt.entitled;

    const payload = {
      goals: filterElevateContent((goalsRes.data || []).map((g) => {
        const totalDays = g.estimate_unit === 'days'
          ? g.estimate_value
          : Math.ceil(g.estimate_value / 24);
        return {
          ...g,
          pillar_label: PILLAR_LABELS[g.pillar] || g.pillar,
          mini_tasks: [],
          progress_log_count: 0,
          total_days: totalDays,
        };
      }), entitled),
      tasks: filterElevateContent(tasksRes.data || [], entitled),
      stats: {
        bless_points_balance: profileRes.data?.bless_points_balance || 0,
        veda_streak: streakFromProfile(profileRes.data),
        journal_entries_today: journalRes.data?.length || 0,
        gratitude_logged_today: (gratitudeRes.data?.length || 0) > 0,
        reset_entitled: entitled,
        reset_days_remaining: resetEnt.days_remaining || 0,
        reset_period_end: resetEnt.current_period_end || null,
      },
    };

    dashboardCache = { at: now, data: payload };
    return payload;
  },

  goalTrackingData: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: goals, error } = await supabase
      .from('goals')
      .select('id, title, pillar, source, estimate_unit, estimate_value, created_at, deadline_at')
      .order('created_at', { ascending: false });
    if (error) throw error;

    const today = new Date().toISOString().slice(0, 10);
    const goalList = goals || [];
    const goalIds = goalList.map((g) => g.id);

    let logsByGoal = {};
    try {
      const { data: logs } = await supabase
        .from('goal_progress_logs')
        .select('goal_id, entry_date')
        .eq('user_id', user.id);
      for (const log of (logs || [])) {
        if (!logsByGoal[log.goal_id]) logsByGoal[log.goal_id] = new Set();
        logsByGoal[log.goal_id].add(log.entry_date);
      }
    } catch { /* table may not exist */ }

    let tasksByGoal = {};
    if (goalIds.length > 0) {
      try {
        const { data: miniTasks } = await supabase
          .from('mini_tasks')
          .select('id, goal_id, title, scheduled_for, completed, time_window, scheduled_time, source')
          .in('goal_id', goalIds)
          .order('scheduled_for', { ascending: true });
        for (const t of (miniTasks || [])) {
          if (!tasksByGoal[t.goal_id]) tasksByGoal[t.goal_id] = [];
          tasksByGoal[t.goal_id].push(t);
        }
      } catch { /* best-effort */ }
    }

    return goalList.map((g) => {
      const totalDays = g.estimate_unit === 'days'
        ? g.estimate_value
        : Math.ceil(g.estimate_value / 24);
      const isElevate = g.source === 'elevate';
      const miniTasks = tasksByGoal[g.id] || [];

      const tracking = isElevate
        ? analyzeElevateSubTasks(miniTasks, today)
        : analyzeManualDays({
          totalDays,
          createdAt: g.created_at,
          logDates: logsByGoal[g.id] || new Set(),
        }, today);

      const dayPoint = totalDays > 0 ? 100 / totalDays : 0;

      return {
        id: g.id,
        title: g.title,
        pillar: g.pillar,
        source: g.source || 'manual',
        isElevate,
        totalDays: tracking.totalDays || totalDays,
        daysElapsed: tracking.daysElapsed,
        daysLogged: tracking.daysLogged,
        probability: tracking.probability,
        timeline: tracking.timeline,
        taskHistory: tracking.taskHistory,
        tasksCompleted: tracking.tasksCompleted,
        tasksMissed: tracking.tasksMissed,
        tasksPending: tracking.tasksPending,
        tasksTotal: tracking.tasksTotal,
        trackingMode: tracking.trackingMode,
        dayPoint,
      };
    });
  },

  getGoal: async (id) => {
    const { data, error } = await supabase
      .from('goals')
      .select('*, mini_tasks(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return {
      ...data,
      pillar_label: PILLAR_LABELS[data.pillar] || data.pillar,
      mini_tasks: data.mini_tasks || [],
    };
  },

  updateGoal: async (id, updates) => {
    const payload = { ...updates };
    if (updates.estimate_value !== undefined && updates.estimate_unit !== undefined) {
      const deadline = new Date();
      if (updates.estimate_unit === 'days') {
        deadline.setDate(deadline.getDate() + Number(updates.estimate_value));
      } else {
        deadline.setHours(deadline.getHours() + Number(updates.estimate_value));
      }
      payload.deadline_at = deadline.toISOString();
      payload.estimate_value = Number(updates.estimate_value);
    }
    const { data, error } = await supabase
      .from('goals').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  deleteGoal: async (id) => {
    const { error } = await supabase.from('goals').delete().eq('id', id);
    if (error) throw error;
  },

  logProgress: async (goalId, note) => {
    const trimmed = (note || '').trim();
    if (!trimmed) throw new Error('Please describe today\'s progress (1-2000 characters).');
    const { data: goal, error: goalErr } = await supabase
      .from('goals')
      .select('source')
      .eq('id', goalId)
      .single();
    if (goalErr) throw goalErr;
    if (goal?.source === 'elevate') {
      throw new Error('Elevate plans use daily mini-tasks on the Dashboard — no progress log needed.');
    }
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('goal_progress_logs')
      .insert({ goal_id: goalId, user_id: user.id, note: trimmed })
      .select().single();
    if (error) throw error;
    // Updating the main task for a day auto-ticks that day's mini-task(s) for
    // this goal, so the user doesn't have to check them off separately on the
    // dashboard.
    try {
      const today = new Date().toISOString().slice(0, 10);
      await supabase
        .from('mini_tasks')
        .update({ completed: true, completed_at: new Date().toISOString() })
        .eq('goal_id', goalId)
        .eq('scheduled_for', today)
        .eq('completed', false);
    } catch { /* best-effort */ }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await applyBlessStreakUpdate(user.id);
    } catch { /* best-effort */ }
    return data;
  },

  updateProgressLog: async (logId, note) => {
    const trimmed = (note || '').trim();
    if (!trimmed) throw new Error('Progress note cannot be empty.');
    const { data, error } = await supabase
      .from('goal_progress_logs')
      .update({ note: trimmed })
      .eq('id', logId)
      .select().single();
    if (error) throw error;
    return data;
  },

  goalReminders: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data: goals, error } = await supabase
      .from('goals')
      .select('id, title, pillar, deadline_at, created_at, source')
      .order('created_at', { ascending: false });
    if (error) throw error;
    const today = new Date().toISOString().slice(0, 10);
    const loggedToday = new Set();
    try {
      const { data: logs } = await supabase
        .from('goal_progress_logs')
        .select('goal_id, entry_date')
        .eq('user_id', user.id)
        .eq('entry_date', today);
      for (const l of (logs || [])) loggedToday.add(l.goal_id);
    } catch { /* table may not exist */ }
    const now = new Date();
    return (goals || [])
      .filter((g) => g.source !== 'elevate')
      .filter((g) => !loggedToday.has(g.id) && (!g.deadline_at || new Date(g.deadline_at) >= now))
      .map((g) => ({
        id: g.id,
        title: g.title,
        pillar: g.pillar,
        pillar_label: PILLAR_LABELS[g.pillar] || g.pillar,
      }));
  },

  listProgressLogs: async (goalId) => {
    const { data: goal, error: goalErr } = await supabase
      .from('goals')
      .select('source')
      .eq('id', goalId)
      .single();
    if (goalErr) throw goalErr;
    if (goal?.source === 'elevate') return [];

    const { data, error } = await supabase
      .from('goal_progress_logs').select('*')
      .eq('goal_id', goalId)
      .order('logged_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  tasksToday: async () => {
    const today = new Date().toISOString().slice(0, 10);
    const [tasksRes, resetEnt] = await Promise.all([
      supabase
        .from('mini_tasks')
        .select('id, title, completed, source, time_window, scheduled_time')
        .eq('scheduled_for', today),
      api.getResetEntitlement(),
    ]);
    if (tasksRes.error) throw tasksRes.error;
    return filterElevateContent(tasksRes.data || [], resetEnt.entitled);
  },

  toggleTask: async (id) => {
    const { data, error } = await supabase
      .from('mini_tasks')
      .update({ completed: true, completed_at: new Date().toISOString() })
      .eq('id', id).select().single();
    if (error) throw error;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('bless_transactions').insert({
        user_id: user.id, delta: 5, reason: 'mini_task_completed', ref_id: id,
      });
      const { data: profile } = await supabase
        .from('profiles').select('bless_points_balance').eq('id', user.id).single();
      if (profile) {
        await supabase.from('profiles')
          .update({ bless_points_balance: (profile.bless_points_balance || 0) + 5 })
          .eq('id', user.id);
      }
      await applyBlessStreakUpdate(user.id);
    } catch { /* best-effort */ }
    return data;
  },

  journalFrames: async () => [
    { key: 'Cause & Effect', desc: 'This happened because of X and that has to be blamed.' },
    { key: 'Result & Excuse', desc: 'Produced a story for X situation to feel mentally free.' },
    { key: 'Mind & Body as One System', desc: 'What the mind holds, body speaks and vice versa.' },
    { key: 'Perception is Projection', desc: "People's judgement of the situation is their voice, not reality." },
    { key: 'Responsibility', desc: 'Dynamic acceptance. I am aware of my thoughtful response.' },
  ],

  createJournal: async (data) => {
    const { data: { user } } = await supabase.auth.getUser();
    const payload = {
      user_id: user.id,
      entry_date: data.entry_date,
      situation: data.situation,
      natural_emotion: data.natural_emotion,
      initial_frame: data.initial_frame || null,
      nlp_frame: data.nlp_frame,
      ease_of_transition: Number(data.ease_of_transition),
      end_feeling: data.end_feeling,
      period: data.period,
    };
    if (data.bless_gratitude) payload.bless_gratitude = data.bless_gratitude;
    const { data: journal, error } = await supabase
      .from('journal_entries').insert(payload).select().single();
    if (error) throw error;
    return journal;
  },

  listJournal: async (opts = {}) => {
    const { limit, from, to } = opts;
    let query = supabase
      .from('journal_entries')
      .select('*')
      .order('created_at', { ascending: false });
    if (from) query = query.gte('entry_date', from);
    if (to) query = query.lte('entry_date', to);
    if (limit) query = query.limit(limit);
    const { data, error } = await query;
    if (error) throw error;
    const grouped = {};
    for (const entry of (data || [])) {
      const date = entry.entry_date;
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(entry);
    }
    return Object.entries(grouped)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, entries]) => ({ date, entries }));
  },

  createGratitude: async (data) => {
    const { data: { user } } = await supabase.auth.getUser();
    const payload = {
      user_id: user.id,
      entry_date: data.entry_date,
      point_1: data.point_1,
      point_2: data.point_2,
      point_3: data.point_3,
    };
    const { data: gratitude, error } = await supabase
      .from('gratitude_entries').insert(payload).select().single();
    if (error) throw error;
    try {
      await supabase.from('bless_transactions').insert({
        user_id: user.id, delta: 15, reason: 'gratitude_ritual', ref_id: gratitude.id,
      });
      const { data: profile } = await supabase
        .from('profiles').select('bless_points_balance').eq('id', user.id).single();
      if (profile) {
        await supabase.from('profiles')
          .update({ bless_points_balance: (profile.bless_points_balance || 0) + 15 })
          .eq('id', user.id);
      }
      await applyBlessStreakUpdate(user.id);
    } catch { /* best-effort */ }
    return gratitude;
  },

  listGratitude: async (opts = {}) => {
    const { limit, from, to } = opts;
    let query = supabase
      .from('gratitude_entries')
      .select('*')
      .order('created_at', { ascending: false });
    if (from) query = query.gte('entry_date', from);
    if (to) query = query.lte('entry_date', to);
    if (limit) query = query.limit(limit);
    const { data, error } = await query;
    if (error) throw error;
    const grouped = {};
    for (const entry of (data || [])) {
      const date = entry.entry_date;
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(entry);
    }
    return Object.entries(grouped)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, entries]) => ({ date, entries }));
  },

  stats: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { bless_points_balance: 0, veda_streak: 0, journal_entries_today: 0, gratitude_logged_today: false };
    const today = new Date().toISOString().slice(0, 10);
    const [profileRes, journalRes, gratitudeRes, resetEnt] = await Promise.all([
      supabase.from('profiles').select('bless_points_balance, veda_streak, last_activity_date').eq('id', user.id).single(),
      supabase.from('journal_entries').select('id').eq('user_id', user.id).eq('entry_date', today),
      supabase.from('gratitude_entries').select('id').eq('user_id', user.id).eq('entry_date', today),
      api.getResetEntitlement(),
    ]);
    return {
      bless_points_balance: profileRes.data?.bless_points_balance || 0,
      veda_streak: streakFromProfile(profileRes.data),
      journal_entries_today: journalRes.data?.length || 0,
      gratitude_logged_today: (gratitudeRes.data?.length || 0) > 0,
      reset_entitled: resetEnt.entitled,
      reset_days_remaining: resetEnt.days_remaining || 0,
      reset_period_end: resetEnt.current_period_end || null,
    };
  },

  getResetEntitlement: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return parseEntitlement(null);
    try {
      const { data, error } = await supabase.rpc('get_reset_entitlement');
      if (error) throw error;
      return parseEntitlement(data);
    } catch (e) {
      console.warn('get_reset_entitlement', e);
      return parseEntitlement(null);
    }
  },

  redeemResetCoupon: async (code) => {
    const trimmed = (code || '').trim();
    if (!trimmed) throw new Error('Enter a coupon code.');
    const { data, error } = await supabase.rpc('redeem_reset_coupon', { p_code: trimmed });
    if (error) throw new Error(error.message || 'Could not redeem coupon.');
    invalidateDashboardCache();
    return parseEntitlement(data);
  },

  expireResetSubscriptionForTesting: async () => {
    const { data, error } = await supabase.rpc('expire_reset_subscription_for_testing');
    if (error) throw new Error(error.message || 'Could not reset subscription.');
    invalidateDashboardCache();
    return data;
  },

  syncResetRevenueCatSubscription: async ({ plan, periodEnd, providerRef }) => {
    if (!periodEnd) throw new Error('Missing subscription period.');
    const { data, error } = await supabase.rpc('sync_reset_revenuecat_subscription', {
      p_plan: plan,
      p_period_end: periodEnd,
      p_provider_ref: providerRef || 'revenuecat',
    });
    if (error) throw new Error(error.message || 'Could not sync subscription.');
    invalidateDashboardCache();
    return parseEntitlement(data);
  },

  createRazorpayOrder: async (plan, couponCode) => {
    const body = { plan };
    if (couponCode?.trim()) body.coupon_code = couponCode.trim();
    return invokeEdgeFunction('create-order', body);
  },

  verifyRazorpayPayment: async (payload) => {
    const data = await invokeEdgeFunction('verify-payment', payload);
    invalidateDashboardCache();
    return data;
  },

  /** @deprecated Subscription checkout — use createRazorpayOrder for Standard Checkout */
  createResetRazorpayCheckout: async (plan, couponCode) => {
    const body = { plan };
    if (couponCode?.trim()) body.coupon_code = couponCode.trim();
    return invokeEdgeFunction('create-reset-checkout', body);
  },

  validateResetCheckoutCoupon: async (code, plan) => {
    const trimmed = (code || '').trim();
    if (!trimmed) throw new Error('Enter a coupon code.');
    const { data, error } = await supabase.rpc('validate_reset_checkout_coupon', {
      p_code: trimmed,
      p_plan: plan,
    });
    if (error) throw new Error(error.message || 'Could not validate coupon.');
    return data;
  },

  confirmResetRazorpayCheckout: async (subscriptionId) => {
    const data = await invokeEdgeFunction('confirm-reset-razorpay', {
      subscription_id: subscriptionId,
    });
    invalidateDashboardCache();
    return parseEntitlement(data.entitlement);
  },

  pollResetEntitlement: async (maxAttempts = 15, intervalMs = 2000) => {
    for (let i = 0; i < maxAttempts; i += 1) {
      const ent = await api.getResetEntitlement();
      if (ent.entitled) return ent;
      await new Promise((r) => { setTimeout(r, intervalMs); });
    }
    return api.getResetEntitlement();
  },

  getGutBrainAssessment: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    try {
      const { data } = await supabase
        .from('gut_brain_assessments')
        .select('answers, completed')
        .eq('user_id', user.id)
        .maybeSingle();
      return data || null;
    } catch {
      return null;
    }
  },

  saveGutBrainAssessment: async ({ answers, completed = false }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not signed in');
    const payload = {
      user_id: user.id,
      answers: answers || {},
      completed,
      updated_at: new Date().toISOString(),
    };
    if (completed) payload.completed_at = new Date().toISOString();
    const { data, error } = await supabase
      .from('gut_brain_assessments')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  fetchProfileDemographics: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return {};
    const { data } = await supabase
      .from('profiles')
      .select('age, gender, occupation, marital_status, region, food_preference, wake_time, sleep_time')
      .eq('id', user.id)
      .single();
    return data || {};
  },

  saveProfileDemographics: async (d) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not signed in');
    const { error } = await supabase
      .from('profiles')
      .update({
        age: d.age ? Number(d.age) : null,
        gender: d.gender || null,
        occupation: d.occupation || null,
        marital_status: d.marital_status || null,
        region: d.region || null,
        food_preference: d.food_preference || null,
        wake_time: d.wake_time || null,
        sleep_time: d.sleep_time || null,
      })
      .eq('id', user.id);
    if (error) throw error;
    return { success: true };
  },

  // Builds a customized GeneratedPlan from the user's context metrics via the
  // elevateRulesMatrix.json rule engine (v2). Fully local — no AI or network.
  generateElevatePlan: async (matrix) => {
    const plan = buildElevatePlan(matrix);
    if (!plan || !Array.isArray(plan.dailyTasks) || plan.dailyTasks.length === 0) {
      throw new Error('We could not build your plan right now. Please try again.');
    }
    return plan;
  },

  // Turns a GeneratedPlan into a trackable goal (source 'elevate') with one
  // mini_task per dailyTask per day across the macro-habit duration.
  createElevateGoal: async (plan) => {
    const resetEnt = await api.getResetEntitlement();
    if (!resetEnt.entitled) {
      throw new Error('An active Reset Plan subscription is required to create your elevation plan.');
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not signed in');
    const duration = Math.max(1, Math.min(31, Number(plan.macroGoalDurationDays) || 7));
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + duration);

    const { data: goal, error } = await supabase
      .from('goals')
      .insert({
        user_id: user.id,
        pillar: 'inner_wellness',
        title: plan.planTitle || 'Your Elevation Plan',
        estimate_unit: 'days',
        estimate_value: duration,
        deadline_at: deadline.toISOString(),
        source: 'elevate',
        notes: 'Personalised daily plan generated to elevate your Success Identity by one tier.',
      })
      .select()
      .single();
    if (error) throw error;

    const dailyTasks = Array.isArray(plan.dailyTasks) ? plan.dailyTasks : [];
    const tasks = [];
    for (let i = 0; i < duration; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      for (const t of dailyTasks) {
        if (!t?.taskTitle) continue;
        tasks.push({
          goal_id: goal.id,
          title: t.taskTitle,
          scheduled_for: dateStr,
          source: 'elevate',
          time_window: t.timeWindow || null,
          scheduled_time: t.scheduledTimeRelative || null,
          justification: t.psychologicalJustification || null,
        });
      }
    }

    if (tasks.length === 0) {
      // A plan with no trackable tasks is useless; roll back the goal.
      await supabase.from('goals').delete().eq('id', goal.id);
      throw new Error('The plan came back without any daily tasks. Please try again.');
    }

    const { error: tasksError } = await supabase.from('mini_tasks').insert(tasks);
    if (tasksError) {
      // Don't leave an Elevate goal with no tasks to track. Roll back.
      await supabase.from('goals').delete().eq('id', goal.id);
      throw tasksError;
    }
    return goal;
  },
};

export default api;
