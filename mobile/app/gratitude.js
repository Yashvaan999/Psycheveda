import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, History } from 'lucide-react-native';
import api from '../src/lib/api';
import AppShell from '../src/components/AppShell';
import { Button, Card, Textarea, Label } from '../src/components/ui';
import BlessIcon from '../src/components/BlessIcon';
import { colors, fonts, radius, withAlpha } from '../src/lib/theme';

export default function Gratitude() {
  const router = useRouter();
  const [b1, setB1] = useState('');
  const [b2, setB2] = useState('');
  const [b3, setB3] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const save = async () => {
    if (!b1.trim() || !b2.trim() || !b3.trim()) return;
    setBusy(true);
    try {
      await api.createGratitude({
        entry_date: new Date().toISOString().slice(0, 10),
        point_1: b1.trim(), point_2: b2.trim(), point_3: b3.trim(),
      });
      setDone(true);
    } catch (e) { console.warn(e); }
    finally { setBusy(false); }
  };

  if (done) {
    return (
      <AppShell>
        <Card style={{ alignItems: 'center', paddingVertical: 40, gap: 16, marginTop: 40 }}>
          <View style={styles.heartCircle}>
            <BlessIcon size={32} />
          </View>
          <Text style={{ fontFamily: fonts.display, fontSize: 24, color: colors.text }}>
            +15 Bless Points
          </Text>
          <Text style={{ color: colors.subtext, fontSize: 14, textAlign: 'center', fontFamily: fonts.body }}>
            Your gratitude is the cup the universe fills.
          </Text>
          <Button onPress={() => router.replace('/dashboard')} style={{ marginTop: 8, alignSelf: 'stretch' }}>
            Back to dashboard
          </Button>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <View style={styles.head}>
        <View style={{ flex: 1 }}>
          <Text style={styles.h1}>Three blessings</Text>
          <Text style={styles.sub}>Name what you are grateful for today.</Text>
        </View>
        <Pressable onPress={() => router.push('/gratitude-history')} style={styles.histBtn}>
          <History size={16} strokeWidth={1.5} color={colors.subtext} />
        </Pressable>
      </View>

      <Card style={{ gap: 14, marginTop: 16 }}>
        {[
          { n: 1, v: b1, set: setB1, ph: 'I am grateful for…' },
          { n: 2, v: b2, set: setB2, ph: 'I appreciate…' },
          { n: 3, v: b3, set: setB3, ph: 'I cherish…' },
        ].map((x) => (
          <View key={x.n}>
            <Label>Blessing {x.n}</Label>
            <Textarea
              value={x.v} onChangeText={x.set} placeholder={x.ph}
              style={{ minHeight: 80 }}
            />
          </View>
        ))}
        <Button onPress={save} disabled={busy || !b1.trim() || !b2.trim() || !b3.trim()}>
          {busy ? 'Saving…' : 'Offer & earn +15 Bless'}
        </Button>
      </Card>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  h1: { fontFamily: fonts.display, fontSize: 28, color: colors.text },
  sub: { color: colors.subtext, fontSize: 14, marginTop: 4, fontFamily: fonts.body },
  histBtn: {
    height: 36, width: 36, borderRadius: radius.pill,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center', marginTop: 4,
  },
  heartCircle: {
    height: 72, width: 72, borderRadius: 36,
    backgroundColor: withAlpha(colors.primary, 0.12),
    borderWidth: 1, borderColor: withAlpha(colors.primary, 0.30),
    alignItems: 'center', justifyContent: 'center',
  },
});
