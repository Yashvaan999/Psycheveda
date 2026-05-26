import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

const PILLAR_LABELS = {
  family_relationship: 'Family & Relationship',
  career_business: 'Career & Business',
  finance_money: 'Finance & Money',
  health: 'Health',
  inner_wellness: 'Inner Wellness',
};

export const api = {
  // auth
  register: async ({ email, password, full_name }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name } }
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

  // profile
  fetchProfile: async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, onboarding_complete, bless_points_balance, veda_streak, last_activity_date, selected_pillars')
      .eq('id', userId)
      .single();
    return data || {};
  },

  // pillars / goals — static constants (no DB table needed)
  listPillars: async () => [
    { key: 'family_relationship', label: 'Family & Relationship' },
    { key: 'career_business',     label: 'Career & Business' },
    { key: 'finance_money',       label: 'Finance & Money' },
    { key: 'health',              label: 'Health' },
    { key: 'inner_wellness',      label: 'Inner Wellness' },
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
    // Upsert ensures a profile row exists even if the auth trigger didn't run
    const { error } = await supabase
      .from('profiles')
      .upsert({
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
    if (data.estimate_unit === 'days') {
      deadline.setDate(deadline.getDate() + Number(data.estimate_value));
    } else {
      deadline.setHours(deadline.getHours() + Number(data.estimate_value));
    }
    const { data: goal, error } = await supabase
      .from('goals')
      .insert({ ...data, user_id: user.id, deadline_at: deadline.toISOString() })
      .select()
      .single();
    if (error) throw error;
    return goal;
  },

  listGoals: async () => {
    const { data, error } = await supabase
      .from('goals')
      .select('*, mini_tasks(*)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((g) => ({
      ...g,
      pillar_label: PILLAR_LABELS[g.pillar] || g.pillar,
      mini_tasks: g.mini_tasks || [],
    }));
  },

  goalTrackingData: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: goals, error } = await supabase
      .from('goals')
      .select('id, title, pillar, estimate_unit, estimate_value, created_at, deadline_at')
      .order('created_at', { ascending: false });
    if (error) throw error;

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
    } catch { /* table may not exist yet */ }

    return (goals || []).map((g) => {
      const totalDays = g.estimate_unit === 'days'
        ? g.estimate_value
        : Math.ceil(g.estimate_value / 24);
      const created = new Date(g.created_at);
      created.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysElapsed = Math.max(0, Math.floor((today - created) / 86400000));
      const logDates = logsByGoal[g.id] || new Set();
      const daysLogged = logDates.size;
      const missedDays = Math.max(0, daysElapsed - daysLogged);
      const dayPoint = 100 / totalDays;
      const probability = Math.max(0, Math.min(100, Math.round(100 - missedDays * dayPoint)));

      // Build day-by-day timeline for sparkline (max 60 days)
      const displayDays = Math.min(totalDays, 60);
      const timeline = [];
      let runningProb = 100;
      for (let i = 0; i < displayDays; i++) {
        const d = new Date(created);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().slice(0, 10);
        const isPast = d <= today;
        const logged = isPast && logDates.has(dateStr);
        if (isPast && !logged) runningProb = Math.max(0, runningProb - dayPoint);
        timeline.push({ dateStr, logged, isPast, prob: runningProb });
      }

      return { id: g.id, title: g.title, pillar: g.pillar, totalDays, daysElapsed, daysLogged, probability, timeline, dayPoint };
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
      .from('goals')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteGoal: async (id) => {
    const { error } = await supabase.from('goals').delete().eq('id', id);
    if (error) throw error;
  },

  logProgress: async (goalId, note) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('goal_progress_logs')
      .insert({ goal_id: goalId, user_id: user.id, note })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  listProgressLogs: async (goalId) => {
    const { data, error } = await supabase
      .from('goal_progress_logs')
      .select('*')
      .eq('goal_id', goalId)
      .order('logged_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  // tasks (mini_tasks table)
  tasksToday: async () => {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from('mini_tasks')
      .select('*')
      .eq('scheduled_for', today);
    if (error) throw error;
    return data || [];
  },

  toggleTask: async (id) => {
    const { data, error } = await supabase
      .from('mini_tasks')
      .update({ completed: true, completed_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    // Award bless points for task completion
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('bless_transactions').insert({
        user_id: user.id,
        delta: 5,
        reason: 'mini_task_completed',
        ref_id: id,
      });
      await supabase.from('profiles').update({
        bless_points_balance: supabase.rpc ? undefined : undefined,
      }).eq('id', user.id);
      // Increment bless balance via RPC-free approach
      const { data: profile } = await supabase
        .from('profiles')
        .select('bless_points_balance')
        .eq('id', user.id)
        .single();
      if (profile) {
        await supabase
          .from('profiles')
          .update({ bless_points_balance: (profile.bless_points_balance || 0) + 5 })
          .eq('id', user.id);
      }
    } catch {
      // bless award is best-effort
    }
    return data;
  },

  // journal — table: journal_entries
  journalFrames: async () => [
    { key: 'Cause & Effect',            desc: 'This happened because of X and that has to be blamed.' },
    { key: 'Result & Excuse',           desc: 'Produced a story for X situation to feel mentally free.' },
    { key: 'Mind & Body as One System', desc: 'What the mind holds, body speaks and vice versa.' },
    { key: 'Perception is Projection',  desc: "People's judgement of the situation is their voice, not reality." },
    { key: 'Responsibility',            desc: 'Dynamic acceptance. I am aware of my thoughtful response.' },
  ],

  createJournal: async (data) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: journal, error } = await supabase
      .from('journal_entries')
      .insert({ ...data, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    return journal;
  },

  listJournal: async () => {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .order('created_at', { ascending: false });
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

  // gratitude — table: gratitude_entries
  createGratitude: async (data) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: gratitude, error } = await supabase
      .from('gratitude_entries')
      .insert({ ...data, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    // Award +15 bless points
    try {
      await supabase.from('bless_transactions').insert({
        user_id: user.id,
        delta: 15,
        reason: 'gratitude_ritual',
        ref_id: gratitude.id,
      });
      const { data: profile } = await supabase
        .from('profiles')
        .select('bless_points_balance')
        .eq('id', user.id)
        .single();
      if (profile) {
        await supabase
          .from('profiles')
          .update({ bless_points_balance: (profile.bless_points_balance || 0) + 15 })
          .eq('id', user.id);
      }
    } catch {
      // best-effort
    }
    return gratitude;
  },

  listGratitude: async () => {
    const { data, error } = await supabase
      .from('gratitude_entries')
      .select('*')
      .order('created_at', { ascending: false });
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

  // stats — computed from profiles + live tables
  stats: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { bless_points_balance: 0, veda_streak: 0, journal_entries_today: 0, gratitude_logged_today: false };
    const today = new Date().toISOString().slice(0, 10);
    const [profileRes, journalRes, gratitudeRes] = await Promise.all([
      supabase.from('profiles').select('bless_points_balance, veda_streak').eq('id', user.id).single(),
      supabase.from('journal_entries').select('id').eq('user_id', user.id).eq('entry_date', today),
      supabase.from('gratitude_entries').select('id').eq('user_id', user.id).eq('entry_date', today),
    ]);
    return {
      bless_points_balance: profileRes.data?.bless_points_balance || 0,
      veda_streak: profileRes.data?.veda_streak || 0,
      journal_entries_today: journalRes.data?.length || 0,
      gratitude_logged_today: (gratitudeRes.data?.length || 0) > 0,
    };
  },
};

export default api;
