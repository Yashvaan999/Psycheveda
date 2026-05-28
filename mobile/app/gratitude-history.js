import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import api from '../src/lib/api';
import AppShell from '../src/components/AppShell';
import { Card } from '../src/components/ui';
import BlessIcon from '../src/components/BlessIcon';
import { fmtDate, fmtTime } from '../src/lib/utils';
import { colors, fonts, radius } from '../src/lib/theme';

export default function GratitudeHistory() {
  const router = useRouter();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listGratitude().then(setGroups).catch(console.warn).finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <View style={styles.head}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <ArrowLeft size={20} strokeWidth={1.5} color={colors.subtext} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.h1}>Gratitude history</Text>
          <Text style={styles.sub}>Every blessing remembered.</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : groups.length === 0 ? (
        <Card style={{ marginTop: 20 }}>
          <Text style={{ color: colors.subtext, fontFamily: fonts.body }}>
            No blessings logged yet.
          </Text>
        </Card>
      ) : (
        <View style={{ marginTop: 16, gap: 20 }}>
          {groups.map((g) => (
            <View key={g.date} style={{ gap: 10 }}>
              <Text style={styles.dateHead}>{fmtDate(g.date)}</Text>
              {g.entries.map((e) => (
                <Card key={e.id} style={{ padding: 16, gap: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <BlessIcon size={14} />
                      <Text style={{ color: colors.primary, fontSize: 12, fontFamily: fonts.bodyMedium }}>+15 Bless</Text>
                    </View>
                    <Text style={styles.time}>{fmtTime(e.created_at)}</Text>
                  </View>
                  {[e.point_1, e.point_2, e.point_3].map((b, i) => (
                    <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
                      <Text style={{ color: colors.primary, fontFamily: fonts.bodyMedium, fontSize: 13 }}>{i + 1}.</Text>
                      <Text style={{ flex: 1, color: colors.text, fontSize: 14, fontFamily: fonts.body, lineHeight: 22 }}>{b}</Text>
                    </View>
                  ))}
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
  time: { color: colors.subtext, fontSize: 11, fontFamily: fonts.body },
});
