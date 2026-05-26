import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/constants/colors';
import { Card, SectionHeader, Badge, EmptyState } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { listGoals, tasksToday, toggleTask, fetchStats, PILLAR_LABELS } from '@/lib/api';

interface Goal {
  id: string;
  title: string;
  pillar_id: string;
  duration_days: number;
  progress_log_count: number;
  completion_pct?: number;
  mini_tasks?: { is_done: boolean }[];
}

interface Task {
  id: string;
  title: string;
  is_done: boolean;
  goals?: { title: string; pillar_id: string };
}

interface Stats {
  bless_points: number;
  streak_days: number;
}

function goalPct(g: Goal) {
  if (g.completion_pct != null) return Math.round(g.completion_pct);
  const total = g.duration_days ?? 30;
  const done = g.progress_log_count ?? 0;
  return Math.min(100, Math.round((done / total) * 100));
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadData() {
    try {
      const [g, t, s] = await Promise.all([listGoals(), tasksToday(), fetchStats()]);
      setGoals(g as Goal[]);
      setTasks(t as Task[]);
      setStats(s as Stats | null);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadData();
    }, [])
  );

  async function handleToggleTask(id: string, current: boolean) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, is_done: !current } : t)));
    try {
      await toggleTask(id, !current);
    } catch {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, is_done: current } : t)));
    }
  }

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = (user?.full_name as string | undefined)?.split(' ')[0] ?? 'there';

  if (loading) {
    return (
      <View style={[styles.loadingWrap, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={colors.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting()},</Text>
          <Text style={styles.name}>{firstName}</Text>
        </View>
        <View style={styles.statsBadges}>
          <View style={styles.statBadge}>
            <Ionicons name="sparkles" size={14} color={colors.primary} />
            <Text style={styles.statBadgeText}>{stats?.bless_points ?? 0}</Text>
          </View>
          {(stats?.streak_days ?? 0) > 0 && (
            <View style={[styles.statBadge, { backgroundColor: colors.secondaryLight }]}>
              <Ionicons name="flame" size={14} color={colors.secondary} />
              <Text style={[styles.statBadgeText, { color: colors.secondary }]}>{stats?.streak_days}d</Text>
            </View>
          )}
        </View>
      </View>

      {/* Today's Tasks */}
      {tasks.length > 0 && (
        <View style={styles.section}>
          <SectionHeader title="Today's Tasks" />
          {tasks.map((task) => (
            <TouchableOpacity
              key={task.id}
              onPress={() => handleToggleTask(task.id, task.is_done)}
              activeOpacity={0.75}
              style={[styles.taskRow, task.is_done && styles.taskRowDone]}
            >
              <View style={[styles.taskCheck, task.is_done && styles.taskCheckDone]}>
                {task.is_done && <Ionicons name="checkmark" size={14} color={colors.white} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.taskTitle, task.is_done && styles.taskTitleDone]} numberOfLines={2}>
                  {task.title}
                </Text>
                {task.goals && (
                  <Text style={styles.taskPillar}>{PILLAR_LABELS[task.goals.pillar_id] ?? task.goals.pillar_id}</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Goals */}
      <View style={styles.section}>
        <SectionHeader title="Active Goals" />
        {goals.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Ionicons name="flag-outline" size={36} color={colors.subtext} />}
              title="No goals yet"
              subtitle="Your goals will appear here after onboarding"
            />
          </Card>
        ) : (
          goals.map((goal) => {
            const pct = goalPct(goal);
            return (
              <Card key={goal.id} onPress={() => router.push(`/goals/${goal.id}`)} style={{ marginBottom: 12 }}>
                <View style={styles.goalCardHeader}>
                  <Badge label={PILLAR_LABELS[goal.pillar_id] ?? goal.pillar_id} />
                  <Text style={styles.goalPct}>{pct}%</Text>
                </View>
                <Text style={styles.goalTitle} numberOfLines={2}>{goal.title}</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${pct}%` }]} />
                </View>
                <View style={styles.goalMeta}>
                  <Text style={styles.goalMetaText}>{goal.duration_days}d journey</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.subtext} />
                </View>
              </Card>
            );
          })
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <SectionHeader title="Daily Rituals" />
        <View style={styles.quickRow}>
          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: colors.primaryLight, borderColor: colors.primaryMid }]}
            onPress={() => router.push('/(tabs)/journal')}
            activeOpacity={0.78}
          >
            <Ionicons name="book-outline" size={24} color={colors.primary} />
            <Text style={styles.quickLabel}>Journal</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: colors.secondaryLight, borderColor: colors.secondary + '40' }]}
            onPress={() => router.push('/(tabs)/gratitude')}
            activeOpacity={0.78}
          >
            <Ionicons name="heart-outline" size={24} color={colors.secondary} />
            <Text style={[styles.quickLabel, { color: colors.secondary }]}>Gratitude</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  greeting: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.subtext },
  name: { fontFamily: 'Lora_700Bold', fontSize: 26, color: colors.text, marginTop: 2 },
  statsBadges: { flexDirection: 'row', gap: 8, marginTop: 6 },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
  },
  statBadgeText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.primary },
  section: { marginBottom: 28 },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  taskRowDone: { opacity: 0.6 },
  taskCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  taskCheckDone: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  taskTitle: { fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.text, lineHeight: 20 },
  taskTitleDone: { textDecorationLine: 'line-through', color: colors.subtext },
  taskPillar: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.subtext, marginTop: 2 },
  goalCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  goalPct: { fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.primary },
  goalTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.text, marginBottom: 12, lineHeight: 22 },
  progressBar: { height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden', marginBottom: 10 },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  goalMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goalMetaText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.subtext },
  quickRow: { flexDirection: 'row', gap: 12 },
  quickCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
  },
  quickLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.primary },
});
