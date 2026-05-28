import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft, TrendingUp, Trash2, Edit3, Save, X, Plus,
} from 'lucide-react-native';
import api from '../../src/lib/api';
import AppShell from '../../src/components/AppShell';
import { Button, Card, Input, Textarea, Label, Badge } from '../../src/components/ui';
import TrackModal from '../../src/components/TrackModal';
import { formatDateLong, formatDateTime } from '../../src/lib/utils';
import { colors, fonts, radius, withAlpha } from '../../src/lib/theme';

export default function GoalDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [goal, setGoal] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [edit, setEdit] = useState({});
  const [busy, setBusy] = useState(false);
  const [trackOpen, setTrackOpen] = useState(false);
  const [logNote, setLogNote] = useState('');
  const [showLogForm, setShowLogForm] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [g, l] = await Promise.all([api.getGoal(id), api.listProgressLogs(id)]);
      setGoal(g);
      setLogs(l);
      setEdit({
        title: g.title,
        estimate_value: String(g.estimate_value), estimate_unit: g.estimate_unit,
        notes: g.notes || '',
      });
    } catch (e) { console.warn(e); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setBusy(true);
    try {
      await api.updateGoal(id, edit);
      setEditing(false);
      load();
    } catch (e) { console.warn(e); }
    finally { setBusy(false); }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.deleteGoal(id);
      router.back();
    } catch (e) { console.warn(e); }
    finally { setBusy(false); }
  };

  const [logErr, setLogErr] = useState('');
  const logProgress = async () => {
    if (!logNote.trim()) { setLogErr('Add a short note about today\'s progress.'); return; }
    setLogErr(''); setBusy(true);
    try {
      await api.logProgress(id, logNote);
      setLogNote('');
      setShowLogForm(false);
      load();
    } catch (e) { setLogErr(e?.message || 'Could not log'); }
    finally { setBusy(false); }
  };

  if (loading || !goal) {
    return (
      <AppShell>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <View style={styles.head}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <ArrowLeft size={20} strokeWidth={1.5} color={colors.subtext} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Badge tone="sage">{goal.pillar_label}</Badge>
        </View>
        <Pressable onPress={() => setTrackOpen(true)} hitSlop={10} style={styles.iconBtn}>
          <TrendingUp size={16} strokeWidth={1.5} color={colors.primary} />
        </Pressable>
        <Pressable onPress={() => setEditing((v) => !v)} hitSlop={10} style={styles.iconBtn}>
          {editing
            ? <X size={16} strokeWidth={1.5} color={colors.subtext} />
            : <Edit3 size={16} strokeWidth={1.5} color={colors.subtext} />}
        </Pressable>
      </View>

      <Card style={{ marginTop: 16, gap: 12 }}>
        {editing ? (
          <>
            <View>
              <Label>Title</Label>
              <Input value={edit.title} onChangeText={(v) => setEdit({ ...edit, title: v })} />
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Label>Duration</Label>
                <Input
                  value={edit.estimate_value}
                  onChangeText={(v) => setEdit({ ...edit, estimate_value: v.replace(/[^0-9]/g, '') })}
                  keyboardType="number-pad"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Label>Unit</Label>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {['days', 'hours'].map((u) => (
                    <Pressable
                      key={u}
                      onPress={() => setEdit({ ...edit, estimate_unit: u })}
                      style={[
                        styles.unitChip,
                        edit.estimate_unit === u && { backgroundColor: colors.primary, borderColor: colors.primary },
                      ]}
                    >
                      <Text style={[
                        { color: colors.text, fontSize: 13, fontFamily: fonts.bodyMedium },
                        edit.estimate_unit === u && { color: colors.white },
                      ]}>{u}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
            <View>
              <Label>Notes</Label>
              <Textarea
                value={edit.notes}
                onChangeText={(v) => setEdit({ ...edit, notes: v })}
                placeholder="Private notes…"
                style={{ minHeight: 80 }}
              />
            </View>
            <Button onPress={save} disabled={busy}>
              {busy ? 'Saving…' : 'Save changes'}
            </Button>
          </>
        ) : (
          <>
            <Text style={styles.title}>{goal.title}</Text>
            <View style={styles.meta}>
              <Text style={styles.metaText}>
                {goal.estimate_value} {goal.estimate_unit} commitment
              </Text>
              <Text style={styles.metaText}>·</Text>
              <Text style={styles.metaText}>Deadline {formatDateLong(goal.deadline_at)}</Text>
            </View>
            {goal.notes ? (
              <View style={styles.noteBox}>
                <Text style={styles.label}>Notes</Text>
                <Text style={styles.body}>{goal.notes}</Text>
              </View>
            ) : null}
          </>
        )}
      </Card>

      {/* Progress logging */}
      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Progress logs</Text>
          <Pressable onPress={() => setShowLogForm((v) => !v)} style={styles.addBtn}>
            <Plus size={14} strokeWidth={2} color={colors.primary} />
          </Pressable>
        </View>

        {showLogForm && (
          <Card style={{ gap: 10 }}>
            <Label>Today's progress</Label>
            <Textarea
              value={logNote} onChangeText={(v) => { setLogNote(v); if (logErr) setLogErr(''); }}
              placeholder="What did you do today?"
              style={{ minHeight: 80 }}
            />
            {logErr ? <Text style={{ color: colors.danger, fontSize: 13, fontFamily: fonts.body }}>{logErr}</Text> : null}
            <Button onPress={logProgress} disabled={busy || !logNote.trim()}>
              {busy ? 'Logging…' : 'Log progress'}
            </Button>
          </Card>
        )}

        {logs.length === 0 ? (
          <Card style={{ marginTop: 10 }}>
            <Text style={{ color: colors.subtext, fontFamily: fonts.body }}>
              No progress logged yet. Start with one small action today.
            </Text>
          </Card>
        ) : (
          <View style={{ gap: 8, marginTop: 10 }}>
            {logs.map((l) => (
              <Card key={l.id} style={{ padding: 14 }}>
                <Text style={styles.metaText}>{formatDateTime(l.logged_at)}</Text>
                {l.note ? <Text style={[styles.body, { marginTop: 6 }]}>{l.note}</Text> : null}
              </Card>
            ))}
          </View>
        )}
      </View>

      <Button variant="danger" onPress={remove} disabled={busy} style={{ marginTop: 32 }}>
        <Trash2 size={16} strokeWidth={1.5} color={colors.danger} />
        <Text style={{ color: colors.danger, marginLeft: 6, fontFamily: fonts.bodyMedium }}>Delete goal</Text>
      </Button>

      {trackOpen && <TrackModal onClose={() => setTrackOpen(false)} goalId={id} />}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: {
    height: 32, width: 32, borderRadius: radius.pill,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontFamily: fonts.display, fontSize: 24, color: colors.text },
  body: { color: colors.text, fontSize: 14, fontFamily: fonts.body, lineHeight: 22 },
  meta: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 4 },
  metaText: { color: colors.subtext, fontSize: 12, fontFamily: fonts.body },
  label: {
    fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase',
    color: colors.subtext, fontFamily: fonts.bodyMedium, marginBottom: 4,
  },
  noteBox: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, padding: 12, marginTop: 8,
  },
  section: { marginTop: 24 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontFamily: fonts.display, fontSize: 18, color: colors.text },
  addBtn: {
    height: 28, width: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: withAlpha(colors.primary, 0.12),
    borderWidth: 1, borderColor: withAlpha(colors.primary, 0.30),
  },
  unitChip: {
    flex: 1, paddingVertical: 12, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.xl, alignItems: 'center', backgroundColor: colors.card,
  },
});
