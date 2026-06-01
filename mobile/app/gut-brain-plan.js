import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronLeft, ChevronRight, Check, ClipboardCheck, Languages, Info } from 'lucide-react-native';
import api from '../src/lib/api';
import { Button } from '../src/components/ui';
import Modal from '../src/components/Modal';
import calculateSuccessIdentity from '../src/lib/successIdentity';
import { colors, fonts, radius, withAlpha } from '../src/lib/theme';

const SUB_LABELS = [
  {
    key: 'bioEnergy',
    label: 'Bio-Energy Balance',
    what: 'Reflects how steady your daily energy is — your blood-sugar stability, freedom from afternoon crashes, mental clarity, and how little you lean on caffeine or sugar to get through the day.',
    how: 'Built from your answers on brain fog, sugar/carb cravings, post-meal crashes, the afternoon dip, stimulant reliance, and general tiredness. Each answer scores from +2 (best) to −2 (worst), and a fully neutral set lands at 50%. The more your answers point to stable, stimulant-free energy, the higher the percentage.',
  },
  {
    key: 'cognitive',
    label: 'Cognitive Performance',
    what: 'Measures your mental sharpness and follow-through — how well you adapt, focus, carry yourself with confidence, finish what you start, and resist procrastination or excuses.',
    how: 'Based on your answers about adaptability, sustained focus, achieving goals, standing tall with confidence, procrastination, and making excuses. Answers are scored +2 to −2 and normalised so a neutral profile is 50%. More agreement with the positive traits (and less with procrastination/excuses) raises your score.',
  },
  {
    key: 'goalReadiness',
    label: 'Goal-Pursuit Readiness',
    what: 'Captures how primed you are to chase and reach your goals — your sense of direction, drive, and motivation — blended with the overall strength of your positive habits.',
    how: 'Combines your answers on life direction/purpose, drive to succeed, and motivation, plus the average of all your positive-trait responses across the whole assessment. Each component is scored +2 to −2 and normalised to a percentage, with 50% as the neutral midpoint.',
  },
  {
    key: 'physicalAsset',
    label: 'Physical Base Asset',
    what: 'Represents the physical foundation your performance rests on — digestion, exercise, body weight, nutrition, freedom from chronic pain, and medications with heavy side-effects.',
    how: 'Drawn from your answers on digestive issues, exercise frequency, medication side-effects, weight, healthy eating, and chronic pain. Each is scored +2 to −2; healthier answers push the percentage up, while a neutral profile sits at 50%.',
  },
  {
    key: 'stressResistance',
    label: 'Stress & Anxiety Resistance',
    what: 'Gauges how well you stay steady under pressure — your calmness, resilience to criticism and overwhelm, and freedom from anxiety, low mood, and mood swings.',
    how: 'Calculated from your answers on stress, feeling overwhelmed, sensitivity to criticism, daily calmness, low mood, anxiety, intrusive thoughts, and mood swings. Each answer scores +2 to −2 and is normalised so neutral equals 50% — the calmer and more resilient your answers, the higher the score.',
  },
];

const SUB_BY_KEY = Object.fromEntries(SUB_LABELS.map((s) => [s.key, s]));

const OPTIONS = [
  { value: 'Strongly Agree', en: 'Strongly Agree', hi: 'पूरी तरह सहमत' },
  { value: 'Agree', en: 'Agree', hi: 'सहमत' },
  { value: 'Neutral', en: 'Neutral', hi: 'तटस्थ' },
  { value: 'Disagree', en: 'Disagree', hi: 'असहमत' },
  { value: 'Strongly Disagree', en: 'Strongly Disagree', hi: 'पूरी तरह असहमत' },
];

