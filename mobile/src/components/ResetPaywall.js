import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ClipboardList, Tag, Check, ChevronDown, ChevronUp } from 'lucide-react-native';
import { Button, Card, Input } from './ui';
import {
  RESET_MONTHLY_INR,
  RESET_YEARLY_INR,
  RESET_RENEWAL_DISCOUNT_PERCENT,
} from '../lib/resetSubscription';
import { colors, fonts, radius, withAlpha } from '../lib/theme';

function PlanOption({ label, price, sub, selected, onPress }) {
  return (
    <Pressable onPress={onPress} style={{ flex: 1 }}>
      <Card style={[styles.priceCard, selected && styles.priceCardSelected]}>
        {selected ? (
          <View style={styles.checkBadge}>
            <Check size={12} strokeWidth={2.5} color={colors.white} />
          </View>
        ) : null}
        <Text style={[styles.priceLabel, selected && { color: colors.primary }]}>{label}</Text>
        <Text style={styles.price}>₹{price}</Text>
        <Text style={styles.priceSub}>{sub}</Text>
      </Card>
    </Pressable>
  );
}

export default function ResetPaywall({
  onSubscribed,
  onClose,
  showClose = false,
  onResetTestAccess,
}) {
  const router = useRouter();
  const [plan, setPlan] = useState('monthly');
  const [couponOpen, setCouponOpen] = useState(false);
  const [coupon, setCoupon] = useState('');
  const [busy, setBusy] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [err, setErr] = useState('');

  const goToPayment = () => {
    router.push(`/reset-payment?plan=${plan}`);
  };

  const redeem = async () => {
    setBusy(true);
    setErr('');
    try {
      const api = (await import('../lib/api')).default;
      const ent = await api.redeemResetCoupon(coupon);
      if (!ent.entitled) throw new Error('Coupon could not be applied.');
      onSubscribed?.(ent);
    } catch (e) {
      setErr(e?.message || 'Could not apply coupon.');
    } finally {
      setBusy(false);
    }
  };

  const resetTestAccess = async () => {
    setResetting(true);
    setErr('');
    try {
      const api = (await import('../lib/api')).default;
      const { invalidateDashboardCache } = await import('../lib/api');
      await api.expireResetSubscriptionForTesting();
      invalidateDashboardCache();
      setCoupon('');
      setPlan('monthly');
      onResetTestAccess?.();
    } catch (e) {
      setErr(e?.message || 'Could not reset test access.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.iconRing}>
        <ClipboardList size={28} strokeWidth={1.6} color={colors.primary} />
      </View>

      <Text style={styles.eyebrow}>Reset Plan</Text>
      <Text style={styles.title}>Unlock your personalised plan</Text>
      <Text style={styles.desc}>
        Success Identity assessment, Elevate daily habits, and circadian-aligned reset guidance.
      </Text>

      <Text style={styles.pickLabel}>Choose your plan</Text>
      <View style={styles.priceRow}>
        <PlanOption
          label="Monthly"
          price={RESET_MONTHLY_INR}
          sub="per month"
          selected={plan === 'monthly'}
          onPress={() => setPlan('monthly')}
        />
        <PlanOption
          label="Yearly"
          price={RESET_YEARLY_INR}
          sub="save ₹300"
          selected={plan === 'yearly'}
          onPress={() => setPlan('yearly')}
        />
      </View>

      <Button onPress={goToPayment} style={{ marginTop: 16, alignSelf: 'stretch' }}>
        Continue to payment
      </Button>

      <Text style={styles.renewNote}>
        Renew while your plan is active to save {RESET_RENEWAL_DISCOUNT_PERCENT}% on your next cycle.
      </Text>

      <Pressable
        onPress={() => setCouponOpen((o) => !o)}
        style={styles.couponToggle}
      >
        <View style={styles.couponHead}>
          <Tag size={14} strokeWidth={1.5} color={colors.subtext} />
          <Text style={styles.couponToggleText}>Have a coupon? (optional)</Text>
        </View>
        {couponOpen
          ? <ChevronUp size={16} color={colors.subtext} />
          : <ChevronDown size={16} color={colors.subtext} />}
      </Pressable>

      {couponOpen ? (
        <View style={styles.couponSection}>
          <Text style={styles.couponHint}>
            Test codes grant 1 month free. Same code can be used by many users.
          </Text>
          <Input
            value={coupon}
            onChangeText={setCoupon}
            placeholder="RESET-QA-7K4M"
            autoCapitalize="characters"
            autoCorrect={false}
            style={{ marginTop: 8 }}
          />
          {err ? <Text style={styles.err}>{err}</Text> : null}
          <Button
            variant="secondary"
            onPress={redeem}
            disabled={busy || !coupon.trim()}
            style={{ marginTop: 12 }}
          >
            {busy ? <ActivityIndicator color={colors.primary} /> : 'Apply coupon'}
          </Button>
        </View>
      ) : null}

      <Pressable
        onPress={resetTestAccess}
        disabled={resetting}
        hitSlop={10}
        style={styles.devResetBtn}
      >
        <Text style={styles.devResetText}>
          {resetting ? 'Resetting…' : 'Reset test access'}
        </Text>
      </Pressable>

      {showClose ? (
        <Pressable onPress={onClose} hitSlop={10} style={{ marginTop: 8, alignSelf: 'center' }}>
          <Text style={styles.closeText}>Not now</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 4 },
  iconRing: {
    height: 64,
    width: 64,
    borderRadius: 32,
    backgroundColor: withAlpha(colors.primary, 0.12),
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 8,
  },
  eyebrow: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.primary,
    textAlign: 'center',
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 24,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 30,
  },
  desc: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.subtext,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 4,
    marginBottom: 8,
  },
  pickLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.subtext,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  priceRow: { flexDirection: 'row', gap: 10 },
  priceCard: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    gap: 2,
    position: 'relative',
  },
  priceCardSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: withAlpha(colors.primary, 0.08),
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    height: 20,
    width: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.subtext,
  },
  price: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.text,
  },
  priceSub: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.subtext,
  },
  renewNote: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.secondary,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 12,
    fontStyle: 'italic',
  },
  couponToggle: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  couponHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  couponToggleText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.subtext,
  },
  couponSection: {
    padding: 16,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  couponHint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.subtext,
    lineHeight: 18,
  },
  err: {
    color: colors.danger,
    fontSize: 13,
    fontFamily: fonts.body,
    marginTop: 8,
  },
  devResetBtn: {
    marginTop: 16,
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  devResetText: {
    color: colors.subtext,
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  closeText: {
    color: colors.subtext,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
  },
});
