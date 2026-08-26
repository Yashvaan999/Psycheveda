import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, Users, Briefcase, Coins, HeartPulse, Sparkles, Leaf, ArrowLeft } from 'lucide-react-native';
import { useAuth } from '../src/lib/auth';
import { api } from '../src/lib/api';
import { Button, Card, Input, Label, Textarea } from '../src/components/ui';
import { colors, fonts, radius, withAlpha } from '../src/lib/theme';

const ICON_MAP = {
  family_relationship: Users,
  career_business: Briefcase,
  finance_money: Coins,
  health: HeartPulse,
  inner_wellness: Leaf,
};

export default function OnboardingScreen() {
  const { refresh } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  const [pillars, setPillars] = useState([]);
  const [selected, setSelected] = useState([]);
  const [goalsByPillar, setGoalsByPillar] = useState({});
  const [suggestionsByPillar, setSuggestionsByPillar] = useState({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => { api.listPillars().then(setPillars); }, []);

  const togglePillar = (key) => {
    setSelected((curr) => curr.includes(key) ? curr.filter((p) => p !== key) : [...curr, key]);
  };

  const advanceToGoals = async () => {
    if (selected.length === 0) { setErr('Select at least one pillar'); return; }
    setErr(''); setBusy(true);
    try {
      const suggestionsMap = {};
      for (const p of selected) {
        const res = await api.suggestions(p);
        suggestionsMap[p] = res.suggestions || [];
      }
      setSuggestionsByPillar(suggestionsMap);
      const initial = {};
      selected.forEach((p) => { initial[p] = { title: '', notes: '', estimate_value: '30', estimate_unit: 'days' }; });
      setGoalsByPillar(initial);
      setStep(2);
    } catch (e) {
      setErr(e?.message || 'Could not load suggestions');
    } finally { setBusy(false); }
  };

  const updateGoal = (pillar, field, value) => {
    setGoalsByPillar((curr) => ({ ...curr, [pillar]: { ...curr[pillar], [field]: value } }));
  };

  const finish = async () => {
    setErr(''); setBusy(true);
    try {
      for (const p of selected) {
        const g = goalsByPillar[p];
        if (!g.title.trim()) continue;
        await api.createGoal({
          pillar: p, title: g.title, notes: g.notes,
          estimate_value: Number(g.estimate_value), estimate_unit: g.estimate_unit,
        });
      }
      await api.setSelectedPillars(selected);
      await refresh();
      router.replace('/dashboard');
    } catch (e) {
      setErr(e?.message || 'Could not save');
    } finally { setBusy(false); }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }]}
    >
      <Pressable
        onPress={() => {
          if (step === 2) { setErr(''); setStep(1); return; }
          router.replace('/dashboard');
        }}
        hitSlop={10}
        style={styles.backBtn}
      >
        <ArrowLeft size={16} strokeWidth={1.5} color={colors.subtext} />
        <Text style={styles.backText}>{step === 2 ? 'Back' : 'Dashboard'}</Text>
      </Pressable>
      <Text style={styles.eyebrow}>Step {step} of 2</Text>
      <Text style={styles.h1}>
        {step === 1 ? 'Choose your pillars' : 'Plant your first goals'}
      </Text>
      <Text style={styles.sub}>
        {step === 1
          ? 'Pick the areas of life you want to nourish first.'
          : 'One intention for each pillar. Be specific.'}
      </Text>

      {err ? (
        <View style={styles.errBox}><Text style={styles.errText}>{err}</Text></View>
      ) : null}

      {step === 1 && (
        <View style={{ marginTop: 24, gap: 12 }}>
          {pillars.map((p) => {
            const Icon = ICON_MAP[p.key] || Sparkles;
            const isSel = selected.includes(p.key);
            return (
              <Pressable key={p.key} onPress={() => togglePillar(p.key)}>
                <Card style={[
                  { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18 },
                  isSel && { borderColor: colors.primary, backgroundColor: withAlpha(colors.primary, 0.06) },
                ]}>
                  <View style={[
                    styles.pillarIcon,
                    isSel && { backgroundColor: withAlpha(colors.primary, 0.18), borderColor: colors.primary },
                  ]}>
                    <Icon size={20} strokeWidth={1.5} color={isSel ? colors.primary : colors.secondary} />
                  </View>
                  <Text style={[styles.pillarLabel, isSel && { color: colors.primary }]}>{p.label}</Text>
                  {isSel && <Check size={18} strokeWidth={2} color={colors.primary} />}
                </Card>
              </Pressable>
            );
          })}
          <Button onPress={advanceToGoals} disabled={busy || selected.length === 0} style={{ marginTop: 8 }}>
            Continue
          </Button>
        </View>
      )}

      {step === 2 && (
        <View style={{ marginTop: 16, gap: 18 }}>
          {selected.map((pkey) => {
            const pillar = pillars.find((p) => p.key === pkey);
            const goal = goalsByPillar[pkey] || {};
            const sugg = suggestionsByPillar[pkey] || [];
            const Icon = ICON_MAP[pkey] || Sparkles;
            return (
              <Card key={pkey} style={{ padding: 18, gap: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Icon size={18} strokeWidth={1.5} color={colors.primary} />
                  <Text style={{ fontFamily: fonts.display, fontSize: 18, color: colors.text }}>
                    {pillar?.label}
                  </Text>
                </View>

                {sugg.length > 0 && (
                  <View style={{ gap: 6 }}>
                    <Label>Suggestions</Label>
                    {sugg.slice(0, 3).map((s) => (
                      <Pressable key={s} onPress={() => updateGoal(pkey, 'title', s)}>
                        <View style={styles.suggestion}>
                          <Text style={{ color: colors.text, fontSize: 13, fontFamily: fonts.body }}>{s}</Text>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                )}

                <View>
                  <Label>Goal title</Label>
                  <Input
                    value={goal.title}
                    onChangeText={(v) => updateGoal(pkey, 'title', v)}
                    placeholder="What will you commit to?"
                  />
                </View>
                <View>
                  <Label>Why this matters (optional)</Label>
                  <Textarea
                    value={goal.notes}
                    onChangeText={(v) => updateGoal(pkey, 'notes', v)}
                    placeholder="The deeper intention…"
                    style={{ minHeight: 80 }}
                  />
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Label>Duration</Label>
                    <Input
                      value={String(goal.estimate_value || '')}
                      onChangeText={(v) => updateGoal(pkey, 'estimate_value', v.replace(/[^0-9]/g, ''))}
                      keyboardType="number-pad"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Label>Unit</Label>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {['days', 'hours'].map((u) => (
                        <Pressable
                          key={u}
                          onPress={() => updateGoal(pkey, 'estimate_unit', u)}
                          style={[
                            styles.unitChip,
                            goal.estimate_unit === u && { backgroundColor: colors.primary, borderColor: colors.primary },
                          ]}
                        >
                          <Text style={[
                            { color: colors.text, fontSize: 13, fontFamily: fonts.bodyMedium },
                            goal.estimate_unit === u && { color: colors.white },
                          ]}>{u}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                </View>
              </Card>
            );
          })}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button variant="secondary" onPress={() => setStep(1)} style={{ flex: 1 }}>Back</Button>
            <Button onPress={finish} disabled={busy} style={{ flex: 2 }}>
              {busy ? 'Planting…' : 'Begin'}
            </Button>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, maxWidth: 640, width: '100%', alignSelf: 'center' },
  eyebrow: {
    fontSize: 11, letterSpacing: 1.6, textTransform: 'uppercase',
    color: colors.subtext, fontFamily: fonts.bodyMedium,
  },
  h1: { fontFamily: fonts.display, fontSize: 30, color: colors.text, marginTop: 8 },
  sub: { color: colors.subtext, fontSize: 14, marginTop: 6, fontFamily: fonts.body, lineHeight: 22 },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', paddingVertical: 6, paddingRight: 10, marginBottom: 8,
  },
  backText: { color: colors.subtext, fontSize: 13, fontFamily: fonts.bodyMedium },
  pillarIcon: {
    height: 40, width: 40, borderRadius: radius.lg,
    backgroundColor: withAlpha(colors.secondary, 0.12), borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  pillarLabel: { flex: 1, color: colors.text, fontFamily: fonts.bodyMedium, fontSize: 15 },
  suggestion: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, padding: 10,
  },
  unitChip: {
    flex: 1, paddingVertical: 12, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.xl, alignItems: 'center', backgroundColor: colors.card,
  },
  errBox: {
    backgroundColor: colors.dangerSoft, borderWidth: 1, borderColor: colors.dangerBorder,
    padding: 12, borderRadius: radius.xl, marginTop: 16,
  },
  errText: { color: colors.danger, fontSize: 13, fontFamily: fonts.body },
});
