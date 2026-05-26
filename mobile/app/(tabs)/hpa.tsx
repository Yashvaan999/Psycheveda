import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/constants/colors';
import { Card, Divider } from '@/components/ui';

const PROTOCOLS = [
  {
    time: '6:00 – 7:00 AM',
    icon: 'sunny-outline' as const,
    title: 'Cortisol Awakening Response',
    body: 'Get 10–20 min of natural light within 30 min of waking. This anchors your circadian clock and maximises the morning cortisol peak for focus and energy.',
  },
  {
    time: '7:00 – 9:00 AM',
    icon: 'fitness-outline' as const,
    title: 'Movement & Activation',
    body: 'Light movement (yoga, walk, breathwork) reduces excess cortisol while boosting BDNF. Avoid intense training on an empty stomach.',
  },
  {
    time: '12:00 – 2:00 PM',
    icon: 'restaurant-outline' as const,
    title: 'Sattvic Midday Nourishment',
    body: 'Largest meal of the day. Favour warm, easily digestible foods. Avoid processed sugar — glucose spikes drive late-day cortisol rebounds.',
  },
  {
    time: '4:00 – 6:00 PM',
    icon: 'leaf-outline' as const,
    title: 'Adaptogenic Window',
    body: 'Ashwagandha (KSM-66), Rhodiola, or Holy Basil (Tulsi) taken in the afternoon support cortisol down-regulation and evening DHEA balance.',
  },
  {
    time: '8:00 – 10:00 PM',
    icon: 'moon-outline' as const,
    title: 'Cortisol Wind-Down',
    body: 'Dim screens, avoid blue light, journal your day. Magnesium glycinate before bed supports GABA and reduces nocturnal cortisol elevation.',
  },
];

export default function HPAAxisScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>HPA Axis</Text>
        <Text style={styles.subtitle}>Hypothalamic–Pituitary–Adrenal Protocol</Text>
      </View>

      {/* Banner */}
      <View style={styles.banner}>
        <Ionicons name="pulse" size={32} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>Cortisol Rhythm Reset</Text>
          <Text style={styles.bannerBody}>
            Align your daily actions with your body's natural cortisol curve for sustained energy, calm focus, and deep sleep.
          </Text>
        </View>
      </View>

      <Divider style={{ marginVertical: 20 }} />

      {/* Protocols */}
      <Text style={styles.sectionTitle}>Daily Protocol</Text>
      {PROTOCOLS.map((p, idx) => (
        <Card key={idx} style={{ marginBottom: 14 }}>
          <View style={styles.protocolHeader}>
            <View style={styles.protocolIconWrap}>
              <Ionicons name={p.icon} size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.protocolTime}>{p.time}</Text>
              <Text style={styles.protocolTitle}>{p.title}</Text>
            </View>
          </View>
          <Text style={styles.protocolBody}>{p.body}</Text>
        </Card>
      ))}

      <Divider style={{ marginVertical: 8 }} />

      {/* Key Markers */}
      <Text style={[styles.sectionTitle, { marginBottom: 14 }]}>Key Biomarkers to Track</Text>
      <View style={styles.markerGrid}>
        {[
          { label: 'Morning Cortisol', target: '15–25 µg/dL', icon: 'trending-up-outline' as const },
          { label: 'Evening Cortisol', target: '< 5 µg/dL', icon: 'trending-down-outline' as const },
          { label: 'DHEA-S', target: 'Age appropriate', icon: 'bar-chart-outline' as const },
          { label: 'HRV', target: '> 60 ms', icon: 'heart-outline' as const },
        ].map((m) => (
          <View key={m.label} style={styles.markerCard}>
            <Ionicons name={m.icon} size={18} color={colors.secondary} />
            <Text style={styles.markerLabel}>{m.label}</Text>
            <Text style={styles.markerTarget}>{m.target}</Text>
          </View>
        ))}
      </View>

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Ionicons name="information-circle-outline" size={16} color={colors.subtext} />
        <Text style={styles.disclaimerText}>
          This content is educational and not a substitute for medical advice. Consult a healthcare provider before making changes to your health protocol.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20 },
  header: { marginBottom: 20 },
  title: { fontFamily: 'Lora_700Bold', fontSize: 28, color: colors.text },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.subtext, marginTop: 2, letterSpacing: 0.5 },
  banner: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: colors.primaryLight,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.primaryMid,
    alignItems: 'flex-start',
  },
  bannerTitle: { fontFamily: 'Lora_700Bold', fontSize: 16, color: colors.text, marginBottom: 4 },
  bannerBody: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.text, lineHeight: 20 },
  sectionTitle: { fontFamily: 'Lora_700Bold', fontSize: 18, color: colors.text, marginBottom: 16 },
  protocolHeader: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 10 },
  protocolIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  protocolTime: { fontFamily: 'Inter_500Medium', fontSize: 11, color: colors.subtext, letterSpacing: 0.5, textTransform: 'uppercase' },
  protocolTitle: { fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.text, marginTop: 2 },
  protocolBody: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.subtext, lineHeight: 20 },
  markerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  markerCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    width: '47%',
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  markerLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.text },
  markerTarget: { fontFamily: 'Inter_400Regular', fontSize: 11, color: colors.subtext },
  disclaimer: { flexDirection: 'row', gap: 8, backgroundColor: colors.card, borderRadius: 12, padding: 14, marginTop: 8, borderWidth: 1, borderColor: colors.border },
  disclaimerText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.subtext, lineHeight: 18 },
});
