import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { CalendarRange } from 'lucide-react-native';
import { Calendar } from 'react-native-calendars';
import Modal from './Modal';
import { Button } from './ui';
import { formatDateLong } from '../lib/utils';
import { colors, fonts, radius, withAlpha } from '../lib/theme';

export function buildRangeMarks(start, end) {
  if (!start) return {};
  if (!end || start === end) {
    return {
      [start]: {
        startingDay: true,
        endingDay: true,
        color: colors.primary,
        textColor: colors.white,
      },
    };
  }
  const from = start <= end ? start : end;
  const to = start <= end ? end : start;
  const marked = {};
  const cursor = new Date(`${from}T12:00:00`);
  const endDate = new Date(`${to}T12:00:00`);
  while (cursor <= endDate) {
    const iso = cursor.toISOString().slice(0, 10);
    marked[iso] = {
      color: colors.primary,
      textColor: colors.white,
      startingDay: iso === from,
      endingDay: iso === to,
    };
    cursor.setDate(cursor.getDate() + 1);
  }
  return marked;
}

export function useDateRangeSelection(appliedRange) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');

  const markedDates = useMemo(
    () => buildRangeMarks(rangeStart, rangeEnd),
    [rangeStart, rangeEnd],
  );

  const openCalendar = useCallback(() => {
    if (appliedRange) {
      setRangeStart(appliedRange.from);
      setRangeEnd(appliedRange.to);
    } else {
      setRangeStart('');
      setRangeEnd('');
    }
    setCalendarOpen(true);
  }, [appliedRange]);

  const onDayPress = useCallback((day) => {
    const date = day.dateString;
    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(date);
      setRangeEnd('');
      return;
    }
    if (date < rangeStart) {
      setRangeEnd(rangeStart);
      setRangeStart(date);
      return;
    }
    setRangeEnd(date);
  }, [rangeStart, rangeEnd]);

  const getNormalizedRange = useCallback(() => {
    if (!rangeStart || !rangeEnd) return null;
    const from = rangeStart <= rangeEnd ? rangeStart : rangeEnd;
    const to = rangeStart <= rangeEnd ? rangeEnd : rangeStart;
    return { from, to };
  }, [rangeStart, rangeEnd]);

  const resetDraft = useCallback(() => {
    setRangeStart('');
    setRangeEnd('');
  }, []);

  return {
    calendarOpen,
    setCalendarOpen,
    rangeStart,
    rangeEnd,
    markedDates,
    onDayPress,
    rangeReady: !!rangeStart && !!rangeEnd,
    openCalendar,
    getNormalizedRange,
    resetDraft,
  };
}

export function DateRangeCalendarButton({ active, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityLabel="Select date range"
      style={[styles.calBtn, active && styles.calBtnActive]}
    >
      <CalendarRange
        size={18}
        strokeWidth={1.5}
        color={active ? colors.white : colors.primary}
      />
    </Pressable>
  );
}

export function DateRangeChip({ range, onClear }) {
  if (!range) return null;
  return (
    <Pressable onPress={onClear} style={styles.rangeChip}>
      <Text style={styles.rangeChipText}>
        {formatDateLong(range.from)} – {formatDateLong(range.to)}
      </Text>
      <Text style={styles.rangeChipClear}>Clear</Text>
    </Pressable>
  );
}

export function DateRangeCalendarModal({
  open,
  onClose,
  rangeStart,
  rangeEnd,
  markedDates,
  onDayPress,
  rangeReady,
  onApply,
  appliedRange,
  onClearRecent,
  clearRecentLabel = 'Back to recent entries',
}) {
  return (
    <Modal open={open} onClose={onClose}>
      <View style={{ gap: 16 }}>
        <Calendar
          markingType="period"
          markedDates={markedDates}
          onDayPress={onDayPress}
          maxDate={new Date().toISOString().slice(0, 10)}
          enableSwipeMonths
          theme={{
            backgroundColor: colors.card,
            calendarBackground: colors.card,
            textSectionTitleColor: colors.subtext,
            selectedDayBackgroundColor: colors.primary,
            selectedDayTextColor: colors.white,
            todayTextColor: colors.primary,
            dayTextColor: colors.text,
            textDisabledColor: withAlpha(colors.subtext, 0.45),
            monthTextColor: colors.text,
            arrowColor: colors.primary,
            textDayFontFamily: fonts.body,
            textMonthFontFamily: fonts.bodyMedium,
            textDayHeaderFontFamily: fonts.bodyMedium,
          }}
          style={styles.calendar}
        />
        {rangeStart ? (
          <Text style={styles.rangePreview}>
            {rangeEnd
              ? `${formatDateLong(rangeStart <= rangeEnd ? rangeStart : rangeEnd)} – ${formatDateLong(rangeStart <= rangeEnd ? rangeEnd : rangeStart)}`
              : `${formatDateLong(rangeStart)} – select end date`}
          </Text>
        ) : null}
        <Button onPress={onApply} disabled={!rangeReady}>
          Apply
        </Button>
        {appliedRange && onClearRecent ? (
          <Button variant="ghost" onPress={onClearRecent}>
            {clearRecentLabel}
          </Button>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  calBtn: {
    height: 36,
    width: 36,
    borderRadius: radius.pill,
    backgroundColor: withAlpha(colors.primary, 0.12),
    borderWidth: 1,
    borderColor: withAlpha(colors.primary, 0.30),
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  calBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  rangeChip: {
    marginTop: 10,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: withAlpha(colors.primary, 0.10),
    borderWidth: 1,
    borderColor: withAlpha(colors.primary, 0.25),
  },
  rangeChipText: {
    color: colors.text,
    fontSize: 12,
    fontFamily: fonts.bodyMedium,
  },
  rangeChipClear: {
    color: colors.primary,
    fontSize: 12,
    fontFamily: fonts.bodyMedium,
  },
  calendar: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  rangePreview: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    textAlign: 'center',
  },
});
