import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Plus, Target, BookOpen, Heart, TrendingUp,
  Users, Briefcase, Coins, HeartPulse, Sparkles, ChevronRight, Check,
} from 'lucide-react-native';
import { useAuth } from '../src/lib/auth';
import api from '../src/lib/api';
import AppShell from '../src/components/AppShell';
import { Button, Card, Badge } from '../src/components/ui';
import TrackModal from '../src/components/TrackModal';
import { colors, fonts, radius, withAlpha } from '../src/lib/theme';

const PILLAR_ICONS = {
  family_relationship: Users, career_business: Briefcase,
  finance_money: Coins, health: HeartPulse, inner_wellness: Sparkles,
};

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [goals, setGoals] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [trackOpen, setTrackOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const [g, t, s] = await Promise.all([api.listGoals(), api.tasksToday(), api.stats()]);
      setGoals(g); setTasks(t); setStats(s);
    } catch (e) { console.warn(e); }
    finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const completeTask = async (id) => {
    await api.toggleTask(id);
    load();
  };

  const rawName = user?.full_name?.split(' ')[0] || 'friend';
  const firstName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  return (
    <AppShell>
      <Text style={styles.greet}>🙏 {firstName}</Text>
      <Text style={styles.sub}>Today's path of devotion awaits.</Text>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <>
          {/* Tasks today */}
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Today's mini-tasks</Text>
              <Pressable onPress={() => setTrackOpen(true)} style={styles.trackPill}>
                <TrendingUp size={14} strokeWidth={1.5} color={colors.primary} />
                <Text style={{ color: colors.primary, fontFamily: fonts.bodyMedium, fontSize: 12 }}>Track</Text>
              </Pressable>
            </View>
            {tasks.length === 0 ? (
              <Card>
                <Text style={styles.empty}>No tasks for today. Beautiful — rest is also a practice.</Text>
              </Card>
            ) : (
              <View style={{ gap: 10 }}>
                {tasks.map((t) => (
                  <Card key={t.id} style={[
                    { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
                    t.completed && { opacity: 0.55 },
                  ]}>
                    <Pressable onPress={() => !t.completed && completeTask(t.id)} disabled={t.completed}>
                      <View style={[
                        styles.checkbox,
                        t.completed && { backgroundColor: colors.secondary, borderColor: colors.secondary },
                      ]}>
                        {t.completed && <Check size={14} strokeWidth={3} color={colors.white} />}
                      </View>
                    </Pressable>
                    <Text style={[
                      { flex: 1, color: colors.text, fontSize: 14, fontFamily: fonts.body },
                      t.completed && { textDecorationLine: 'line-through' },
                    ]}>
                      {t.title}
                    </Text>
                  </Card>
                ))}
              </View>
            )}
          </View>

          {/* Daily devotions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Daily devotions</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <Pressable style={{ flex: 1 }} onPress={() => router.push('/journal')}>
                <Card style={styles.devoCard}>
                  <BookOpen size={20} strokeWidth={1.5} color={colors.primary} />
                  <Text style={styles.devoTitle}>Journal</Text>
                  <Text style={styles.devoSub}>Reframe a thought</Text>
                  <Badge tone="neutral" style={{ marginTop: 8 }}>
                    {stats.journal_entries_today || 0} today
                  </Badge>
                </Card>
              </Pressable>
              <Pressable style={{ flex: 1 }} onPress={() => router.push('/gratitude')}>
                <Card style={styles.devoCard}>
                  <Heart size={20} strokeWidth={1.5} color={colors.heart} />
                  <Text style={styles.devoTitle}>Gratitude</Text>
                  <Text style={styles.devoSub}>Three blessings</Text>
                  <Badge tone={stats.gratitude_logged_today ? 'sage' : 'neutral'} style={{ marginTop: 8 }}>
                    {stats.gratitude_logged_today ? 'logged' : 'pending'}
                  </Badge>
                </Card>
              </Pressable>
            </View>
          </View>

          {/* Goals */}
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Your goals</Text>
              <Pressable onPress={() => router.push('/onboarding')} style={styles.addBtn}>
                <Plus size={14} strokeWidth={2} color={colors.primary} />
              </Pressable>
            </View>
            {goals.length === 0 ? (
              <Card>
                <Target size={20} strokeWidth={1.5} color={colors.subtext} />
                <Text style={[styles.empty, { marginTop: 8 }]}>
                  No goals planted yet. Begin with onboarding.
                </Text>
                <Button onPress={() => router.push('/onboarding')} style={{ marginTop: 16 }}>
                  Start planting
                </Button>
              </Card>
            ) : (
              <View style={{ gap: 10 }}>
                {goals.map((g) => {
                  const Icon = PILLAR_ICONS[g.pillar] || Target;
                  return (
                    <Pressable key={g.id} onPress={() => router.push(`/goals/${g.id}`)}>
                      <Card style={{ padding: 16 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          <View style={styles.goalIcon}>
                            <Icon size={16} strokeWidth={1.5} color={colors.secondary} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.goalLabel}>{g.pillar_label}</Text>
                            <Text style={styles.goalTitle} numberOfLines={2}>{g.title}</Text>
                          </View>
                          <ChevronRight size={16} strokeWidth={1.5} color={colors.subtext} />
                        </View>
                      </Card>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        </>
      )}

      {trackOpen && <TrackModal onClose={() => setTrackOpen(false)} />}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  greet: { fontFamily: fonts.display, fontSize: 28, color: colors.text },
  sub: { color: colors.subtext, fontSize: 14, marginTop: 4, fontFamily: fonts.body },
  section: { marginTop: 28 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.text },
  empty: { color: colors.subtext, fontSize: 14, fontFamily: fonts.body, lineHeight: 22 },
  checkbox: {
    height: 22, width: 22, borderRadius: 6,
    borderWidth: 1.5, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  devoCard: { padding: 16, gap: 6, alignItems: 'flex-start' },
  devoTitle: { fontFamily: fonts.display, fontSize: 18, color: colors.text, marginTop: 4 },
  devoSub: { color: colors.subtext, fontSize: 12, fontFamily: fonts.body },
  goalIcon: {
    height: 36, width: 36, borderRadius: radius.lg,
    backgroundColor: withAlpha(colors.secondary, 0.12),
    alignItems: 'center', justifyContent: 'center',
  },
  goalLabel: {
    fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase',
    color: colors.subtext, fontFamily: fonts.bodyMedium,
  },
  goalTitle: { fontSize: 14, color: colors.text, fontFamily: fonts.bodyMedium, marginTop: 2 },
  trackPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill,
    backgroundColor: withAlpha(colors.primary, 0.10),
    borderWidth: 1, borderColor: withAlpha(colors.primary, 0.30),
  },
  addBtn: {
    height: 28, width: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: withAlpha(colors.primary, 0.12),
    borderWidth: 1, borderColor: withAlpha(colors.primary, 0.30),
  },
});
