import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/constants/colors';
import { Card, Button, Textarea, Badge, Divider } from '@/components/ui';
import { getGoal, updateGoal, deleteGoal, logProgress, listProgressLogs, PILLAR_LABELS } from '@/lib/api';

interface MiniTask { id: string; title: string; is_done: boolean; day_number: number; }
interface ProgressLog { id: string; logged_at: string; note?: string; mood?: number; }
interface Goal {
  id: string;
  title: string;
  pillar_id: string;
  duration_days: number;
  notes?: string;
  completion_pct?: number;
  mini_tasks?: MiniTask[];
}

function pct(goal: Goal, logCount: number) {
  if (goal.completion_pct != null) return Math.min(100, Math.round(goal.completion_pct));
  const done = (goal.mini_tasks ?? []).filter((t) => t.is_done).length || logCount;
  return Math.min(100, Math.round((done / (goal.duration_days || 30)) * 100));
}

export default function GoalDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [logs, setLogs] = useState<ProgressLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [logNote, setLogNote] = useState('');
  const [logMood, setLogMood] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [logging, setLogging] = useState(false);

  async function load() {
    if (!id) return;
    try {
      const [g, l] = await Promise.all([getGoal(id), listProgressLogs(id)]);
      setGoal(g as Goal);
      setLogs(l as ProgressLog[]);
      setEditTitle(g.title);
      setEditNotes(g.notes ?? '');
    } catch {
      Alert.alert('Error', 'Could not load goal');
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [id]));

  async function handleSaveEdit() {
    if (!editTitle.trim() || !goal) return;
    setSaving(true);
    try {
      const updated = await updateGoal(goal.id, { title: editTitle.trim(), notes: editNotes.trim() });
      setGoal((prev) => prev ? { ...prev, ...updated } : null);
      setEditing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  }

  async function handleLogProgress() {
    if (!goal) return;
    setLogging(true);
    try {
      const entry = await logProgress(goal.id, { note: logNote.trim() || undefined, mood: logMood ?? undefined });
      setLogs((prev) => [entry as ProgressLog, ...prev]);
      setLogNote('');
      setLogMood(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not log progress');
    } finally {
      setLogging(false);
    }
  }

  async function handleDelete() {
    if (!goal) return;
    Alert.alert('Delete Goal', 'This will permanently delete this goal and all its data. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteGoal(goal.id);
            router.back();
          } catch (err: unknown) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Could not delete');
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={[styles.loadingWrap, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!goal) {
    return (
      <View style={[styles.loadingWrap, { paddingTop: insets.top }]}>
        <Text style={{ fontFamily: 'Inter_400Regular', color: colors.subtext }}>Goal not found</Text>
      </View>
    );
  }

  const progress = pct(goal, logs.length);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Goal Overview */}
      <Card style={{ marginBottom: 16 }}>
        <View style={styles.goalHeader}>
          <Badge label={PILLAR_LABELS[goal.pillar_id] ?? goal.pillar_id} />
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => setEditing((e) => !e)} activeOpacity={0.7} style={styles.iconBtn}>
              <Ionicons name={editing ? 'close-outline' : 'create-outline'} size={22} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} activeOpacity={0.7} style={styles.iconBtn}>
              <Ionicons name="trash-outline" size={22} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        {editing ? (
          <>
            <Textarea
              label="Goal Title"
              value={editTitle}
              onChangeText={setEditTitle}
              minHeight={60}
            />
            <Textarea
              label="Notes"
              value={editNotes}
              onChangeText={setEditNotes}
              placeholder="Additional notes..."
              minHeight={80}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button title="Save" onPress={handleSaveEdit} loading={saving} style={{ flex: 1 }} size="sm" />
              <Button title="Cancel" onPress={() => setEditing(false)} variant="ghost" style={{ flex: 1 }} size="sm" />
            </View>
          </>
        ) : (
          <>
            <Text style={styles.goalTitle}>{goal.title}</Text>
            {goal.notes ? <Text style={styles.goalNotes}>{goal.notes}</Text> : null}
            <View style={styles.progressRow}>
              <Text style={styles.progressPct}>{progress}% complete</Text>
              <Text style={styles.progressDays}>{goal.duration_days}d journey</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
          </>
        )}
      </Card>

      {/* Log Progress */}
      <Card style={{ marginBottom: 16 }}>
        <Text style={styles.sectionTitle}>Log Progress</Text>
        <Textarea
          placeholder="How did today go? What did you do toward this goal?"
          value={logNote}
          onChangeText={setLogNote}
          minHeight={80}
        />
        <View style={styles.moodRow}>
          <Text style={styles.moodLabel}>Mood</Text>
          {[1, 2, 3, 4, 5].map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setLogMood(m); }}
              activeOpacity={0.7}
              style={[styles.moodBtn, logMood === m && styles.moodBtnActive]}
            >
              <Text style={[styles.moodBtnText, logMood === m && styles.moodBtnTextActive]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Button title="Log Entry" onPress={handleLogProgress} loading={logging} size="sm" style={{ marginTop: 4 }} />
      </Card>

      {/* Progress History */}
      {logs.length > 0 && (
        <View>
          <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Progress History</Text>
          {logs.map((log, idx) => (
            <View key={log.id ?? idx} style={styles.logEntry}>
              <View style={styles.logDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.logDate}>
                  {new Date(log.logged_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  {log.mood != null ? `  ·  Mood ${log.mood}/5` : ''}
                </Text>
                {log.note ? <Text style={styles.logNote}>{log.note}</Text> : null}
              </View>
            </View>
          ))}
        </View>
      )}

      <Divider style={{ marginVertical: 20 }} />
      <Button title="Delete Goal" onPress={handleDelete} variant="danger" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerActions: { flexDirection: 'row', gap: 4 },
  iconBtn: { padding: 6 },
  goalTitle: { fontFamily: 'Lora_700Bold', fontSize: 20, color: colors.text, lineHeight: 28, marginBottom: 8 },
  goalNotes: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.subtext, lineHeight: 20, marginBottom: 12 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressPct: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.primary },
  progressDays: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.subtext },
  progressBar: { height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
  sectionTitle: { fontFamily: 'Lora_700Bold', fontSize: 16, color: colors.text, marginBottom: 14 },
  moodRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  moodLabel: { fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.subtext, flex: 1 },
  moodBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  moodBtnActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  moodBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.subtext },
  moodBtnTextActive: { color: colors.primary },
  logEntry: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  logDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary, marginTop: 5 },
  logDate: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.subtext, marginBottom: 4 },
  logNote: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.text, lineHeight: 20 },
});
