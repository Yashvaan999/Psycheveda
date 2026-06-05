import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ChevronDown, ChevronUp, Check, Circle } from 'lucide-react-native';
import { fmtDate } from '../lib/utils';
import { colors, fonts, radius } from '../lib/theme';

export default function ElevateSubtaskHistory({ history, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  if (!history?.length) return null;

  return (
    <View style={styles.wrap}>
      <Pressable onPress={() => setOpen((v) => !v)} style={styles.toggle}>
        <Text style={styles.toggleText}>
          Sub-task history ({history.length} {history.length === 1 ? 'day' : 'days'})
        </Text>
        {open
          ? <ChevronUp size={14} strokeWidth={1.5} color={colors.subtext} />
          : <ChevronDown size={14} strokeWidth={1.5} color={colors.subtext} />}
      </Pressable>
      {open && history.map((day) => (
        <View key={day.dateStr} style={styles.day}>
          <View style={styles.dayHead}>
            <Text style={styles.date}>{fmtDate(`${day.dateStr}T12:00:00`)}</Text>
            <Text style={styles.dayStat}>
              {day.completed}/{day.total} done
              {day.missed > 0 ? ` · ${day.missed} missed` : ''}
              {day.pending > 0 ? ` · ${day.pending} pending` : ''}
            </Text>
          </View>
          {day.subtasks.map((st) => (
            <View key={st.id} style={styles.subRow}>
              {st.status === 'completed' ? (
                <Check size={12} strokeWidth={2.5} color={colors.emerald} />
              ) : st.status === 'missed' ? (
                <Circle size={12} strokeWidth={1.5} color={colors.danger} />
              ) : (
                <Circle size={12} strokeWidth={1.5} color={colors.subtext} />
              )}
              <Text
                style={[
                  styles.subTitle,
                  st.status === 'completed' && { color: colors.emerald },
                  st.status === 'missed' && { color: colors.danger },
                ]}
                numberOfLines={2}
              >
                {st.title}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 4 },
  toggle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 8,
  },
  toggleText: { fontSize: 12, color: colors.primary, fontFamily: fonts.bodyMedium },
  day: {
    marginTop: 8, padding: 12, borderRadius: radius.lg,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
  },
  dayHead: { marginBottom: 6 },
  date: { fontSize: 13, color: colors.text, fontFamily: fonts.bodyMedium },
  dayStat: { fontSize: 11, color: colors.subtext, fontFamily: fonts.body, marginTop: 2 },
  subRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 6 },
  subTitle: { flex: 1, fontSize: 12, color: colors.text, fontFamily: fonts.body, lineHeight: 18 },
});
