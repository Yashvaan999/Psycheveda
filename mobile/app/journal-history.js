import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import api from '../src/lib/api';
import AppShell from '../src/components/AppShell';
import { Card, Badge } from '../src/components/ui';
import { fmtDate, fmtTime } from '../src/lib/utils';
import { colors, fonts, radius } from '../src/lib/theme';

export default function JournalHistory() {
  const router = useRouter();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listJournal().then(setGroups).catch(console.warn).finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <View style={styles.head}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <ArrowLeft size={20} strokeWidth={1.5} color={colors.subtext} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.h1}>Journal history</Text>
          <Text style={styles.sub}>Every reframing carried forward.</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : groups.length === 0 ? (
        <Card style={{ marginTop: 20 }}>
          <Text style={{ color: colors.subtext, fontFamily: fonts.body }}>
            No entries yet. Your first reframing awaits.
          </Text>
        </Card>
      ) : (
        <View style={{ marginTop: 16, gap: 20 }}>
          {groups.map((g) => (
            <View key={g.date} style={{ gap: 10 }}>
              <Text style={styles.dateHead}>{fmtDate(g.date)}</Text>
              {g.entries.map((e) => (
                <Card key={e.id} style={{ padding: 16, gap: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                      <Badge tone="neutral">{e.period}</Badge>
                      <Badge tone="primary">{e.nlp_frame}</Badge>
                    </View>
                    <Text style={styles.time}>{fmtTime(e.created_at)}</Text>
                  </View>
                  <View>
                    <Text style={styles.label}>Situation</Text>
                    <Text style={styles.body}>{e.situation}</Text>
                  </View>
                  <View>
                    <Text style={styles.label}>Natural emotion</Text>
                    <Text style={styles.body}>{e.natural_emotion}</Text>
                  </View>
                  {e.initial_frame ? (
                    <View>
                      <Text style={styles.label}>Initial frame</Text>
                      <Text style={styles.body}>{e.initial_frame}</Text>
                    </View>
                  ) : null}
                  <View>
                    <Text style={styles.label}>End feeling · ease {e.ease_of_transition}/10</Text>
                    <Text style={[styles.body, { color: colors.secondary, fontFamily: fonts.bodyMedium }]}>
                      {e.end_feeling}
                    </Text>
                  </View>
                </Card>
              ))}
            </View>
          ))}
        </View>
      )}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  h1: { fontFamily: fonts.display, fontSize: 26, color: colors.text },
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
