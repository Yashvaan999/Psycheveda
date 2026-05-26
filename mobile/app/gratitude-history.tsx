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
import { listGratitudeEntries } from '@/lib/api';

interface GratitudeEntry {
  id: string;
  created_at: string;
  period: string;
  blessing_1: string;
  blessing_2: string;
  blessing_3: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

export default function GratitudeHistoryScreen() {
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState<GratitudeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const data = await listGratitudeEntries(30, 0);
      setEntries(data as GratitudeEntry[]);
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
          icon={<Ionicons name="heart-outline" size={48} color={colors.subtext} />}
          title="No gratitude entries yet"
          subtitle="Complete your first ritual from the Gratitude tab"
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

          {[item.blessing_1, item.blessing_2, item.blessing_3].map((b, idx) => (
            <View key={idx} style={styles.blessingRow}>
              <View style={styles.blessingNum}>
                <Text style={styles.blessingNumText}>{idx + 1}</Text>
              </View>
              <Text style={styles.blessingText}>{b}</Text>
            </View>
          ))}
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
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
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
  blessingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  blessingNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  blessingNumText: { fontFamily: 'Inter_700Bold', fontSize: 11, color: colors.primary },
  blessingText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.text, lineHeight: 21 },
});
