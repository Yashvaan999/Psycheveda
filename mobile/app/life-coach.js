import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, HeartHandshake } from 'lucide-react-native';
import { Button } from '../src/components/ui';
import { colors, fonts, radius, shadows, withAlpha } from '../src/lib/theme';

export default function LifeCoach() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 16 }]}>
      <Pressable onPress={() => router.back()} hitSlop={10} style={styles.back}>
        <ArrowLeft size={20} strokeWidth={1.6} color={colors.subtext} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <View style={styles.body}>
        <View style={[styles.card, shadows.card]}>
          <LinearGradient
            colors={[withAlpha(colors.primary, 0.14), withAlpha(colors.sage, 0.10)]}
            style={styles.cardGlow}
          />
          <View style={styles.iconRing}>
            <HeartHandshake size={32} strokeWidth={1.6} color={colors.primary} />
          </View>

          <Text style={styles.eyebrow}>Coming soon</Text>
          <Text style={styles.title}>Consult a Life Coach</Text>
          <Text style={styles.desc}>
            One-on-one guidance tailored to your Success Identity — deeper reframing,
            accountability, and a human partner on your elevation path.
          </Text>

          <View style={styles.pillRow}>
            <View style={styles.pill}>
              <Text style={styles.pillText}>Personalized sessions</Text>
            </View>
            <View style={styles.pill}>
              <Text style={styles.pillText}>Identity-aligned goals</Text>
            </View>
          </View>

          <Button variant="secondary" onPress={() => router.back()} style={{ alignSelf: 'stretch', marginTop: 8 }}>
            Return to my results
          </Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 20,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 6,
  },
  backText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.subtext,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 48,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xxl,
    padding: 28,
    overflow: 'hidden',
  },
  cardGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  iconRing: {
    height: 72,
    width: 72,
    borderRadius: 36,
    backgroundColor: withAlpha(colors.primary, 0.12),
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  eyebrow: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 28,
    color: colors.text,
    lineHeight: 34,
    marginBottom: 12,
    textAlign: 'center',
  },
  desc: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.text,
    lineHeight: 24,
    textAlign: 'center',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 20,
    justifyContent: 'center',
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: withAlpha(colors.secondary, 0.12),
  },
  pillText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.secondary,
    letterSpacing: 0.3,
  },
});
