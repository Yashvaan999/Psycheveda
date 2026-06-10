import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, ClipboardList } from 'lucide-react-native';
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
          <Pressable onPress={() => router.replace('/dashboard')} hitSlop={10}>
            <ArrowLeft size={20} strokeWidth={1.5} color={p.text} />
          </Pressable>
          <Text style={{ flex: 1, color: p.text, fontFamily: fonts.bodyMedium, fontSize: 14 }}>Revive</Text>
          <GlowSparkle size={16} color={colors.gold} />
        </View>

        {/* Phase chooser */}
        <View style={{ marginBottom: 24 }}>
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
              {p.tagline}
            </Text>
            <Text style={[styles.heroDesc, { color: p.subtext }]}>
              {p.description}
            </Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: p.card, borderColor: withAlpha(p.primary, 0.20), marginTop: 24 }]}>
          <Pressable
            onPress={() => router.push('/gut-brain-plan')}
            style={({ pressed }) => [
              styles.planBtn,
              { backgroundColor: p.primary },
              pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
            ]}
          >
            <ClipboardList size={16} strokeWidth={1.8} color={p.bg} />
            <Text style={[styles.planBtnText, { color: p.bg }]}>Plan</Text>
          </Pressable>
          <Text style={[styles.cardBody, { color: p.subtext }]}>
            Revive aligns your stress and recovery cycle with your body&apos;s natural rhythm.
            Cortisol rises with the sun to wake you; melatonin pours at dusk to restore you.
            Honor this rhythm and your body honors you.
          </Text>
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
  planBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    alignSelf: 'flex-start', marginBottom: 14,
    paddingVertical: 10, paddingHorizontal: 22, borderRadius: radius.pill,
  },
  planBtnText: { fontSize: 14, fontFamily: fonts.bodyMedium },
  sectionLabel: {
    fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase', fontFamily: fonts.bodyMedium,
  },
  phaseChip: {
    flex: 1, borderRadius: radius.xl, paddingVertical: 12, paddingHorizontal: 8, borderWidth: 1,
  },
  card: { padding: 20, borderRadius: radius.xl, borderWidth: 1 },
  cardBody: { fontSize: 14, lineHeight: 22, fontFamily: fonts.body },
  kvKey: { fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', fontFamily: fonts.bodyMedium, marginBottom: 2 },
});
