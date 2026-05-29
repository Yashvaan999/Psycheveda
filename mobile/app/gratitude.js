import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, History, Lightbulb } from 'lucide-react-native';
import api from '../src/lib/api';
import AppShell from '../src/components/AppShell';
import Modal from '../src/components/Modal';
import { Button, Card, Textarea, Label } from '../src/components/ui';
import BlessIcon from '../src/components/BlessIcon';
import { colors, fonts, radius, withAlpha } from '../src/lib/theme';

const SUGGESTIONS = {
  1: {
    theme: 'People',
    intro: 'Who made you feel positive, supported, or seen?',
    ideas: [
      'A family member or partner who showed up for you',
      'A friend who listened without judgement',
      'A mentor, teacher, or colleague who guided you',
      'A stranger whose small kindness brightened your day',
    ],
  },
  2: {
    theme: 'Places & things',
    intro: 'What surroundings or comforts nourished you?',
    ideas: [
      'A place that brought you calm — home, nature, a quiet corner',
      'A meal, drink, or comfort that delighted your senses',
      'A tool, book, or song that helped or inspired you',
      'Your body, health, or a moment of physical ease',
    ],
  },
  3: {
    theme: 'Ancestors & lineage',
    intro: 'What inherited gifts and roots are you thankful for?',
    ideas: [
      'A value or tradition passed down to you',
      'The sacrifices of those who came before you',
      'A skill, story, or wisdom from your heritage',
      'The strength and resilience carried in your bloodline',
    ],
  },
};

export default function Gratitude() {
  const router = useRouter();
  const [b1, setB1] = useState('');
  const [b2, setB2] = useState('');
  const [b3, setB3] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [tip, setTip] = useState(null);

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
          { n: 1, v: b1, set: setB1, ph: 'A person who made you feel positive today…' },
          { n: 2, v: b2, set: setB2, ph: 'A place or thing that nourished you…' },
          { n: 3, v: b3, set: setB3, ph: 'A gift from your ancestors or lineage…' },
        ].map((x) => (
          <View key={x.n}>
            <View style={styles.labelRow}>
              <Label style={{ marginBottom: 0 }}>Blessing {x.n}</Label>
              <Pressable onPress={() => setTip(x.n)} hitSlop={8} style={styles.tipBtn}>
                <Lightbulb size={14} strokeWidth={1.5} color={colors.primary} />
              </Pressable>
            </View>
            <Textarea
              value={x.v} onChangeText={x.set} placeholder={x.ph}
              style={{ minHeight: 80, marginTop: 6 }}
            />
          </View>
        ))}
        <Button onPress={save} disabled={busy || !b1.trim() || !b2.trim() || !b3.trim()}>
          {busy ? 'Saving…' : 'Offer & earn +15 Bless'}
        </Button>
      </Card>

      <Modal
        open={tip !== null}
        onClose={() => setTip(null)}
        title={tip ? `Blessing ${tip} · ${SUGGESTIONS[tip].theme}` : ''}
      >
        {tip ? (
          <View style={{ gap: 12 }}>
            <Text style={styles.tipIntro}>{SUGGESTIONS[tip].intro}</Text>
            <View style={{ gap: 10 }}>
              {SUGGESTIONS[tip].ideas.map((idea, i) => (
                <View key={i} style={styles.ideaRow}>
                  <View style={styles.dot} />
                  <Text style={styles.ideaText}>{idea}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </Modal>
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
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tipBtn: {
    height: 26, width: 26, borderRadius: 13,
    backgroundColor: withAlpha(colors.primary, 0.12),
    borderWidth: 1, borderColor: withAlpha(colors.primary, 0.30),
    alignItems: 'center', justifyContent: 'center',
  },
  tipIntro: { color: colors.text, fontSize: 15, fontFamily: fonts.bodyMedium, lineHeight: 22 },
  ideaRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  dot: {
    width: 6, height: 6, borderRadius: 3, marginTop: 8,
    backgroundColor: colors.primary,
  },
  ideaText: { flex: 1, color: colors.subtext, fontSize: 14, fontFamily: fonts.body, lineHeight: 21 },
});
