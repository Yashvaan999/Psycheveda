import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/constants/colors';
import { Button, Input } from '@/components/ui';
import {
  PILLAR_LABELS,
  PILLAR_ICONS,
  SUGGESTIONS,
  setSelectedPillars,
  createGoal,
  upsertProfile,
} from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const PILLARS = Object.keys(PILLAR_LABELS);

interface GoalDraft {
  pillar_id: string;
  title: string;
  duration_days: number;
  custom: boolean;
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { refresh } = useAuth();
  const [step, setStep] = useState<'pillars' | 'goals'>('pillars');
  const [selectedPillars, setSelectedPillarsLocal] = useState<string[]>([]);
  const [goals, setGoals] = useState<GoalDraft[]>([]);
  const [loading, setLoading] = useState(false);

  function togglePillar(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPillarsLocal((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  function proceedToGoals() {
    if (selectedPillars.length === 0) {
      Alert.alert('Select at least one pillar', 'Choose the areas of your life you want to focus on.');
      return;
    }
    const drafts: GoalDraft[] = selectedPillars.map((pid) => ({
      pillar_id: pid,
      title: SUGGESTIONS[pid]?.[0] ?? '',
      duration_days: 30,
      custom: false,
    }));
    setGoals(drafts);
    setStep('goals');
  }

  function updateGoal(pillarId: string, field: 'title' | 'duration_days', value: string | number) {
    setGoals((prev) =>
      prev.map((g) =>
        g.pillar_id === pillarId ? { ...g, [field]: value, custom: field === 'title' ? true : g.custom } : g
      )
    );
  }

  function selectSuggestion(pillarId: string, suggestion: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setGoals((prev) =>
      prev.map((g) => (g.pillar_id === pillarId ? { ...g, title: suggestion, custom: false } : g))
    );
  }

  async function handleFinish() {
    const invalid = goals.find((g) => !g.title.trim());
    if (invalid) {
      Alert.alert('Missing goal', `Add a goal for ${PILLAR_LABELS[invalid.pillar_id]}`);
      return;
    }
    setLoading(true);
    try {
      await setSelectedPillars(selectedPillars);
      for (const g of goals) {
        await createGoal({ title: g.title.trim(), pillar_id: g.pillar_id, duration_days: g.duration_days });
      }
      await upsertProfile({ onboarding_complete: true });
      await refresh();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        {step === 'goals' && (
          <TouchableOpacity onPress={() => setStep('pillars')} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color={colors.primary} />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>{step === 'pillars' ? 'Choose Your Pillars' : 'Set Your Goals'}</Text>
        <Text style={styles.subtitle}>
          {step === 'pillars'
            ? 'Select the life areas you want to transform'
            : 'Define one intention for each pillar'}
        </Text>
        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, step === 'pillars' && styles.stepDotActive]} />
          <View style={[styles.stepDot, step === 'goals' && styles.stepDotActive]} />
        </View>
      </View>

      {step === 'pillars' ? (
        <>
          <View style={styles.pillarsGrid}>
            {PILLARS.map((id) => {
              const selected = selectedPillars.includes(id);
              return (
                <TouchableOpacity
                  key={id}
                  onPress={() => togglePillar(id)}
                  activeOpacity={0.8}
                  style={[styles.pillarCard, selected && styles.pillarCardSelected]}
                >
                  <View style={[styles.pillarIconWrap, selected && styles.pillarIconSelected]}>
                    <Ionicons
                      name={PILLAR_ICONS[id] as 'sparkles-outline'}
                      size={24}
                      color={selected ? colors.white : colors.primary}
                    />
                  </View>
                  <Text style={[styles.pillarLabel, selected && styles.pillarLabelSelected]}>
                    {PILLAR_LABELS[id]}
                  </Text>
                  {selected && (
                    <View style={styles.pillarCheck}>
                      <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          <Button title={`Continue (${selectedPillars.length} selected)`} onPress={proceedToGoals} size="lg" style={{ marginTop: 8 }} />
        </>
      ) : (
        <>
          {goals.map((g) => (
            <View key={g.pillar_id} style={styles.goalBlock}>
              <View style={styles.goalBlockHeader}>
                <Ionicons name={PILLAR_ICONS[g.pillar_id] as 'sparkles-outline'} size={18} color={colors.primary} />
                <Text style={styles.goalBlockTitle}>{PILLAR_LABELS[g.pillar_id]}</Text>
              </View>

              <Text style={styles.suggestionsLabel}>Quick picks</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {(SUGGESTIONS[g.pillar_id] ?? []).map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => selectSuggestion(g.pillar_id, s)}
                    activeOpacity={0.75}
                    style={[styles.suggestionChip, g.title === s && styles.suggestionChipActive]}
                  >
                    <Text style={[styles.suggestionText, g.title === s && styles.suggestionTextActive]} numberOfLines={2}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Input
                label="Custom goal"
                placeholder="Or write your own intention..."
                value={g.title}
                onChangeText={(v) => updateGoal(g.pillar_id, 'title', v)}
              />

              <View style={styles.durationRow}>
                {[21, 30, 60, 90].map((d) => (
                  <TouchableOpacity
                    key={d}
                    onPress={() => updateGoal(g.pillar_id, 'duration_days', d)}
                    activeOpacity={0.7}
                    style={[styles.durationChip, g.duration_days === d && styles.durationChipActive]}
                  >
                    <Text style={[styles.durationText, g.duration_days === d && styles.durationTextActive]}>
                      {d}d
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
          <Button title="Begin My Journey" onPress={handleFinish} loading={loading} size="lg" style={{ marginTop: 8 }} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20 },
  header: { marginBottom: 28 },
  backBtn: { marginBottom: 16 },
  title: { fontFamily: 'Lora_700Bold', fontSize: 28, color: colors.text, marginBottom: 8 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 15, color: colors.subtext, lineHeight: 22 },
  stepIndicator: { flexDirection: 'row', gap: 6, marginTop: 16 },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  stepDotActive: { backgroundColor: colors.primary, width: 24 },
  pillarsGrid: { gap: 12, marginBottom: 24 },
  pillarCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  pillarCardSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  pillarIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillarIconSelected: { backgroundColor: colors.primary },
  pillarLabel: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.text },
  pillarLabelSelected: { color: colors.primary },
  pillarCheck: { marginLeft: 'auto' },
  goalBlock: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  goalBlockHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  goalBlockTitle: { fontFamily: 'Lora_700Bold', fontSize: 16, color: colors.text },
  suggestionsLabel: { fontFamily: 'Inter_500Medium', fontSize: 11, color: colors.subtext, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 },
  suggestionChip: {
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
    maxWidth: 200,
    borderWidth: 1,
    borderColor: colors.border,
  },
  suggestionChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  suggestionText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.text },
  suggestionTextActive: { color: colors.primary, fontFamily: 'Inter_500Medium' },
  durationRow: { flexDirection: 'row', gap: 8 },
  durationChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  durationChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  durationText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.subtext },
  durationTextActive: { color: colors.primary },
});
