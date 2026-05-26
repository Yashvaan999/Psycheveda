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
import { Button, Textarea } from '@/components/ui';
import { createGratitudeEntry } from '@/lib/api';

const PERIODS = [
  { id: 'morning', label: 'Morning', icon: 'sunny-outline' as const },
  { id: 'evening', label: 'Evening', icon: 'moon-outline' as const },
];

const PROMPTS = [
  'I am grateful for...',
  'Something that made me smile today...',
  'A person I appreciate...',
  'A small joy I noticed...',
  'Something my body did well today...',
];

export default function GratitudeScreen() {
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState('morning');
  const [blessing1, setBlessing1] = useState('');
  const [blessing2, setBlessing2] = useState('');
  const [blessing3, setBlessing3] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    if (!blessing1.trim() || !blessing2.trim() || !blessing3.trim()) {
      Alert.alert('Complete all three', 'Please fill in all three blessings before saving.');
      return;
    }
    setLoading(true);
    try {
      await createGratitudeEntry({
        blessing_1: blessing1.trim(),
        blessing_2: blessing2.trim(),
        blessing_3: blessing3.trim(),
        period,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSubmitted(true);
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not save gratitude entry');
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setBlessing1('');
    setBlessing2('');
    setBlessing3('');
    setSubmitted(false);
  }

  if (submitted) {
    return (
      <View style={[styles.container, styles.successWrap, { paddingTop: insets.top }]}>
        <View style={styles.successAura}>
          <Ionicons name="heart" size={56} color={colors.primary} />
        </View>
        <Text style={styles.successTitle}>Blessings Received</Text>
        <Text style={styles.successSubtitle}>
          Your gratitude ritual is complete.{'\n'}+5 Bless Points earned.
        </Text>
        <TouchableOpacity
          style={styles.historyBtn}
          onPress={() => router.push('/gratitude-history')}
          activeOpacity={0.78}
        >
          <Ionicons name="time-outline" size={18} color={colors.primary} />
          <Text style={styles.historyBtnText}>View History</Text>
        </TouchableOpacity>
        <Button title="New Ritual" onPress={handleReset} variant="ghost" style={{ marginTop: 12 }} />
      </View>
    );
  }

  const randomPrompt = (idx: number) => PROMPTS[idx % PROMPTS.length];

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
          <Text style={styles.title}>Gratitude</Text>
          <Text style={styles.subtitle}>Three Blessings Practice</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/gratitude-history')} activeOpacity={0.7}>
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

      {/* Intro */}
      <View style={styles.introCard}>
        <Text style={styles.introText}>
          "Gratitude turns what we have into enough." Write three specific things you are grateful for today.
        </Text>
      </View>

      {/* Blessings */}
      {[
        { label: 'First Blessing', value: blessing1, setter: setBlessing1, idx: 0 },
        { label: 'Second Blessing', value: blessing2, setter: setBlessing2, idx: 1 },
        { label: 'Third Blessing', value: blessing3, setter: setBlessing3, idx: 2 },
      ].map(({ label, value, setter, idx }) => (
        <View key={label} style={styles.blessingBlock}>
          <View style={styles.blessingHeader}>
            <View style={styles.blessingNum}>
              <Text style={styles.blessingNumText}>{idx + 1}</Text>
            </View>
            <Text style={styles.blessingLabel}>{label}</Text>
          </View>
          <Textarea
            placeholder={randomPrompt(idx)}
            value={value}
            onChangeText={setter}
            minHeight={80}
            containerStyle={{ marginBottom: 0 }}
          />
        </View>
      ))}

      <Button
        title="Complete Ritual"
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
  periodRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
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
  introCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.primaryMid,
  },
  introText: { fontFamily: 'Lora_400Regular', fontSize: 14, color: colors.text, lineHeight: 22, fontStyle: 'italic' },
  blessingBlock: { marginBottom: 20 },
  blessingHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  blessingNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primaryMid,
  },
  blessingNumText: { fontFamily: 'Inter_700Bold', fontSize: 13, color: colors.primary },
  blessingLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.text },
  successWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  successAura: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: colors.primaryMid,
  },
  successTitle: { fontFamily: 'Lora_700Bold', fontSize: 28, color: colors.text, marginBottom: 10 },
  successSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 15, color: colors.subtext, textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  historyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  historyBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.primary },
});
