import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft } from 'lucide-react-native';
import { hpaPalettes, getHpaPhase, fonts, radius, withAlpha, colors } from '../src/lib/theme';
import GlowSparkle from '../src/components/GlowSparkle';

const PHASES = ['cortisol_am', 'twilight', 'melatonin_pm'];

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
            <Text style={[styles.eyebrow, { color: p.primary }]}>{p.label}</Text>
            <Text style={[styles.heroTitle, { color: p.text }]}>
              Attuning your circadian alchemy
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
                  <Text style={{ color: pal.text, fontSize: 11, fontFamily: fonts.bodyMedium, textAlign: 'center' }}>
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
          <Text style={[styles.cardTitle, { color: p.text }]}>Daily attunement</Text>
          <View style={{ gap: 10, marginTop: 8 }}>
            {[
              ['Morning', 'Sunlight within 30 minutes of waking. Protein-rich breakfast.'],
              ['Midday', 'A 5-minute breath pause. Hydrate. Step outside briefly.'],
              ['Evening', 'Dim lights after sunset. No screens 60 minutes before sleep.'],
            ].map(([k, v]) => (
              <View key={k}>
                <Text style={[styles.kvKey, { color: p.primary }]}>{k}</Text>
                <Text style={[styles.cardBody, { color: p.subtext }]}>{v}</Text>
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
