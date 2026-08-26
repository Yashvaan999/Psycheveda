import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { BookOpen, History, Lightbulb } from 'lucide-react-native';
import { api } from '../src/lib/api';
import AppShell from '../src/components/AppShell';
import Modal from '../src/components/Modal';
import { Button, Card, Input, Textarea, Label } from '../src/components/ui';
import { colors, fonts, radius, withAlpha } from '../src/lib/theme';

const EASE_MIN = 1, EASE_MAX = 5;

const SUGGESTIONS = {
  situation: {
    theme: 'The situation',
    intro: 'Describe what happened as a neutral observer — just the facts, no interpretation or blame.',
    ideas: [
      'My manager critiqued my report in front of the team during the meeting.',
      'A friend cancelled our plans an hour before we were set to meet.',
      'I sent a message and did not get a reply for the whole day.',
      'I made a mistake on a task I had done many times before.',
    ],
  },
  emotion: {
    theme: 'Natural emotion',
    intro: 'Name the raw feelings that surfaced first — before any reasoning. Single words work best.',
    ideas: [
      'anger, frustration',
      'shame, embarrassment',
      'fear, anxiety',
      'sadness, disappointment',
    ],
  },
  initialFrame: {
    theme: 'Initial frame (natural)',
    intro: 'The lens through which you first saw it.',
    ideas: [],
  },
  chosenFrame: {
    theme: 'Chosen frame (later)',
    intro: 'Choose a more empowering frame.',
    ideas: [],
  },
};

