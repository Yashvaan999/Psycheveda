import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft } from 'lucide-react-native';
import { hpaPalettes, getHpaPhase, fonts, radius, withAlpha, colors } from '../src/lib/theme';
import GlowSparkle from '../src/components/GlowSparkle';

const PHASES = ['cortisol_am', 'twilight', 'melatonin_pm'];

const PHASE_GUIDE = {
  cortisol_am: [
    {
      heading: 'Behavioral (Light Entrainment)',
      body: 'Step outside within 30 minutes of waking for 10–15 minutes of direct, unfiltered natural sunlight. This sends a photic signal to your hypothalamus to synchronize your central pacemaker. Delay your first cup of coffee or tea by 90–120 minutes to prevent chemical blunting of your natural morning energy curve.',
    },
    {
      heading: 'Dietary (Microbiome Awakening)',
      body: 'Avoid eating simple sugars or refined starches alone, which trigger a sudden glycemic spike followed by a stress-inducing crash. Instead, start with high-quality protein (like eggs) and prebiotic-rich fibers (such as oats or ground flaxseeds) to nourish "good" gut microbes and stabilize glucose levels.',
    },
  ],
  twilight: [
    {
      heading: 'Behavioral (The Somatic Shock)',
      body: 'If you feel an uncontrollable urge to sleep, do not nap for hours, as this disrupts your nighttime melatonin descent. Instead, practice a physical reset: splash cold water on your face to stimulate the mammalian dive reflex, step into the afternoon light, and take a quick 10-minute walk.',
    },
    {
      heading: 'Dietary (Anti-Crash Stabilization)',
      body: 'Prevent "cortisol-driven glucose rescues" by avoiding high-sugar afternoon snacks or sweetened drinks. Opt for a glass of spiced, warm buttermilk (chaas) with roasted cumin, or a small handful of raw nuts. This provides stable fats to feed the brain without spiking insulin.',
    },
  ],
  melatonin_pm: [
    {
      heading: 'Behavioral (The Digital Sunset)',
      body: 'Initiate a "digital sunset" by turning off all phones, tablets, and bright overhead lights 60–90 minutes before bed. Use dim, warm amber lamps or candles to signal your pineal gland that the day has ended.',
    },
    {
      heading: 'Dietary (Circadian Fasting Window)',
      body: 'Avoid late-night eating, which disrupts metabolic sleep cycles and elevates nocturnal stress hormones. Ensure your dinner is light, easily digestible, and eaten at least 3 hours before bed to allow your gut to enter a self-cleaning cycle overnight.',
    },
  ],
};

export default function HpaAxis() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState(getHpaPhase());

  useEffect(() => {
    const t = setInterval(() => setPhase(getHpaPhase()), 60000);
    return () => clearInterval(t);
  }, []);

  const p = hpaPalettes[phase];

  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 40,
          paddingHorizontal: 20,
        }}
      >
        {/* Top bar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <ArrowLeft size={20} strokeWidth={1.5} color={p.text} />
          </Pressable>
          <Text style={{ flex: 1, color: p.text, fontFamily: fonts.bodyMedium, fontSize: 14 }}>Gut-Brain</Text>
          <GlowSparkle size={16} color={colors.gold} />
        </View>

        {/* Hero */}
        <View style={[styles.hero, { borderColor: withAlpha(p.primary, 0.30) }]}>
          <Image source={{ uri: p.image }} style={styles.heroImg} resizeMode="cover" />
          <LinearGradient
            colors={[withAlpha(p.bg, 0.10), withAlpha(p.bg, 0.95)]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroInner}>
            <Text style={[styles.eyebrow, { color: p.primary }]}>{p.name}</Text>
            <Text style={[styles.eyebrowSub, { color: withAlpha(p.primary, 0.65) }]}>{p.label}</Text>
            <Text style={[styles.heroTitle, { color: p.text }]}>
              Tuning your circadium alchemy
            </Text>
            <Text style={[styles.heroDesc, { color: p.subtext }]}>
              {p.description}
            </Text>
          </View>
        </View>

        {/* Phase chooser */}
        <View style={{ marginTop: 24 }}>
          <Text style={[styles.sectionLabel, { color: p.subtext }]}>Explore phases</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            {PHASES.map((ph) => {
              const active = ph === phase;
              const pal = hpaPalettes[ph];
              return (
                <Pressable
                  key={ph}
                  onPress={() => setPhase(ph)}
                  style={[
                    styles.phaseChip,
                    { borderColor: withAlpha(pal.primary, active ? 0.6 : 0.25), backgroundColor: withAlpha(pal.primary, active ? 0.18 : 0.06) },
                  ]}
                >
                  <Text style={{ color: pal.text, fontSize: 12, fontFamily: fonts.bodyMedium, textAlign: 'center' }}>
                    {pal.name}
                  </Text>
                  <Text style={{ color: withAlpha(pal.text, 0.55), fontSize: 8, fontFamily: fonts.body, textAlign: 'center', marginTop: 1 }}>
                    {pal.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Education */}
        <View style={[styles.card, { backgroundColor: p.card, borderColor: withAlpha(p.primary, 0.20), marginTop: 24 }]}>
          <Text style={[styles.cardTitle, { color: p.text }]}>What is the Gut-Brain?</Text>
          <Text style={[styles.cardBody, { color: p.subtext }]}>
            The Hypothalamic-Pituitary-Adrenal axis governs your stress and recovery cycle.
            Cortisol rises with the sun to wake you; melatonin pours at dusk to restore you.
            Honor this rhythm and your body honors you.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: p.card, borderColor: withAlpha(p.primary, 0.20), marginTop: 12 }]}>
          <Text style={[styles.cardTitle, { color: p.text }]}>Daily Reset</Text>
          <Text style={[styles.kvKey, { color: p.primary, marginTop: 2 }]}>{p.name}</Text>
          <View style={{ gap: 16, marginTop: 12 }}>
            {PHASE_GUIDE[phase].map((entry) => (
              <View key={entry.heading}>
                <Text style={[styles.kvKey, { color: p.primary }]}>{entry.heading}</Text>
                <Text style={[styles.cardBody, { color: p.subtext, marginTop: 4 }]}>{entry.body}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: radius.xxl, overflow: 'hidden', borderWidth: 1, minHeight: 280 },
  heroImg: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroInner: { padding: 24, paddingTop: 120 },
  eyebrow: {
    fontSize: 11, letterSpacing: 1.8, textTransform: 'uppercase', fontFamily: fonts.bodyMedium,
  },
  eyebrowSub: {
    fontSize: 8, letterSpacing: 1, textTransform: 'uppercase', fontFamily: fonts.body, marginTop: 2,
  },
  heroTitle: { fontFamily: fonts.display, fontSize: 26, marginTop: 8, lineHeight: 32 },
  heroDesc: { fontSize: 14, marginTop: 12, fontFamily: fonts.body, lineHeight: 22 },
  sectionLabel: {
    fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase', fontFamily: fonts.bodyMedium,
  },
  phaseChip: {
    flex: 1, borderRadius: radius.xl, paddingVertical: 12, paddingHorizontal: 8, borderWidth: 1,
  },
  card: { padding: 20, borderRadius: radius.xl, borderWidth: 1 },
  cardTitle: { fontFamily: fonts.display, fontSize: 18, marginBottom: 8 },
  cardBody: { fontSize: 14, lineHeight: 22, fontFamily: fonts.body },
  kvKey: { fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', fontFamily: fonts.bodyMedium, marginBottom: 2 },
});
