import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Platform } from 'react-native';
import { useRouter, usePathname, Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, BookOpen, Sparkles, LogOut, Heart, Flame, Bell, Target } from 'lucide-react-native';
import { useAuth } from '../lib/auth';
import api from '../lib/api';
import { colors, radius, fonts, shadows, withAlpha } from '../lib/theme';
import Modal from './Modal';
import BlessIcon from './BlessIcon';
import { Button } from './ui';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  { to: '/journal', label: 'Journal', icon: BookOpen },
  { to: '/gratitude', label: 'Gratitude', icon: Heart },
  { to: '/hpa-axis', label: 'HPA Axis', icon: Sparkles },
];

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname() || '';
  const insets = useSafeAreaInsets();
  const [blessOpen, setBlessOpen] = useState(false);
  const [streakOpen, setStreakOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [gratLogged, setGratLogged] = useState(null);
  const [reminders, setReminders] = useState([]);

  const refreshStats = useCallback(async () => {
    if (!user) return;
    try {
      const [s, r] = await Promise.all([api.stats(), api.goalReminders()]);
      setGratLogged(!!s.gratitude_logged_today);
      setReminders(r || []);
    } catch { /* ignore */ }
  }, [user]);

  useEffect(() => { refreshStats(); }, [refreshStats, pathname]);

  const bless = user?.bless_points_balance ?? 0;
  const streak = user?.veda_streak ?? 0;

  const handleLogout = async () => {
    await logout();
    router.replace('/auth');
  };

  const topPad = Platform.OS === 'web' ? 67 : insets.top + 8;
  const botPad = Platform.OS === 'web' ? 84 : 60 + insets.bottom;

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad, paddingBottom: 12 }]}>
        <Link href="/dashboard" asChild>
          <Pressable>
            <Text style={styles.brand}>
              Psyche<Text style={{ color: colors.primary }}>veda</Text>
            </Text>
          </Pressable>
        </Link>

        <View style={styles.headerRight}>
          <Pressable onPress={() => setBlessOpen(true)} style={styles.blessPill}>
            <BlessIcon size={18} />
            <Text style={[styles.pillVal, { color: colors.primary }]}>{bless}</Text>
          </Pressable>

          <Pressable onPress={() => setStreakOpen(true)} style={styles.streakPill}>
            <Flame size={14} strokeWidth={1.8} color={colors.secondary} />
            <Text style={[styles.pillVal, { color: colors.secondary }]}>{streak}</Text>
          </Pressable>

          <Pressable onPress={() => setNotifOpen(true)} style={styles.bellBtn} hitSlop={8}>
            <Bell size={18} strokeWidth={1.5} color={colors.subtext} />
            {reminders.length > 0 ? (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>
                  {reminders.length > 9 ? '9+' : reminders.length}
                </Text>
              </View>
            ) : null}
          </Pressable>

          <Pressable onPress={handleLogout} style={styles.logoutBtn} hitSlop={8}>
            <LogOut size={18} strokeWidth={1.5} color={colors.subtext} />
          </Pressable>
        </View>
      </View>

      {/* Body */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={[styles.bodyContent, { paddingBottom: botPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.bodyInner}>
          {children}
        </View>
      </ScrollView>

      {/* Bottom Nav */}
      <View style={[
        styles.nav,
        { paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom, height: botPad },
      ]}>
        <View style={styles.navInner}>
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.to);
            return (
              <Link key={item.to} href={item.to} asChild>
                <Pressable style={styles.navItem}>
                  <Icon
                    size={20}
                    strokeWidth={1.5}
                    color={active ? colors.primary : colors.subtext}
                  />
                  <Text style={[
                    styles.navLabel,
                    { color: active ? colors.primary : colors.subtext },
                  ]}>
                    {item.label}
                  </Text>
                </Pressable>
              </Link>
            );
          })}
        </View>
      </View>

      {/* Bless Modal */}
      <Modal open={blessOpen} onClose={() => setBlessOpen(false)} title="Bless Points">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <View style={styles.blessIconBox}>
            <BlessIcon size={40} />
          </View>
          <View>
            <Text style={{ fontFamily: fonts.display, fontSize: 36, color: colors.text }}>{bless}</Text>
            <Text style={{ fontSize: 12, color: colors.subtext, marginTop: 4 }}>accumulated grace</Text>
          </View>
        </View>
        <Text style={styles.modalBody}>
          Bless Points are earned through small, repeated devotions:
        </Text>
        <View style={{ gap: 10, marginTop: 12 }}>
          <View style={styles.blessRow}>
            <Text style={[styles.blessAmt, { width: 48 }]}>+15</Text>
            <Text style={styles.blessDesc}>Daily three-blessing Gratitude ritual</Text>
          </View>
          <View style={styles.blessRow}>
            <Text style={[styles.blessAmt, { width: 48 }]}>+5</Text>
            <Text style={styles.blessDesc}>Each Daily Mini-Task completed</Text>
          </View>
        </View>
        <Text style={[styles.modalBody, { fontStyle: 'italic', fontSize: 12, marginTop: 20 }]}>
          Journal reframing earns no points — its reward is the clarity itself.
        </Text>
        <Button
          onPress={() => { setBlessOpen(false); router.push('/gratitude'); }}
          style={{ marginTop: 24 }}
        >
          Offer today's gratitude
        </Button>
      </Modal>

      {/* Streak Modal */}
      <Modal open={streakOpen} onClose={() => setStreakOpen(false)} title="Veda Streak">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <View style={styles.streakIconBox}>
            <Flame size={26} strokeWidth={1.5} color={colors.secondary} />
          </View>
          <View>
            <Text style={{ fontFamily: fonts.display, fontSize: 36, color: colors.text }}>
              {streak}
              <Text style={{ fontSize: 16, color: colors.subtext }}>
                {'  '}day{streak === 1 ? '' : 's'}
              </Text>
            </Text>
            <Text style={{ fontSize: 12, color: colors.subtext, marginTop: 4 }}>unbroken devotion</Text>
          </View>
        </View>
        <Text style={styles.modalBody}>
          Your streak counts consecutive days with at least one Bless-earning act —
          a completed mini-task, or the daily gratitude ritual.
        </Text>
        {user?.last_activity_date ? (
          <View style={styles.streakLast}>
            <Text style={{ color: colors.subtext, fontSize: 14 }}>Last activity</Text>
            <Text style={{ color: colors.text, fontFamily: fonts.bodyMedium }}>{user.last_activity_date}</Text>
          </View>
        ) : null}
        <Text style={[styles.modalBody, { fontStyle: 'italic', fontSize: 12, marginTop: 20 }]}>
          Skip a day and the count resets to one — gentle as the tide.
        </Text>
      </Modal>

      {/* Notifications / Goal Reminders */}
      <Modal open={notifOpen} onClose={() => setNotifOpen(false)} title="Reminders">
        {reminders.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 24 }}>
            <View style={styles.notifEmptyIcon}>
              <Bell size={24} strokeWidth={1.5} color={colors.secondary} />
            </View>
            <Text style={[styles.modalBody, { textAlign: 'center', marginTop: 16 }]}>
              You're all caught up. Every goal has progress logged today.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.modalBody}>
              {reminders.length === 1
                ? 'One goal still awaits today\'s effort:'
                : `${reminders.length} goals still await today's effort:`}
            </Text>
            <View style={{ gap: 10, marginTop: 14 }}>
              {reminders.map((g) => (
                <Pressable
                  key={g.id}
                  onPress={() => { setNotifOpen(false); router.push(`/goals/${g.id}`); }}
                  style={styles.notifRow}
                >
                  <View style={styles.notifIcon}>
                    <Target size={16} strokeWidth={1.5} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.notifTitle} numberOfLines={2}>{g.title}</Text>
                    <Text style={styles.notifPillar}>{g.pillar_label}</Text>
                  </View>
                  <Text style={styles.notifCta}>Log</Text>
                </Pressable>
              ))}
            </View>
            <Text style={[styles.modalBody, { fontStyle: 'italic', fontSize: 12, marginTop: 20 }]}>
              Log a small effort each day to keep your veda streak alive.
            </Text>
          </>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: withAlpha(colors.bg, 0.95),
    borderBottomWidth: 1, borderBottomColor: colors.border,
    gap: 12,
  },
  brand: { fontFamily: fonts.display, fontSize: 22, color: colors.text },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  blessPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: withAlpha(colors.primary, 0.10),
    borderWidth: 1, borderColor: withAlpha(colors.primary, 0.30),
  },
  streakPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: withAlpha(colors.secondary, 0.10),
    borderWidth: 1, borderColor: withAlpha(colors.secondary, 0.30),
  },
  pillVal: { fontSize: 13, fontFamily: fonts.bodyMedium },
  bellBtn: { padding: 8, borderRadius: radius.pill },
  bellBadge: {
    position: 'absolute', top: 2, right: 2,
    minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 3,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  bellBadgeText: { color: '#fff', fontSize: 9, fontFamily: fonts.bodyMedium },
  notifEmptyIcon: {
    height: 56, width: 56, borderRadius: radius.xl,
    backgroundColor: withAlpha(colors.secondary, 0.15),
    borderWidth: 1, borderColor: withAlpha(colors.secondary, 0.35),
    alignItems: 'center', justifyContent: 'center',
  },
  notifRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.xl, paddingHorizontal: 14, paddingVertical: 12,
  },
  notifIcon: {
    height: 36, width: 36, borderRadius: radius.lg,
    backgroundColor: withAlpha(colors.primary, 0.12),
    alignItems: 'center', justifyContent: 'center',
  },
  notifTitle: { color: colors.text, fontSize: 14, fontFamily: fonts.bodyMedium },
  notifPillar: { color: colors.subtext, fontSize: 12, fontFamily: fonts.body, marginTop: 2 },
  notifCta: { color: colors.primary, fontSize: 13, fontFamily: fonts.bodyMedium },
  logoutBtn: { padding: 8, borderRadius: radius.pill },
  body: { flex: 1 },
  bodyContent: { paddingTop: 24, paddingHorizontal: 0 },
  bodyInner: { paddingHorizontal: 20, maxWidth: 720, width: '100%', alignSelf: 'center' },
  nav: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: withAlpha(colors.bg, 0.95),
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  navInner: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 8, paddingHorizontal: 16 },
  navItem: { alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 4 },
  navLabel: { fontSize: 11, fontFamily: fonts.body, letterSpacing: 0.4 },
  blessIconBox: {
    height: 64, width: 64, borderRadius: radius.xl,
    backgroundColor: withAlpha(colors.primary, 0.12),
    borderWidth: 1, borderColor: withAlpha(colors.primary, 0.40),
    alignItems: 'center', justifyContent: 'center',
  },
  streakIconBox: {
    height: 56, width: 56, borderRadius: radius.xl,
    backgroundColor: withAlpha(colors.secondary, 0.15),
    borderWidth: 1, borderColor: withAlpha(colors.secondary, 0.35),
    alignItems: 'center', justifyContent: 'center',
  },
  modalBody: { fontSize: 14, color: colors.text, lineHeight: 22, fontFamily: fonts.body },
  blessRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  blessAmt: { color: colors.primary, fontFamily: fonts.bodyMedium, fontSize: 14 },
  blessDesc: { color: colors.text, fontSize: 14, flex: 1, fontFamily: fonts.body },
  streakLast: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.xl, paddingHorizontal: 16, paddingVertical: 12, marginTop: 12,
  },
});