const QUESTIONS = [
  { id: 1, en: 'Do you have a clear direction and purpose in life?', hi: 'क्या आपके पास जीवन में एक स्पष्ट दिशा और उद्देश्य है?' },
  { id: 2, en: 'Are you quick to adapt to a changing environment?', hi: 'क्या आप बदलते परिवेश में जल्दी से ढल जाते हैं?' },
  { id: 3, en: 'Can you focus for sustained periods at a time?', hi: 'क्या आप एक समय में निरंतर ध्यान केंद्रित कर सकते हैं?' },
  { id: 4, en: 'Are you overly stressed?', hi: 'क्या आप अत्यधिक तनाव में हैं?' },
  { id: 5, en: 'Are you easily overwhelmed?', hi: 'क्या आप आसानी से घबराया हुआ महसूस करते हैं?' },
  { id: 6, en: 'Are you overly susceptible to criticism?', hi: 'क्या आप आलोचना के लिए अतिसंवेदनशील हैं?' },
  { id: 7, en: 'Do you have a high drive to succeed?', hi: 'क्या आपको सफलता पाने की उच्च आकांक्षा है?' },
  { id: 8, en: 'Do you suffer from any of the following 2 or more times per week? i.e. constipation, diarrhea, indigestion, bloating, etc.', hi: 'क्या आप प्रति सप्ताह नीचे लिखे हुए समस्या में से 2 या अधिक बार पीड़ित हैं? जैसे की: कब्ज, दस्त, अपच, सूजन आदि।' },
  { id: 9, en: 'Do you experience brain fog 2 or more times per week, i.e. lose a train of thought, head cloudy, forgetful, inability to find the right words?', hi: 'क्या आप प्रति सप्ताह 2 या अधिक बार ब्रेन फॉग का अनुभव करते हैं, यानी विचारों की एक ट्रेन खो देते हैं, सिर भारी रहना, बार बार भूल जाना, सही शब्दों को खोजने में असमर्थता?' },
  { id: 10, en: 'Do you experience a craving for carbohydrates / sugar daily?', hi: 'क्या आप रोज़ाना कार्बोहाइड्रेट/चीनी खाने की लालसा का अनुभव करते हैं?' },
  { id: 11, en: 'Do you crash after consuming a meal/snack more than 5x per week (i.e. feel sleepy, unfocused)?', hi: 'क्या आप प्रति सप्ताह 5x से अधिक भोजन/नाश्ता खाने के बाद दुर्घटनाग्रस्त हो जाते हैं (यानी नींद आना, ध्यान केंद्रित नहीं करना)?' },
  { id: 12, en: 'Do you fail to achieve the goals you set for yourself more than not?', hi: 'क्या आप अपने लिए निर्धारित लक्ष्यों को हासिल नहीं कर पाते हैं?' },
  { id: 13, en: 'Do you experience a mild-afternoon crash?', hi: 'क्या आप बीच दुपहर में स्ट्रेस अनुभव करते हो?' },
  { id: 14, en: 'Do you stand tall when walking/sitting/engaging with others?', hi: 'क्या आप चलते/बैठते/दूसरों के साथ बातचीत करते समय लंबे समय तक confidence के साथ खड़े रह सकते हैं?' },
  { id: 15, en: 'Are you calm 75% of the time in your daily life?', hi: 'क्या आप अपने दैनिक जीवन में 75% समय शांत रहते हैं?' },
  { id: 16, en: 'Do you overly rely on caffeine or other stimulants to get through the day?', hi: 'क्या आप दिन भर के लिए कैफीन या अन्य उत्तेजक पदार्थों पर अत्यधिक निर्भर हैं?' },
  { id: 17, en: 'Do you exercise a minimum of 5x per week?', hi: 'क्या आप प्रति सप्ताह कम से कम 5x व्यायाम करते हैं?' },
  { id: 18, en: 'Do you wake up feeling refreshed?', hi: 'क्या आप तरोताज़ा महसूस करते हुए सुबह जागते हैं?' },
  { id: 19, en: 'Do you procrastinate often?', hi: 'क्या आप अक्सर काम करने में विलंब करते हैं?' },
  { id: 20, en: 'Are you tired most of the time?', hi: 'क्या आप ज्यादातर समय थके रहते हैं?' },
  { id: 21, en: 'Have you felt depressed recently?', hi: 'क्या आपने हाल ही में उदास महसूस किया है?' },
  { id: 22, en: 'Have you felt anxious lately?', hi: 'क्या आपने हाल ही में चिंतित महसूस किया है?' },
  { id: 23, en: 'Do you take any form of medication that includes potential side effects, such as depression, suicidal thoughts, digestive issues?', hi: 'क्या आप किसी भी प्रकार की दवा लेते हैं जिसमें संभावित दुष्प्रभाव शामिल हैं, जैसे; अवसाद, आत्महत्या के विचार, पाचन संबंधी समस्याएं?' },
  { id: 24, en: 'Are you overweight?', hi: 'क्या आपका वजन बहुत ज्यादा है?' },
  { id: 25, en: 'Do you eat healthy 90% of the time?', hi: 'क्या आप 90% समय स्वस्थ खाना खाते हैं?' },
  { id: 26, en: 'Do you experience any form of chronic pain?', hi: 'क्या आप किसी प्रकार के पुराने दर्द का अनुभव करते हैं?' },
  { id: 27, en: 'Do you feel motivated to reach your goals?', hi: 'क्या आप अपने लक्ष्यों तक पहुंचने के लिए प्रेरित महसूस करते हैं?' },
  { id: 28, en: 'Do you make excuses often?', hi: 'क्या आप अक्सर बहाने बनाते हैं?' },
  { id: 29, en: 'Have you experienced any suicidal thoughts in the past month? (Answers are STRICTLY confidential)', hi: 'क्या आपने पिछले महीने में किसी आत्मघाती विचार का अनुभव किया है? (उत्तर गोपनीय हैं)' },
  { id: 30, en: 'Do you experience mild to severe mood swings throughout the course of a day? i.e. happy then sad.', hi: 'क्या आप पूरे दिन हल्के से गंभीर मिजाज का अनुभव करते हैं? यानी खुश फिर उदास।' },
];

