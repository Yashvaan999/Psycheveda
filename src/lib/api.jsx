import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export const api = {
  // auth
  register: async ({ email, password, full_name }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name }
      }
    });
    if (error) throw error;
    return { token: data.session?.access_token, user: data.user };
  },

  login: async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
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
    const { error } = await supabase
      .from('profiles')
      .update({ selected_pillars: pillars, onboarding_complete: true })
      .eq('id', user.id);
    if (error) throw error;
    return { success: true };
  },

  createGoal: async (data) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: goal, error } = await supabase
      .from('goals')
      .insert({ ...data, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    return goal;
  },

  listGoals: async () => {
    const { data, error } = await supabase.from('goals').select('*');
    if (error) throw error;
    return data;
  },

  tasksToday: async () => {
    const { data, error } = await supabase.from('tasks').select('*');
    if (error) throw error;
    return data;
  },

  toggleTask: async (id) => {
    const { data, error } = await supabase
      .from('tasks')
      .update({ completed: true })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // journal
  journalFrames: async () => {
    const { data, error } = await supabase.from('journal_frames').select('*');
    if (error) throw error;
    return data;
  },

  createJournal: async (data) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: journal, error } = await supabase
      .from('journals')
      .insert({ ...data, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    return journal;
  },

  listJournal: async () => {
    const { data, error } = await supabase.from('journals').select('*');
    if (error) throw error;
    return data;
  },

  // gratitude
  createGratitude: async (data) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: gratitude, error } = await supabase
      .from('gratitude_entries')
      .insert({ ...data, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    return gratitude;
  },

  listGratitude: async () => {
    const { data, error } = await supabase.from('gratitude_entries').select('*');
    if (error) throw error;
    return data;
  },

  // stats
  stats: async () => {
    const { data, error } = await supabase.from('user_stats').select('*').single();
    if (error) throw error;
    return data;
  },
};

export default api;
