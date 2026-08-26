import React, { useState, useCallback, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Plus, Target, BookOpen, Heart, TrendingUp,
  Users, Briefcase, Coins, HeartPulse, Sparkles, ChevronRight, Check, Rocket,
} from 'lucide-react-native';
import { useAuth } from '../src/lib/auth';
import api, { invalidateDashboardCache } from '../src/lib/api';
import AppShell from '../src/components/AppShell';
import DailyOracleModal, { DailyOracleTrigger } from '../src/components/DailyOracleCard';
import { Button, Card, Badge } from '../src/components/ui';
import TrackModal from '../src/components/TrackModal';
import { markOracleAbsorbed, resolveDailyOracle } from '../src/lib/psychologicalTips';
import { colors, fonts, radius, withAlpha } from '../src/lib/theme';

const PILLAR_ICONS = {
  family_relationship: Users, career_business: Briefcase,
  finance_money: Coins, health: HeartPulse, inner_wellness: Sparkles,
};

export default function Dashboard() {
  const { user, refresh } = useAuth();
  const router = useRouter();
  const [goals, setGoals] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [trackOpen, setTrackOpen] = useState(false);
  const [togglingIds, setTogglingIds] = useState(() => new Set());
  const [oracleMode, setOracleMode] = useState(null);
  const [oracleTip, setOracleTip] = useState(null);
  const [oracleLoading, setOracleLoading] = useState(true);
  const [absorbing, setAbsorbing] = useState(false);
  const [oracleOpen, setOracleOpen] = useState(false);
  const hasLoadedRef = useRef(false);

  const load = useCallback(async (silent = false) => {
    if (!silent && !hasLoadedRef.current) setLoading(true);
    try {
      const { goals: g, tasks: t, stats: s } = await api.fetchDashboard({ force: silent });
      setGoals(g);
      setTasks(t);
      setStats(s);
      hasLoadedRef.current = true;
    } catch (e) { console.warn(e); }
    finally { setLoading(false); }
  }, []);

  const loadOracle = useCallback(async (silent = false) => {
    if (!user?.id) {
      setOracleMode(null);
      setOracleTip(null);
      setOracleLoading(false);
      return;
    }
    if (!silent) setOracleLoading(true);
    try {
      const { mode, tip } = await resolveDailyOracle(user.id);
      setOracleMode(mode);
      setOracleTip(tip);
      if (mode === 'expanded') setOracleOpen(true);
    } catch (e) {
      console.warn(e);
      if (!silent) {
        setOracleMode(null);
        setOracleTip(null);
      }
    } finally {
      setOracleLoading(false);
    }
  }, [user]);

  useFocusEffect(useCallback(() => {
    const silent = hasLoadedRef.current;
    load(silent);
    loadOracle(silent);
  }, [load, loadOracle]));

  const absorbOracle = async () => {
    if (!user?.id || !oracleTip || absorbing) return;
    setAbsorbing(true);
    try {
      await markOracleAbsorbed(user.id, oracleTip.id);
      setOracleMode('collapsed');
      setOracleOpen(false);
    } catch (e) {
      console.warn(e);
    } finally {
      setAbsorbing(false);
    }
  };

  const completeTask = async (id) => {
    const task = tasks.find((t) => t.id === id);
    if (!task || task.completed || togglingIds.has(id)) return;

    setTogglingIds((prev) => new Set(prev).add(id));
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: true } : t)));

    try {
      await api.toggleTask(id);
      invalidateDashboardCache();
      refresh().catch(() => {});
      api.fetchDashboard({ force: true }).then(({ stats: s }) => setStats(s)).catch(() => {});
    } catch (e) {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: false } : t)));
      console.warn(e);
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const rawName = user?.full_name?.split(' ')[0] || 'friend';
  const firstName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  return (
    <AppShell>
      {!oracleLoading && oracleTip && (
        <DailyOracleTrigger tip={oracleTip} onPress={() => setOracleOpen(true)} />
      )}

      <Text style={[styles.greet, oracleTip && !oracleLoading && styles.greetBelowTips]}>
        🙏 {firstName}
      </Text>
      <Text style={styles.sub}>Nurture your mind and soul</Text>

      {!loading && stats.reset_entitled && stats.reset_days_remaining > 0 && stats.reset_days_remaining <= 7 ? (
        <Pressable onPress={() => router.push('/reset-subscribe')} style={styles.resetBanner}>
          <Text style={styles.resetBannerText}>
            Your Reset plan ends in {stats.reset_days_remaining} day{stats.reset_days_remaining === 1 ? '' : 's'} — renew to keep access and save 5%
          </Text>
        </Pressable>
      ) : null}

      {!loading && !stats.reset_entitled && stats.reset_period_end ? (
        <Pressable onPress={() => router.push('/reset-subscribe')} style={styles.resetBannerLapsed}>
          <Text style={styles.resetBannerText}>
            Your Reset plan has ended — renew to restore your plan and Elevate tasks
          </Text>
        </Pressable>
      ) : null}

      <DailyOracleModal
        open={oracleOpen}
        tip={oracleTip}
        absorbed={oracleMode === 'collapsed'}
        onClose={() => setOracleOpen(false)}
        onAbsorb={absorbOracle}
        absorbing={absorbing}
      />

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <>
          {/* Tasks today */}
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Today&apos;s mini-tasks</Text>
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
                    <Pressable
                      onPress={() => completeTask(t.id)}
                      disabled={t.completed || togglingIds.has(t.id)}
                    >
                      <View style={[
                        styles.checkbox,
                        t.completed && { backgroundColor: colors.secondary, borderColor: colors.secondary },
                      ]}>
                        {t.completed && <Check size={14} strokeWidth={3} color={colors.white} />}
                      </View>
                    </Pressable>
                    {t.source === 'elevate' && (
                      <View style={styles.elevateTaskIcon}>
                        <Rocket size={12} strokeWidth={1.8} color={colors.primary} />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontSize: 14, fontFamily: fonts.body }}>
                        {t.title}
                      </Text>
                      {t.source === 'elevate' && (t.time_window || t.scheduled_time) ? (
                        <Text style={styles.elevateTaskMeta}>
                          {[t.time_window, t.scheduled_time].filter(Boolean).join(' · ')}
                        </Text>
                      ) : null}
                    </View>
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
                  <Text style={styles.devoSub}>Emotional power</Text>
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
                          <View style={[
                            styles.goalIcon,
                            g.source === 'elevate' && { backgroundColor: withAlpha(colors.primary, 0.14) },
                          ]}>
                            {g.source === 'elevate'
                              ? <Rocket size={16} strokeWidth={1.6} color={colors.primary} />
                              : <Icon size={16} strokeWidth={1.5} color={colors.secondary} />}
                          </View>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text style={styles.goalLabel}>{g.pillar_label}</Text>
                              {g.source === 'elevate' && (
                                <View style={styles.elevateTag}>
                                  <Text style={styles.elevateTagText}>ELEVATE</Text>
                                </View>
                              )}
                            </View>
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
  greetBelowTips: { marginTop: 18 },
  sub: { color: colors.subtext, fontSize: 14, marginTop: 4, fontFamily: fonts.body },
  resetBanner: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.xl,
    backgroundColor: withAlpha(colors.primary, 0.10),
    borderWidth: 1,
    borderColor: withAlpha(colors.primary, 0.25),
  },
  resetBannerLapsed: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.xl,
    backgroundColor: withAlpha(colors.amber, 0.12),
    borderWidth: 1,
    borderColor: withAlpha(colors.amber, 0.30),
  },
  resetBannerText: {
    color: colors.text,
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    lineHeight: 20,
  },
  section: { marginTop: 28 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.text },
  empty: { color: colors.subtext, fontSize: 14, fontFamily: fonts.body, lineHeight: 22 },
  checkbox: {
    height: 22, width: 22, borderRadius: 6,
    borderWidth: 1.5, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  devoCard: { padding: 16, gap: 6, alignItems: 'flex-start', flex: 1 },
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
  elevateTag: {
    paddingHorizontal: 6, paddingVertical: 1, borderRadius: radius.pill,
    backgroundColor: withAlpha(colors.primary, 0.12),
    borderWidth: 1, borderColor: withAlpha(colors.primary, 0.30),
  },
  elevateTagText: {
    fontSize: 8, letterSpacing: 1, color: colors.primary, fontFamily: fonts.bodyMedium,
  },
  elevateTaskIcon: {
    height: 24, width: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: withAlpha(colors.primary, 0.12),
  },
  elevateTaskMeta: {
    fontSize: 11, color: colors.primary, fontFamily: fonts.bodyMedium, marginTop: 2,
  },
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
