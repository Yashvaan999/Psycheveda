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

  // pillars / goals
  listPillars: async () => {
    const { data, error } = await supabase.from('pillars').select('*');
    if (error) throw error;
    return data;
  },

  suggestions: async (pillar) => {
    const { data, error } = await supabase
      .from('suggestions')
      .select('*')
      .eq('pillar', pillar);
    if (error) throw error;
    return data;
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