export default function GutBrainPlanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');
  const [lang, setLang] = useState('en');
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [infoKey, setInfoKey] = useState(null);

  useEffect(() => {
    let active = true;
    api.getGutBrainAssessment()
      .then((row) => {
        if (!active) return;
        if (row?.answers) setAnswers(row.answers);
        if (row?.completed) setDone(true);
      })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 850, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 850, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.14] });

  const result = useMemo(() => {
    const arr = Object.entries(answers).map(([k, v]) => ({ questionId: Number(k), value: v }));
    return calculateSuccessIdentity(arr);
  }, [answers]);

  const total = QUESTIONS.length;
  const current = QUESTIONS[idx];
  const selected = answers[current.id];
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === total;
  const isLast = idx === total - 1;
  const pct = Math.round(((idx + 1) / total) * 100);

  const persist = async (next, completed = false) => {
    try {
      await api.saveGutBrainAssessment({ answers: next, completed });
      return true;
    } catch (e) {
      console.warn('Could not save assessment', e?.message || e);
      return false;
    }
  };

  const choose = async (opt) => {
    const next = { ...answers, [current.id]: opt };
    setAnswers(next);
    const ok = await persist(next);
    setErr(ok ? '' : "We couldn't save your answer — check your connection and try again.");
  };

  const goNext = () => { if (!isLast) setIdx((i) => i + 1); };
  const goPrev = () => { if (idx > 0) setIdx((i) => i - 1); };

  const handleBack = () => {
    if (allAnswered) { router.back(); return; }
    setConfirmLeave(true);
  };
  const leaveNow = () => { setConfirmLeave(false); router.back(); };

  const submit = async () => {
    setSaving(true);
    const ok = await persist(answers, true);
    setSaving(false);
    if (ok) {
      setErr('');
      setDone(true);
    } else {
      setErr("We couldn't save your responses. Please try again in a moment.");
    }
  };

  const retake = () => {
    setAnswers({});
    setIdx(0);
    setErr('');
    setDone(false);
    persist({}, false);
  };

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (done) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 28 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.exitBtn}>
          <ArrowLeft size={18} strokeWidth={1.6} color={colors.subtext} />
          <Text style={styles.exitText}>Gut-Brain</Text>
        </Pressable>
        <ScrollView contentContainerStyle={styles.resultBody} showsVerticalScrollIndicator={false}>
          <View style={styles.doneIcon}>
            <ClipboardCheck size={28} strokeWidth={1.6} color={colors.primary} />
          </View>
          <Text style={styles.resultEyebrow}>YOUR SUCCESS IDENTITY</Text>
          <Text style={styles.tierName}>{result.assignedTier}</Text>
          <Text style={styles.tierDesc}>{result.tierDescription}</Text>

          <View style={styles.overallCard}>
            <Text style={styles.overallPct}>{result.overallPercentage}%</Text>
            <Text style={styles.overallLabel}>Overall Identity Score</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${result.overallPercentage}%` }]} />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Parameter Breakdown</Text>
          <View style={{ gap: 18, alignSelf: 'stretch', width: '100%' }}>
            {SUB_LABELS.map((s) => {
              const v = result.subParameters[s.key];
              return (
                <View key={s.key}>
                  <View style={styles.subHead}>
                    <View style={styles.subLabelRow}>
                      <Text style={styles.subLabel}>{s.label}</Text>
                      <Pressable onPress={() => setInfoKey(s.key)} hitSlop={8} style={styles.infoBtn}>
                        <Info size={15} strokeWidth={1.8} color={colors.subtext} />
                      </Pressable>
                    </View>
                    <Text style={styles.subPct}>{v}%</Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${v}%` }]} />
                  </View>
                </View>
              );
            })}
          </View>

          <Button onPress={() => {}} style={{ alignSelf: 'stretch', marginTop: 28 }}>
            Elevate Yourself
          </Button>
          <Pressable onPress={retake} hitSlop={8} style={{ marginTop: 16, marginBottom: 8 }}>
            <Text style={styles.retakeText}>Retake the assessment</Text>
          </Pressable>
        </ScrollView>

        <Modal
          open={!!infoKey}
          onClose={() => setInfoKey(null)}
          title={infoKey ? SUB_BY_KEY[infoKey].label : ''}
        >
          {infoKey ? (
            <>
              <Text style={styles.infoScore}>Your score: {result.subParameters[infoKey]}%</Text>
              <Text style={styles.infoWhat}>{SUB_BY_KEY[infoKey].what}</Text>
            </>
          ) : null}
        </Modal>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 28 }]}>
      <View style={styles.topBar}>
        <View style={styles.topRow}>
          <Pressable onPress={handleBack} hitSlop={10} style={styles.exitIcon}>
            <ArrowLeft size={20} strokeWidth={1.6} color={colors.subtext} />
          </Pressable>
          <Text style={styles.counter}>Question {idx + 1} of {total}</Text>
          <Animated.View style={{ transform: [{ scale: pulseScale }] }}>
            <Pressable
              onPress={() => setLang((l) => (l === 'en' ? 'hi' : 'en'))}
              hitSlop={8}
              style={styles.langBtn}
            >
              <Languages size={15} strokeWidth={1.7} color={colors.primary} />
              <Text style={styles.langText}>{lang === 'en' ? 'EN' : 'हिं'}</Text>
            </Pressable>
          </Animated.View>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${pct}%` }]} />
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.qNum}>{String(idx + 1).padStart(2, '0')}</Text>
        <Text style={styles.qEn}>{lang === 'en' ? current.en : current.hi}</Text>

        <View style={{ gap: 8, marginTop: 16 }}>
          {OPTIONS.map((opt) => {
            const active = selected === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => choose(opt.value)}
                style={({ pressed }) => [
                  styles.option,
                  active && styles.optionActive,
                  pressed && { opacity: 0.9 },
                ]}
              >
                <View style={[styles.radio, active && styles.radioActive]}>
                  {active && <Check size={12} strokeWidth={3} color={colors.white} />}
                </View>
                <Text style={[styles.optionText, active && { color: colors.primary }]}>{lang === 'en' ? opt.en : opt.hi}</Text>
              </Pressable>
            );
          })}
        </View>

        {err ? (
          <View style={styles.errBox}>
            <Text style={styles.errText}>{err}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 14 }]}>
        <Pressable
          onPress={goPrev}
          disabled={idx === 0}
          hitSlop={6}
          style={[styles.navGhost, idx === 0 && { opacity: 0.35 }]}
        >
          <ChevronLeft size={18} strokeWidth={1.8} color={colors.text} />
          <Text style={styles.navGhostText}>Previous</Text>
        </Pressable>

        {isLast ? (
          <Button onPress={submit} disabled={!allAnswered || saving} style={{ flex: 1, marginLeft: 12 }}>
            {saving ? 'Saving…' : 'Submit'}
          </Button>
        ) : (
          <Pressable
            onPress={goNext}
            disabled={!selected}
            style={({ pressed }) => [
              styles.navPrimary,
              !selected && { opacity: 0.4 },
              pressed && selected && { opacity: 0.85, transform: [{ scale: 0.98 }] },
            ]}
          >
            <Text style={styles.navPrimaryText}>Next</Text>
            <ChevronRight size={18} strokeWidth={2} color={colors.white} />
          </Pressable>
        )}
      </View>

      <Modal open={confirmLeave} onClose={() => setConfirmLeave(false)}>
        <Text style={styles.confirmMsg}>A few minutes of patience helps us foresee our future.</Text>
        <Text style={styles.confirmSub}>You haven't finished the assessment yet. Would you like to stay and continue?</Text>
        <View style={styles.confirmRow}>
          <Button onPress={() => setConfirmLeave(false)} style={{ flex: 1 }}>Stay</Button>
          <Button variant="secondary" onPress={leaveNow} style={{ flex: 1 }}>Go back</Button>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  topBar: {
    paddingHorizontal: 20, paddingBottom: 16,
  },
  topRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12,
  },
  langBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 6, paddingHorizontal: 10, borderRadius: radius.pill,
    borderWidth: 1, borderColor: withAlpha(colors.primary, 0.3),
    backgroundColor: withAlpha(colors.primary, 0.07),
  },
  langText: { color: colors.primary, fontSize: 12, fontFamily: fonts.bodyMedium },
  exitIcon: { paddingVertical: 4, paddingRight: 2 },
  exitBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', paddingHorizontal: 20, paddingVertical: 6,
  },
  exitText: { color: colors.subtext, fontSize: 13, fontFamily: fonts.bodyMedium },
  counter: {
    flex: 1,
    fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase',
    color: colors.subtext, fontFamily: fonts.bodyMedium,
  },
  progressTrack: {
    height: 6, borderRadius: 999, backgroundColor: withAlpha(colors.primary, 0.14), overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: colors.primary },
  body: {
    paddingHorizontal: 22, paddingTop: 8, paddingBottom: 20,
    maxWidth: 640, width: '100%', alignSelf: 'center',
  },
  qNum: { fontFamily: fonts.display, fontSize: 26, color: withAlpha(colors.primary, 0.4) },
  qEn: { fontFamily: fonts.display, fontSize: 17, color: colors.text, marginTop: 2, lineHeight: 23 },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.xl, paddingVertical: 12, paddingHorizontal: 16,
  },
  optionActive: { borderColor: colors.primary, backgroundColor: withAlpha(colors.primary, 0.06) },
  radio: {
    height: 20, width: 20, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  optionText: { flex: 1, color: colors.text, fontSize: 14, fontFamily: fonts.bodyMedium },
  bottomBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bg,
  },
  navGhost: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 12, paddingRight: 12 },
  navGhostText: { color: colors.text, fontSize: 14, fontFamily: fonts.bodyMedium },
  navPrimary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    backgroundColor: colors.primary, borderRadius: radius.xxl,
    paddingVertical: 14, paddingHorizontal: 26, flex: 1, marginLeft: 12,
  },
  navPrimaryText: { color: colors.white, fontSize: 15, fontFamily: fonts.bodyMedium },
  doneIcon: {
    height: 64, width: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center',
    backgroundColor: withAlpha(colors.primary, 0.12), borderWidth: 1, borderColor: withAlpha(colors.primary, 0.25),
  },
  resultBody: {
    paddingHorizontal: 24, paddingTop: 8, paddingBottom: 40,
    alignItems: 'center', maxWidth: 640, width: '100%', alignSelf: 'center',
  },
  resultEyebrow: {
    marginTop: 18, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
    color: colors.subtext, fontFamily: fonts.bodyMedium,
  },
  tierName: {
    fontFamily: fonts.display, fontSize: 38, color: colors.primary,
    marginTop: 6, letterSpacing: 1, textAlign: 'center',
  },
  tierDesc: {
    fontFamily: fonts.body, fontSize: 13.5, color: colors.subtext,
    textAlign: 'center', marginTop: 8, lineHeight: 21, paddingHorizontal: 8,
  },
  overallCard: {
    alignSelf: 'stretch', width: '100%', alignItems: 'center', marginTop: 26,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.xxl, paddingVertical: 24, paddingHorizontal: 20,
  },
  overallPct: { fontFamily: fonts.display, fontSize: 52, color: colors.text, lineHeight: 56 },
  overallLabel: {
    fontFamily: fonts.bodyMedium, fontSize: 12, letterSpacing: 1,
    textTransform: 'uppercase', color: colors.subtext, marginTop: 2, marginBottom: 16,
  },
  sectionTitle: {
    alignSelf: 'flex-start', fontFamily: fonts.display, fontSize: 19,
    color: colors.text, marginTop: 30, marginBottom: 18,
  },
  subHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  subLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  subLabel: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.text },
  infoBtn: { padding: 2 },
  subPct: { fontFamily: fonts.display, fontSize: 15, color: colors.primary, marginLeft: 8 },
  infoScore: { fontFamily: fonts.display, fontSize: 18, color: colors.primary, marginBottom: 12 },
  infoWhat: { fontFamily: fonts.body, fontSize: 14, color: colors.text, lineHeight: 22 },
  infoHowLabel: {
    fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase',
    color: colors.subtext, marginTop: 18, marginBottom: 6,
  },
  infoHow: { fontFamily: fonts.body, fontSize: 13.5, color: colors.subtext, lineHeight: 21 },
  barTrack: {
    alignSelf: 'stretch', width: '100%', height: 8, borderRadius: 999,
    backgroundColor: withAlpha(colors.primary, 0.14), overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 999, backgroundColor: colors.primary },
  retakeText: { color: colors.subtext, fontSize: 13, fontFamily: fonts.bodyMedium, textDecorationLine: 'underline' },
  errBox: {
    marginTop: 20, padding: 14, borderRadius: radius.xl,
    backgroundColor: colors.dangerSoft, borderWidth: 1, borderColor: colors.dangerBorder,
  },
  errText: { color: colors.danger, fontSize: 13, fontFamily: fonts.body, lineHeight: 20 },
  confirmMsg: { fontFamily: fonts.display, fontSize: 21, color: colors.text, lineHeight: 29 },
  confirmSub: { fontFamily: fonts.body, fontSize: 14, color: colors.subtext, marginTop: 10, lineHeight: 22 },
  confirmRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
});
