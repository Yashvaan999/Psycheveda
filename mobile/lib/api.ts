import { supabase } from './supabase';

export const PILLAR_LABELS: Record<string, string> = {
  family_relationship: 'Family & Relationships',
  career_business: 'Career & Business',
  finance_money: 'Finance & Money',
  health: 'Health & Body',
  inner_wellness: 'Inner Wellness',
};

export const PILLAR_ICONS: Record<string, string> = {
  family_relationship: 'people-outline',
  career_business: 'briefcase-outline',
  finance_money: 'cash-outline',
  health: 'fitness-outline',
  inner_wellness: 'sparkles-outline',
};

export const SUGGESTIONS: Record<string, string[]> = {
  family_relationship: [
    'Spend 30 minutes of quality time with family daily',
    'Call a loved one every week',
    'Plan a monthly family activity',
    'Practice active listening with my partner',
    'Write letters of appreciation to family members',
  ],
  career_business: [
    'Complete one deep work session of 2+ hours daily',
    'Network with one new professional contact weekly',
    'Learn a new skill related to my field each month',
    'Review and refine my long-term career goals',
    'Deliver one project ahead of deadline this quarter',
  ],
  finance_money: [
    'Track all expenses and stick to my monthly budget',
    'Save 20% of my income every month',
    'Read one book about personal finance',
    'Review and optimize my investment portfolio',
    'Pay off a debt or reduce liabilities by year-end',
  ],
  health: [
    'Exercise at least 30 minutes five days a week',
    'Drink 8 glasses of water daily',
    'Sleep 7–8 hours every night',
    'Prepare healthy meals at home five days a week',
    'Complete a health check-up this month',
  ],
  inner_wellness: [
    'Meditate for 10 minutes every morning',
    'Write three things I am grateful for each day',
    'Read for 20 minutes before sleeping',
    'Spend time in nature at least twice a week',
    'Practice one act of kindness daily',
  ],
};

// ─── Auth ────────────────────────────────────────────────────────────────────
export async function register(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) throw error;
  return data;
}

export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function fetchProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  if (error) throw error;
  return { ...user, ...data };
}

export async function upsertProfile(updates: Record<string, unknown>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { error } = await supabase.from('profiles').upsert({
    id: user.id,
    email: user.email,
    ...updates,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

// ─── Pillars ─────────────────────────────────────────────────────────────────
export async function listPillars() {
  const { data, error } = await supabase.from('pillars').select('*').order('display_order');
  if (error) throw error;
  return data ?? [];
}

export async function getSelectedPillars() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('user_pillars')
    .select('pillar_id')
    .eq('user_id', user.id);
  if (error) throw error;
  return (data ?? []).map((r: { pillar_id: string }) => r.pillar_id);
}

export async function setSelectedPillars(pillarIds: string[]) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  await supabase.from('user_pillars').delete().eq('user_id', user.id);
  if (pillarIds.length > 0) {
    const rows = pillarIds.map((pid) => ({ user_id: user.id, pillar_id: pid }));
    const { error } = await supabase.from('user_pillars').insert(rows);
    if (error) throw error;
  }
}

// ─── Goals ───────────────────────────────────────────────────────────────────
export async function listGoals() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('goals')
    .select('*, progress_log_count:goal_progress_logs(count)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((g: Record<string, unknown>) => ({
    ...g,
    progress_log_count:
      (g.progress_log_count as { count: number }[])?.[0]?.count ?? 0,
  }));
}

export async function getGoal(id: string) {
  const { data, error } = await supabase
    .from('goals')
    .select('*, mini_tasks(*), goal_progress_logs(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createGoal(params: {
  title: string;
  pillar_id: string;
  duration_days?: number;
  notes?: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const durationDays = params.duration_days ?? 30;
  const { data, error } = await supabase
    .from('goals')
    .insert({
      user_id: user.id,
      title: params.title,
      pillar_id: params.pillar_id,
      duration_days: durationDays,
      notes: params.notes ?? '',
    })
    .select()
    .single();
  if (error) throw error;

  const tasks = Array.from({ length: durationDays }, (_, i) => ({
    goal_id: data.id,
    user_id: user.id,
    day_number: i + 1,
    title: `Day ${i + 1}: ${params.title}`,
    is_done: false,
  }));
  const batchSize = 50;
  for (let i = 0; i < tasks.length; i += batchSize) {
    await supabase.from('mini_tasks').insert(tasks.slice(i, i + batchSize));
  }
  return data;
}

export async function updateGoal(id: string, updates: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('goals')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteGoal(id: string) {
  const { error } = await supabase.from('goals').delete().eq('id', id);
  if (error) throw error;
}

// ─── Mini Tasks ───────────────────────────────────────────────────────────────
export async function tasksToday() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('mini_tasks')
    .select('*, goals(title, pillar_id)')
    .eq('user_id', user.id)
    .eq('due_date', today)
    .order('day_number', { ascending: true })
    .limit(10);
  if (error) return [];
  return data ?? [];
}

export async function toggleTask(id: string, isDone: boolean) {
  const { error } = await supabase
    .from('mini_tasks')
    .update({ is_done: isDone, completed_at: isDone ? new Date().toISOString() : null })
    .eq('id', id);
  if (error) throw error;
}

// ─── Progress Logs ────────────────────────────────────────────────────────────
export async function logProgress(goalId: string, entry: { note?: string; mood?: number }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase
    .from('goal_progress_logs')
    .insert({ goal_id: goalId, user_id: user.id, ...entry })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listProgressLogs(goalId: string) {
  const { data, error } = await supabase
    .from('goal_progress_logs')
    .select('*')
    .eq('goal_id', goalId)
    .order('logged_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ─── Journal ─────────────────────────────────────────────────────────────────
export async function createJournalEntry(entry: {
  period: string;
  situation: string;
  natural_emotion: string;
  nlp_frame?: string;
  ease?: string;
  end_feeling?: string;
  bless_gratitude?: string;
  initial_frame?: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase
    .from('journal_entries')
    .insert({ user_id: user.id, ...entry })
    .select()
    .single();
  if (error) throw error;
  await supabase.rpc('increment_bless_points', { uid: user.id, pts: 10 }).catch(() => {});
  return data;
}

export async function listJournalEntries(limit = 20, offset = 0) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return data ?? [];
}

// ─── Gratitude ────────────────────────────────────────────────────────────────
export async function createGratitudeEntry(entry: {
  blessing_1: string;
  blessing_2: string;
  blessing_3: string;
  period?: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase
    .from('gratitude_entries')
    .insert({ user_id: user.id, ...entry })
    .select()
    .single();
  if (error) throw error;
  await supabase.rpc('increment_bless_points', { uid: user.id, pts: 5 }).catch(() => {});
  return data;
}

export async function listGratitudeEntries(limit = 20, offset = 0) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('gratitude_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return data ?? [];
}

// ─── Stats ────────────────────────────────────────────────────────────────────
export async function fetchStats() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from('profiles')
    .select('bless_points, streak_days')
    .eq('id', user.id)
    .single();
  return data;
}
