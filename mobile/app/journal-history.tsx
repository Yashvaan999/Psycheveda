import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/constants/colors';
import { Card, EmptyState } from '@/components/ui';
import { listJournalEntries } from '@/lib/api';

interface JournalEntry {
  id: string;
  created_at: string;
  period: string;
  situation: string;
  natural_emotion: string;
  nlp_frame?: string;
  end_feeling?: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

export default function JournalHistoryScreen() {
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const data = await listJournalEntries(30, 0);
      setEntries(data as JournalEntry[]);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={entries}
      keyExtractor={(item) => item.id}
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + 24 },
        entries.length === 0 && styles.emptyContainer,
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />
      }
      ListEmptyComponent={
        <EmptyState
          icon={<Ionicons name="book-outline" size={48} color={colors.subtext} />}
          title="No journal entries yet"
          subtitle="Start your first reflection from the Journal tab"
        />
      }
      renderItem={({ item }) => (
        <Card style={styles.entryCard}>
          <View style={styles.entryHeader}>
            <View style={styles.periodBadge}>
              <Ionicons
                name={item.period === 'morning' ? 'sunny-outline' : 'moon-outline'}
                size={12}
                color={colors.primary}
              />
              <Text style={styles.periodText}>{item.period}</Text>
            </View>
            <Text style={styles.entryDate}>{formatDate(item.created_at)}</Text>
          </View>

          <Text style={styles.field} numberOfLines={3}>{item.situation}</Text>

          {item.natural_emotion ? (
            <View style={styles.emotionRow}>
              <Text style={styles.emotionLabel}>Felt</Text>
              <Text style={styles.emotion}>{item.natural_emotion}</Text>
            </View>
          ) : null}

          {item.nlp_frame ? (
            <View style={styles.reframeBlock}>
              <Text style={styles.reframeLabel}>Reframe</Text>
              <Text style={styles.reframe} numberOfLines={3}>{item.nlp_frame}</Text>
            </View>
          ) : null}

          {item.end_feeling ? (
            <View style={styles.emotionRow}>
              <Text style={styles.emotionLabel}>Ended with</Text>
              <Text style={[styles.emotion, { color: colors.secondary }]}>{item.end_feeling}</Text>
            </View>
          ) : null}
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center' },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  entryCard: { marginBottom: 14 },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  periodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: colors.primaryLight,
    borderRadius: 20,
  },
  periodText: { fontFamily: 'Inter_500Medium', fontSize: 11, color: colors.primary, textTransform: 'capitalize' },
  entryDate: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.subtext },
  field: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.text, lineHeight: 21, marginBottom: 8 },
  emotionRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  emotionLabel: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.subtext },
  emotion: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.primary },
  reframeBlock: {
    backgroundColor: colors.secondaryLight,
    borderRadius: 10,
    padding: 10,
    marginTop: 4,
  },
  reframeLabel: { fontFamily: 'Inter_500Medium', fontSize: 11, color: colors.secondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  reframe: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.text, lineHeight: 19 },
});
