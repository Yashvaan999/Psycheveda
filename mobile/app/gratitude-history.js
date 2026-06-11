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
import { Card } from '../src/components/ui';
import BlessIcon from '../src/components/BlessIcon';
import { fmtDate, fmtTime } from '../src/lib/utils';
import { colors, fonts } from '../src/lib/theme';

const RECENT_LIMIT = 3;

function EntryCard({ entry }) {
  return (
    <Card style={{ padding: 16, gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <BlessIcon size={14} />
          <Text style={{ color: colors.primary, fontSize: 12, fontFamily: fonts.bodyMedium }}>+15 Bless</Text>
        </View>
        <Text style={styles.time}>{fmtTime(entry.created_at)}</Text>
      </View>
      {[entry.point_1, entry.point_2, entry.point_3].map((b, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
          <Text style={{ color: colors.primary, fontFamily: fonts.bodyMedium, fontSize: 13 }}>{i + 1}.</Text>
          <Text style={{ flex: 1, color: colors.text, fontSize: 14, fontFamily: fonts.body, lineHeight: 22 }}>{b}</Text>
        </View>
      ))}
    </Card>
  );
}

export default function GratitudeHistory() {
  const router = useRouter();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appliedRange, setAppliedRange] = useState(null);

  const range = useDateRangeSelection(appliedRange);

  const loadRecent = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.listGratitude({ limit: RECENT_LIMIT });
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
      const data = await api.listGratitude({ from, to });
      setGroups(data);
      setAppliedRange({ from, to });
    } catch (e) {
      console.warn(e);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRecent(); }, [loadRecent]);

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
            <Text style={styles.h1}>Gratitude history</Text>
            <DateRangeCalendarButton active={!!appliedRange} onPress={range.openCalendar} />
          </View>
          <Text style={styles.sub}>Every blessing remembered.</Text>
        </View>
      </View>

      <DateRangeChip range={appliedRange} onClear={clearRange} />

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : groups.length === 0 ? (
        <Card style={{ marginTop: 20 }}>
          <Text style={{ color: colors.subtext, fontFamily: fonts.body }}>
            {appliedRange
              ? 'No blessings in this date range.'
              : 'No blessings logged yet.'}
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
  time: { color: colors.subtext, fontSize: 11, fontFamily: fonts.body },
});
