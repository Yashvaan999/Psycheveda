import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import api from '../src/lib/api';
import AppShell from '../src/components/AppShell';
import {
  DateRangeCalendarButton,
  DateRangeCalendarModal,
  DateRangeChip,
  useDateRangeSelection,
} from '../src/components/DateRangeCalendar';
import { Card, Badge } from '../src/components/ui';
import { fmtDate, fmtTime } from '../src/lib/utils';
import { colors, fonts } from '../src/lib/theme';

const RECENT_LIMIT = 3;

function EntryCard({ entry }) {
  return (
    <Card style={{ padding: 16, gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          <Badge tone="neutral">{entry.period}</Badge>
          <Badge tone="primary">{entry.nlp_frame}</Badge>
        </View>
        <Text style={styles.time}>{fmtTime(entry.created_at)}</Text>
      </View>
      <View>
        <Text style={styles.label}>Situation</Text>
        <Text style={styles.body}>{entry.situation}</Text>
      </View>
      <View>
        <Text style={styles.label}>Natural emotion</Text>
        <Text style={styles.body}>{entry.natural_emotion}</Text>
      </View>
      {entry.initial_frame ? (
        <View>
          <Text style={styles.label}>Initial frame</Text>
          <Text style={styles.body}>{entry.initial_frame}</Text>
        </View>
      ) : null}
      <View>
        <Text style={styles.label}>End feeling · ease {entry.ease_of_transition}/10</Text>
        <Text style={[styles.body, { color: colors.secondary, fontFamily: fonts.bodyMedium }]}>
          {entry.end_feeling}
        </Text>
      </View>
    </Card>
  );
}

export default function JournalHistory() {
  const router = useRouter();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appliedRange, setAppliedRange] = useState(null);

  const range = useDateRangeSelection(appliedRange);

  const loadRecent = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.listJournal({ limit: RECENT_LIMIT });
      setGroups(data);
      setAppliedRange(null);
    } catch (e) {
      console.warn(e);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRange = useCallback(async (from, to) => {
    setLoading(true);
    try {
      const data = await api.listJournal({ from, to });
      setGroups(data);
      setAppliedRange({ from, to });
    } catch (e) {
      console.warn(e);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => { loadRecent(); });
  }, [loadRecent]);

  const applyRange = async () => {
    const normalized = range.getNormalizedRange();
    if (!normalized) return;
    range.setCalendarOpen(false);
    await loadRange(normalized.from, normalized.to);
  };

  const clearRange = async () => {
    range.resetDraft();
    range.setCalendarOpen(false);
    await loadRecent();
  };

  return (
    <AppShell>
      <View style={styles.head}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <ArrowLeft size={20} strokeWidth={1.5} color={colors.subtext} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Text style={styles.h1}>Journal history</Text>
            <DateRangeCalendarButton active={!!appliedRange} onPress={range.openCalendar} />
          </View>
          <Text style={styles.sub}>Every reframing carried forward.</Text>
        </View>
      </View>

      <DateRangeChip range={appliedRange} onClear={clearRange} />

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : groups.length === 0 ? (
        <Card style={{ marginTop: 20 }}>
          <Text style={{ color: colors.subtext, fontFamily: fonts.body }}>
            {appliedRange
              ? 'No entries in this date range.'
              : 'No entries yet. Your first reframing awaits.'}
          </Text>
        </Card>
      ) : (
        <View style={{ marginTop: 16, gap: 20 }}>
          {groups.map((g) => (
            <View key={g.date} style={{ gap: 10 }}>
              <Text style={styles.dateHead}>{fmtDate(g.date)}</Text>
              {g.entries.map((e) => (
                <EntryCard key={e.id} entry={e} />
              ))}
            </View>
          ))}
        </View>
      )}

      <DateRangeCalendarModal
        open={range.calendarOpen}
        onClose={() => range.setCalendarOpen(false)}
        rangeStart={range.rangeStart}
        rangeEnd={range.rangeEnd}
        markedDates={range.markedDates}
        onDayPress={range.onDayPress}
        rangeReady={range.rangeReady}
        onApply={applyRange}
        appliedRange={appliedRange}
        onClearRecent={clearRange}
      />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  backBtn: { marginTop: 6 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  h1: { fontFamily: fonts.display, fontSize: 26, color: colors.text, flex: 1 },
  sub: { color: colors.subtext, fontSize: 13, fontFamily: fonts.body, marginTop: 2 },
  dateHead: {
    fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase',
    color: colors.subtext, fontFamily: fonts.bodyMedium,
  },
  label: {
    fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase',
    color: colors.subtext, fontFamily: fonts.bodyMedium, marginBottom: 4,
  },
  body: { color: colors.text, fontSize: 14, fontFamily: fonts.body, lineHeight: 22 },
  time: { color: colors.subtext, fontSize: 11, fontFamily: fonts.body },
});
