import React from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Platform } from 'react-native';
import { colors, radius, shadows, fonts, withAlpha } from '../lib/theme';

export function Button({
  children, onPress, disabled, variant = 'primary', style, testID,
}) {
  const s = variantStyles[variant] || variantStyles.primary;
console.log("test");
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      style={({ pressed }) => [
        styles.btnBase,
        s.btn,
        variant === 'primary' && shadows.cta,
        pressed && !disabled && { opacity: 0.85, transform: [{ scale: 0.97 }] },
        disabled && { opacity: 0.5 },
        style,
      ]}
    >
      {/* TEMP: intentional lint error for CI testing — delete this line */}
      <Text>don't keep this</Text>
      {typeof children === 'string' ? (
        <Text style={[styles.btnText, s.text]}>{children}</Text>
      ) : (
        <View style={styles.btnContent}>
          {React.Children.map(children, (c) =>
            typeof c === 'string'
              ? <Text style={[styles.btnText, s.text]}>{c}</Text>
              : c
          )}
        </View>
      )}
    </Pressable>
  );
}

const variantStyles = {
  primary: {
    btn: { backgroundColor: colors.primary },
    text: { color: colors.white },
  },
  secondary: {
    btn: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
    text: { color: colors.text },
  },
  ghost: {
    btn: { backgroundColor: 'transparent' },
    text: { color: colors.subtext },
  },
  danger: {
    btn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.dangerBorder },
    text: { color: colors.danger },
  },
};

export function Card({ children, style }) {
  return <View style={[styles.card, shadows.card, style]}>{children}</View>;
}

export function Input({ style, ...props }) {
  return (
    <TextInput
      placeholderTextColor={withAlpha(colors.subtext, 0.8)}
      style={[styles.input, style]}
      {...props}
    />
  );
}

export function Textarea({ style, ...props }) {
  return (
    <TextInput
      placeholderTextColor={withAlpha(colors.subtext, 0.8)}
      multiline
      textAlignVertical="top"
      style={[styles.input, styles.textarea, style]}
      {...props}
    />
  );
}

export function Label({ children, style }) {
  return <Text style={[styles.label, style]}>{children}</Text>;
}

export function Badge({ children, tone = 'primary', style }) {
  const map = {
    primary: { bg: withAlpha(colors.primary, 0.12), bd: withAlpha(colors.primary, 0.25), tx: colors.primary },
    sage: { bg: withAlpha(colors.secondary, 0.12), bd: withAlpha(colors.secondary, 0.30), tx: colors.secondary },
    neutral: { bg: colors.bg, bd: colors.border, tx: colors.subtext },
  };
  const t = map[tone] || map.primary;
  return (
    <View style={[styles.badge, { backgroundColor: t.bg, borderColor: t.bd }, style]}>
      {typeof children === 'string' ? (
        <Text style={[styles.badgeText, { color: t.tx }]}>{children}</Text>
      ) : (
        <View style={styles.badgeContent}>
          {React.Children.map(children, (c) =>
            typeof c === 'string' ? (
              <Text style={[styles.badgeText, { color: t.tx }]}>{c}</Text>
            ) : c
          )}
        </View>
      )}
    </View>
  );
}

export function Divider({ label }) {
  return (
    <View style={styles.divider}>
      <View style={styles.dividerLine} />
      {label ? <Text style={styles.dividerLabel}>{label}</Text> : null}
      <View style={styles.dividerLine} />
    </View>
  );
}

export const DisplayText = ({ children, style }) => (
  <Text style={[{ fontFamily: fonts.display, color: colors.text }, style]}>{children}</Text>
);

const styles = StyleSheet.create({
  btnBase: {
    borderRadius: radius.xxl,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnText: { fontFamily: fonts.bodyMedium, fontSize: 15 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    paddingHorizontal: 18,
    paddingVertical: 14,
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.body,
    borderWidth: 1,
    borderColor: colors.border,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  textarea: { minHeight: 140, paddingTop: 14 },
  label: {
    color: colors.subtext,
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginBottom: 10,
    fontFamily: fonts.bodyMedium,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeContent: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badgeText: { fontSize: 11, fontFamily: fonts.bodyMedium },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerLabel: {
    fontSize: 10,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: colors.subtext,
    fontFamily: fonts.body,
  },
});
