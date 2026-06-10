import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal as RNModal,
  ImageBackground,
  ScrollView,
} from 'react-native';
import { ChevronRight, X, Sunrise } from 'lucide-react-native';
import { colors, fonts, radius, shadows, withAlpha } from '../lib/theme';

function TipsIcon({ size = 36 }) {
  return (
    <View style={[styles.tipsIcon, { width: size, height: size, borderRadius: size / 2 }]}>
      <Sunrise size={Math.round(size * 0.48)} strokeWidth={1.75} color={colors.primary} />
    </View>
  );
}

const ORACLE_BG = require('../../assets/daily-oracle-bg.png');

const PILLAR_STYLES = {
  Health: { bg: withAlpha(colors.sage, 0.20), text: colors.sage },
  Finance: { bg: withAlpha(colors.primary, 0.18), text: colors.primary },
  Career: { bg: withAlpha(colors.secondary, 0.20), text: colors.secondary },
  Relationships: { bg: withAlpha(colors.heart, 0.16), text: colors.heart },
  'Inner Wellness': { bg: withAlpha(colors.gold, 0.24), text: '#8A6D24' },
};

function pillarStyle(pillar) {
  return PILLAR_STYLES[pillar] || { bg: withAlpha(colors.subtext, 0.12), text: colors.subtext };
}

function PillarBadge({ pillar }) {
  const s = pillarStyle(pillar);
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.badgeText, { color: s.text }]}>{pillar}</Text>
    </View>
  );
}

export function DailyOracleTrigger({ tip, onPress }) {
  if (!tip) return null;
  const preview = String(tip.content || '').trim();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.trigger,
        shadows.soft,
        pressed && { opacity: 0.92 },
      ]}
    >
      <TipsIcon size={40} />
      <View style={{ flex: 1 }}>
        <Text style={styles.triggerLabel}>Better You Tips</Text>
        <Text style={styles.triggerPreview} numberOfLines={2}>{preview}</Text>
      </View>
      <ChevronRight size={18} strokeWidth={1.8} color={colors.primary} />
    </Pressable>
  );
}

export default function DailyOracleModal({
  open,
  tip,
  absorbed = false,
  onClose,
  onAbsorb,
  absorbing = false,
}) {
  if (!tip) return null;

  return (
    <RNModal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.panelWrap, shadows.card]}>
          <ImageBackground
            source={ORACLE_BG}
            style={styles.panel}
            imageStyle={styles.panelImage}
            resizeMode="cover"
          >
            <View
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, styles.panelVeil]}
            />
            <View style={styles.closeRow}>
              <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
                <X size={18} strokeWidth={1.5} color={colors.subtext} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
              <View style={styles.contentStack}>
                <View style={styles.titleRow}>
                  <TipsIcon size={32} />
                  <Text style={styles.eyebrow}>Better You Tips</Text>
                </View>
                <PillarBadge pillar={tip.pillar} />
                <Text style={styles.tipBody}>{tip.content}</Text>

                {!absorbed ? (
                  <Pressable
                    onPress={onAbsorb}
                    disabled={absorbing}
                    style={({ pressed }) => [
                      styles.absorbBtn,
                      shadows.cta,
                      pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
                      absorbing && { opacity: 0.7 },
                    ]}
                  >
                    <Text style={styles.absorbText}>{absorbing ? 'Anchoring…' : 'Absorb Strategy'}</Text>
                  </Pressable>
                ) : null}
              </View>
            </ScrollView>
          </ImageBackground>
        </View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginTop: 0,
  },
  tipsIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(colors.primary, 0.10),
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  triggerLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: colors.primary,
    marginBottom: 4,
  },
  triggerPreview: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.text,
    lineHeight: 19,
  },
  overlay: {
    flex: 1,
    backgroundColor: withAlpha(colors.text, 0.35),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  panelWrap: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  panel: {
    width: '100%',
    minHeight: 280,
    backgroundColor: colors.card,
  },
  panelImage: {
    borderRadius: 20,
  },
  panelVeil: {
    backgroundColor: withAlpha(colors.bg, 0.38),
    borderRadius: 20,
  },
  closeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  closeBtn: {
    padding: 4,
    backgroundColor: withAlpha(colors.white, 0.55),
    borderRadius: radius.pill,
  },
  scrollBody: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 4,
  },
  contentStack: {
    alignItems: 'flex-start',
    gap: 16,
    width: '100%',
  },
  eyebrow: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: colors.primary,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  badgeText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  tipBody: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.text,
    lineHeight: 25,
  },
  absorbBtn: {
    alignSelf: 'stretch',
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  absorbText: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.white,
    letterSpacing: 0.3,
  },
});
