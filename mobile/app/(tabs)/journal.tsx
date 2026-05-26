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
import { Button, Textarea, SectionHeader } from '@/components/ui';
import { createJournalEntry } from '@/lib/api';

const PERIODS = [
  { id: 'morning', label: 'Morning', icon: 'sunny-outline' as const },
  { id: 'evening', label: 'Evening', icon: 'moon-outline' as const },
];

const PIPELINE_STEPS = [
  { key: 'situation', label: 'Situation', placeholder: 'Briefly describe what happened or what you\'re thinking about...', required: true },
  { key: 'natural_emotion', label: 'Natural Emotion', placeholder: 'What did you feel initially? (e.g., anxious, angry, sad...)', required: true },
  { key: 'initial_frame', label: 'Initial Frame', placeholder: 'What story did your mind tell you about this?', required: false },
  { key: 'nlp_frame', label: 'NLP Reframe', placeholder: 'Now reframe this experience — what could it mean from a growth perspective?', required: false },
  { key: 'ease', label: 'Ease', placeholder: 'What can you let go of? What feels lighter now?', required: false },
  { key: 'end_feeling', label: 'End Feeling', placeholder: 'How do you feel after this reflection?', required: false },
  { key: 'bless_gratitude', label: 'Gratitude Blessing', placeholder: 'What are you grateful for from this experience?', required: false },
];

export default function JournalScreen() {
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState('morning');
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function setValue(key: string, val: string) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSubmit() {
    if (!values.situation?.trim()) {
      Alert.alert('Situation required', 'Please describe your situation before saving.');
      return;
    }
    if (!values.natural_emotion?.trim()) {
      Alert.alert('Emotion required', 'Please describe your initial emotion.');
      return;
    }
    setLoading(true);
    try {
      await createJournalEntry({
        period,
        situation: values.situation ?? '',
        natural_emotion: values.natural_emotion ?? '',
        initial_frame: values.initial_frame,
        nlp_frame: values.nlp_frame,
        ease: values.ease,
        end_feeling: values.end_feeling,
        bless_gratitude: values.bless_gratitude,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSubmitted(true);
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not save journal entry');
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setValues({});
    setSubmitted(false);
  }

  if (submitted) {
    return (
      <View style={[styles.container, styles.successWrap, { paddingTop: insets.top }]}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={64} color={colors.secondary} />
        </View>
        <Text style={styles.successTitle}>Entry Saved</Text>
        <Text style={styles.successSubtitle}>
          Your reflection has been recorded.{'\n'}+10 Bless Points earned.
        </Text>
        <TouchableOpacity
          style={styles.historyBtn}
          onPress={() => router.push('/journal-history')}
          activeOpacity={0.78}
        >
          <Ionicons name="time-outline" size={18} color={colors.primary} />
          <Text style={styles.historyBtnText}>View History</Text>
        </TouchableOpacity>
        <Button title="New Entry" onPress={handleReset} variant="ghost" style={{ marginTop: 12 }} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Journal</Text>
          <Text style={styles.subtitle}>NLP · CBT · Vedic Reflection</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/journal-history')} activeOpacity={0.7}>
          <Ionicons name="time-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Period */}
      <View style={styles.periodRow}>
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p.id}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPeriod(p.id); }}
            activeOpacity={0.75}
            style={[styles.periodChip, period === p.id && styles.periodChipActive]}
          >
            <Ionicons name={p.icon} size={16} color={period === p.id ? colors.primary : colors.subtext} />
            <Text style={[styles.periodText, period === p.id && styles.periodTextActive]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Pipeline Steps */}
      {PIPELINE_STEPS.map((step, idx) => (
        <View key={step.key} style={styles.stepBlock}>
          <View style={styles.stepHeader}>
            <View style={styles.stepNum}>
              <Text style={styles.stepNumText}>{idx + 1}</Text>
            </View>
            <Text style={styles.stepLabel}>
              {step.label}
              {step.required && <Text style={{ color: colors.primary }}> *</Text>}
            </Text>
          </View>
          <Textarea
            placeholder={step.placeholder}
            value={values[step.key] ?? ''}
            onChangeText={(v) => setValue(step.key, v)}
            minHeight={80}
            containerStyle={{ marginBottom: 0 }}
          />
        </View>
      ))}

      <Button
        title="Save Entry"
        onPress={handleSubmit}
        loading={loading}
        size="lg"
        style={{ marginTop: 8 }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title: { fontFamily: 'Lora_700Bold', fontSize: 28, color: colors.text },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.subtext, marginTop: 2, letterSpacing: 0.5 },
  periodRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  periodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  periodChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  periodText: { fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.subtext },
  periodTextActive: { color: colors.primary },
  stepBlock: { marginBottom: 20 },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: { fontFamily: 'Inter_700Bold', fontSize: 12, color: colors.primary },
  stepLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.text },
  successWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  successIcon: { marginBottom: 20 },
  successTitle: { fontFamily: 'Lora_700Bold', fontSize: 28, color: colors.text, marginBottom: 10 },
  successSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 15, color: colors.subtext, textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  historyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  historyBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.primary },
});