export default function Journal() {
  const router = useRouter();
  const [frames, setFrames] = useState([]);
  const [situation, setSituation] = useState('');
  const [emotion, setEmotion] = useState('');
  const [initialFrame, setInitialFrame] = useState('');
  const [nlpFrame, setNlpFrame] = useState('');
  const [ease, setEase] = useState(3);
  const [endFeeling, setEndFeeling] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [tip, setTip] = useState(null);

  useEffect(() => { api.journalFrames().then(setFrames); }, []);

  const valid =
    situation.trim().length >= 2 &&
    emotion.trim().length >= 1 &&
    !!initialFrame && !!nlpFrame &&
    ease >= 1 && ease <= 5 &&
    endFeeling.trim().length >= 1;

  const save = async () => {
    if (!valid) return;
    setBusy(true); setErr('');
    try {
      await api.createJournal({
        entry_date: new Date().toISOString().slice(0, 10),
        situation, natural_emotion: emotion,
        initial_frame: initialFrame, nlp_frame: nlpFrame,
        ease_of_transition: ease, end_feeling: endFeeling,
        period: new Date().getHours() < 12 ? 'morning' : 'evening',
      });
      setDone(true);
    } catch (e) {
      setErr(e?.message || 'Could not save entry');
    } finally { setBusy(false); }
  };

  if (done) {
    return (
      <AppShell>
        <Card style={{ alignItems: 'center', paddingVertical: 40, gap: 16, marginTop: 40 }}>
          <View style={styles.checkCircle}>
            <BookOpen size={28} strokeWidth={1.5} color={colors.secondary} />
          </View>
          <Text style={{ fontFamily: fonts.display, fontSize: 24, color: colors.text }}>
            Saved with care
          </Text>
          <Text style={{ color: colors.subtext, fontSize: 14, textAlign: 'center', fontFamily: fonts.body }}>
            The unconscious has heard you. Return tomorrow.
          </Text>
          <Button onPress={() => router.replace('/dashboard')} style={{ marginTop: 8, alignSelf: 'stretch' }}>
            Back to dashboard
          </Button>
          <Button variant="ghost" onPress={() => {
            setSituation(''); setEmotion(''); setInitialFrame(''); setNlpFrame('');
            setEase(3); setEndFeeling(''); setDone(false);
          }}>Write another</Button>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <View style={styles.head}>
        <View style={{ flex: 1 }}>
          <Text style={styles.h1}>Journal</Text>
          <Text style={styles.sub}>Mindfully Reprogram yourself for different situations</Text>
        </View>
        <Pressable onPress={() => router.push('/journal-history')} style={styles.histBtn}>
          <History size={16} strokeWidth={1.5} color={colors.subtext} />
        </Pressable>
      </View>

      <Card style={{ gap: 16, marginTop: 16 }}>
        {/* Situation */}
        <View>
          <View style={styles.labelRow}>
            <Label style={{ marginBottom: 0 }}>1. The situation</Label>
            <Pressable onPress={() => setTip('situation')} hitSlop={8} style={styles.tipBtn}>
              <Lightbulb size={14} strokeWidth={1.5} color={colors.primary} />
            </Pressable>
          </View>
          <Textarea
            value={situation} onChangeText={setSituation}
            placeholder="Describe your situation from a true lens."
            style={{ minHeight: 90, marginTop: 6 }}
          />
        </View>

        {/* Natural emotion */}
        <View>
          <View style={styles.labelRow}>
            <Label style={{ marginBottom: 0 }}>2. Natural emotion</Label>
            <Pressable onPress={() => setTip('emotion')} hitSlop={8} style={styles.tipBtn}>
              <Lightbulb size={14} strokeWidth={1.5} color={colors.primary} />
            </Pressable>
          </View>
          <Input
            value={emotion} onChangeText={setEmotion}
            placeholder="anger, shame, fear (comma-separated)"
            style={{ marginTop: 6 }}
          />
        </View>

        {/* Initial frame */}
        <View>
          <View style={styles.labelRow}>
            <Label style={{ marginBottom: 0 }}>3. Initial frame (natural)</Label>
            <Pressable onPress={() => setTip('initialFrame')} hitSlop={8} style={styles.tipBtn}>
              <Lightbulb size={14} strokeWidth={1.5} color={colors.primary} />
            </Pressable>
          </View>
          <View style={{ gap: 6, marginTop: 8 }}>
            {frames.map((f) => {
              const active = initialFrame === f.key;
              return (
                <Pressable key={f.key} onPress={() => setInitialFrame(f.key)}>
                  <View style={[
                    styles.frame,
                    active && { borderColor: colors.primary, backgroundColor: withAlpha(colors.primary, 0.06) },
                  ]}>
                    <Text style={[styles.frameTitle, active && { color: colors.primary }]}>{f.key}</Text>
                    <Text style={styles.frameDesc}>{f.desc}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Chosen frame */}
        <View>
          <View style={styles.labelRow}>
            <Label style={{ marginBottom: 0 }}>4. Chosen frame (later)</Label>
            <Pressable onPress={() => setTip('chosenFrame')} hitSlop={8} style={styles.tipBtn}>
              <Lightbulb size={14} strokeWidth={1.5} color={colors.primary} />
            </Pressable>
          </View>
          <View style={{ gap: 6, marginTop: 8 }}>
            {frames.map((f) => {
              const active = nlpFrame === f.key;
              return (
                <Pressable key={f.key} onPress={() => setNlpFrame(f.key)}>
                  <View style={[
                    styles.frame,
                    active && { borderColor: colors.primary, backgroundColor: withAlpha(colors.primary, 0.06) },
                  ]}>
                    <Text style={[styles.frameTitle, active && { color: colors.primary }]}>{f.key}</Text>
                    <Text style={styles.frameDesc}>{f.desc}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Ease */}
        <View>
          <View style={styles.labelRow}>
            <Text style={styles.easeLabel}>
              5. Ease of frame transition ·{' '}
              <Text style={styles.easeNumerator}>{ease}</Text>
              <Text style={styles.easeDenominator}>/5</Text>
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
            {Array.from({ length: EASE_MAX - EASE_MIN + 1 }, (_, i) => i + EASE_MIN).map((n) => {
              const active = ease >= n;
              return (
                <Pressable
                  key={n}
                  onPress={() => setEase(n)}
                  style={[
                    styles.easeDot,
                    active && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                >
                  <Text style={[
                    { fontSize: 11, color: colors.subtext, fontFamily: fonts.bodyMedium },
                    active && { color: colors.white },
                  ]}>{n}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* End feeling */}
        <View>
          <Label>6. End feeling</Label>
          <Input
            value={endFeeling} onChangeText={setEndFeeling}
            placeholder="How do you feel now?"
          />
        </View>

        {err ? (
          <View style={styles.errBox}><Text style={styles.errText}>{err}</Text></View>
        ) : null}

        <Button onPress={save} disabled={busy || !valid}>
          {busy ? 'Saving…' : 'Save'}
        </Button>
      </Card>

      <Modal
        open={tip !== null}
        onClose={() => setTip(null)}
        title={tip ? SUGGESTIONS[tip].theme : ''}
      >
        {tip ? (
          <View style={{ gap: 12 }}>
            <Text style={styles.tipIntro}>{SUGGESTIONS[tip].intro}</Text>
            {SUGGESTIONS[tip].ideas.length > 0 ? (
              <View style={{ gap: 10 }}>
                {SUGGESTIONS[tip].ideas.map((idea, i) => (
                  <View key={i} style={styles.ideaRow}>
                    <View style={styles.dot} />
                    <Text style={styles.ideaText}>{idea}</Text>
                  </View>
                ))}
              </View>
            ) : null}
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
  frame: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
    padding: 12, borderRadius: radius.lg, gap: 4,
  },
  frameTitle: { color: colors.text, fontFamily: fonts.bodyMedium, fontSize: 13 },
  frameDesc: { color: colors.subtext, fontSize: 12, fontFamily: fonts.body, lineHeight: 18 },
  easeLabel: { color: colors.text, fontSize: 13, fontFamily: fonts.bodyMedium },
  easeNumerator: { color: colors.primary, fontFamily: fonts.bodyMedium },
  easeDenominator: { color: colors.subtext, fontFamily: fonts.bodyMedium },
  easeDot: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.card,
  },
  checkCircle: {
    height: 64, width: 64, borderRadius: 32,
    backgroundColor: withAlpha(colors.secondary, 0.15),
    borderWidth: 1, borderColor: withAlpha(colors.secondary, 0.30),
    alignItems: 'center', justifyContent: 'center',
  },
  errBox: {
    backgroundColor: colors.dangerSoft, borderWidth: 1, borderColor: colors.dangerBorder,
    padding: 12, borderRadius: radius.xl,
  },
  errText: { color: colors.danger, fontSize: 13, fontFamily: fonts.body },
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
