import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Modal as RNModal } from 'react-native';
import Svg, { Path, Line, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import {
  X, TrendingUp, Users, Briefcase, Coins, HeartPulse, Sparkles, Target,
} from 'lucide-react-native';
import api from '../lib/api';
import ElevateSubtaskHistory from './ElevateSubtaskHistory';
import { probColorForScore } from '../lib/utils';
import { colors, radius, fonts, withAlpha } from '../lib/theme';

const PILLAR_ICONS = {
  family_relationship: Users,
  career_business: Briefcase,
  finance_money: Coins,
  health: HeartPulse,
  inner_wellness: Sparkles,
};

function probBarColor(p) {
  const { text } = probColorForScore(p);
  return { bar: text, text };
}

function Sparkline({ timeline }) {
  if (!timeline || timeline.length === 0) return null;
  const W = 240, H = 48, pad = 4;
  const n = timeline.length;
  const xs = (i) => pad + (i / Math.max(n - 1, 1)) * (W - pad * 2);
  const ys = (p) => pad + ((100 - p) / 100) * (H - pad * 2);

  const past = timeline.filter((t) => t.isPast);
  if (past.length < 2) {
    return <Text style={{ fontSize: 10, color: colors.subtext, fontStyle: 'italic', marginTop: 6 }}>
      Start logging daily to see the trend.
    </Text>;
  }

  const pathD = timeline.map((t, i) =>
    `${i === 0 ? 'M' : 'L'} ${xs(i).toFixed(1)} ${ys(t.prob).toFixed(1)}`
  ).join(' ');
  const areaD = pathD + ` L ${xs(n - 1).toFixed(1)} ${H - pad} L ${pad} ${H - pad} Z`;

  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} style={{ marginTop: 6 }}>
      <Defs>
        <LinearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#D97B45" stopOpacity="0.25" />
          <Stop offset="100%" stopColor="#D97B45" stopOpacity="0.02" />
        </LinearGradient>
      </Defs>
      <Line x1={pad} y1={ys(50)} x2={W - pad} y2={ys(50)} stroke="#E5DDD0" strokeWidth="1" strokeDasharray="3 3" />
      <Path d={areaD} fill="url(#sg)" />
      <Path d={pathD} fill="none" stroke="#D97B45" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {timeline.map((t, i) => {
        if (!t.isPast) return null;
        return (
          <Circle
            key={t.dateStr}
            cx={xs(i)} cy={ys(t.prob)} r="2.5"
            fill={t.logged ? '#5C7A5C' : '#E5DDD0'}
            stroke={t.logged ? '#5C7A5C' : '#C4B89A'}
            strokeWidth="1"
          />
        );
      })}
    </Svg>
  );
}

function GoalRow({ goal }) {
  const Icon = PILLAR_ICONS[goal.pillar] || Target;
  const c = probBarColor(goal.probability);
  const elevate = goal.isElevate;

  return (
    <View style={styles.row}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Icon size={14} strokeWidth={1.5} color={colors.secondary} />
        <Text style={{ flex: 1, fontSize: 14, color: colors.text, fontFamily: fonts.bodyMedium }} numberOfLines={1}>
          {goal.title}
        </Text>
        <Text style={{ fontSize: 18, fontFamily: fonts.displayBold, color: c.text }}>
          {goal.probability}%
        </Text>
      </View>
      <View style={styles.bar}>
        <View style={[styles.barFill, { backgroundColor: c.bar, width: `${goal.probability}%` }]} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
        {elevate ? (
          <>
            <Text style={styles.stat}>{goal.tasksCompleted} sub-tasks done</Text>
            <Text style={styles.stat}>·</Text>
            <Text style={styles.stat}>{goal.tasksMissed} missed</Text>
            {goal.tasksPending > 0 && (
              <>
                <Text style={styles.stat}>·</Text>
                <Text style={styles.stat}>{goal.tasksPending} upcoming</Text>
              </>
            )}
          </>
        ) : (
          <>
            <Text style={styles.stat}>{goal.daysLogged} days logged</Text>
            <Text style={styles.stat}>·</Text>
            <Text style={styles.stat}>{Math.max(0, goal.daysElapsed - goal.daysLogged)} missed</Text>
            <Text style={styles.stat}>·</Text>
            <Text style={styles.stat}>{goal.totalDays} days planned</Text>
          </>
        )}
      </View>
      <Sparkline timeline={goal.timeline} />
      {elevate && goal.taskHistory?.length > 0 && (
        <ElevateSubtaskHistory history={goal.taskHistory} />
      )}
    </View>
  );
}

export default function TrackModal({ onClose, goalId = null }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.goalTrackingData()
      .then((all) => setData(goalId ? all.filter((g) => g.id === goalId) : all))
      .catch((e) => setError(e?.message || 'Could not load tracking data'))
      .finally(() => setLoading(false));
  }, [goalId]);

  return (
    <RNModal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.panel}>
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={18} strokeWidth={1.5} color={colors.primary} />
              <Text style={{ fontFamily: fonts.display, fontSize: 20, color: colors.text }}>
                Completion Probability
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10}>
              <X size={18} strokeWidth={1.5} color={colors.subtext} />
            </Pressable>
          </View>

          <Text style={styles.formula}>
            {data?.some((g) => g.isElevate)
              ? 'Elevate plans score each sub-task: completed past tasks lift probability; missed tasks apply consecutive and scattered penalties (floor 5%).'
              : `Each planned day = +${data?.[0] ? `${data[0].dayPoint.toFixed(1)}%` : '1/n×100%'} base weight. Progress logs count as completed days.`}
          </Text>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20 }}>
            {loading && <Text style={styles.empty}>Calculating…</Text>}
            {error ? <Text style={[styles.empty, { color: colors.danger }]}>{error}</Text> : null}
            {data && data.length === 0 && <Text style={styles.empty}>No goals planted yet.</Text>}
            {data && data.map((g) => <GoalRow key={g.id} goal={g} />)}
          </ScrollView>

          <View style={styles.footer}>
            <Text style={{ fontSize: 10, color: colors.subtext, textAlign: 'center', fontFamily: fonts.body }}>
              {data?.some((g) => g.isElevate)
                ? 'Complete today\'s sub-tasks on the Dashboard.'
                : 'Open any goal → Log Progress to record your daily work'}
            </Text>
          </View>
        </View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: withAlpha(colors.text, 0.40),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  panel: {
    width: '100%', maxWidth: 460, maxHeight: '85%',
    backgroundColor: colors.bg, borderRadius: radius.xxl,
    borderWidth: 1, borderColor: colors.border,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 20, paddingBottom: 12,
  },
  formula: {
    fontSize: 11, color: colors.subtext, lineHeight: 18,
    paddingHorizontal: 24, paddingBottom: 12, fontFamily: fonts.body,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  empty: { textAlign: 'center', color: colors.subtext, fontSize: 14, paddingVertical: 32 },
  row: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  bar: { height: 8, backgroundColor: colors.border, borderRadius: radius.pill, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: radius.pill },
  stat: { fontSize: 10, color: colors.subtext, fontFamily: fonts.body },
  footer: { paddingHorizontal: 24, paddingVertical: 14, borderTopWidth: 1, borderTopColor: colors.border },
});
