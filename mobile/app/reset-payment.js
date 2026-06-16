import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ShieldCheck, Tag, ChevronDown, ChevronUp } from 'lucide-react-native';
import { Button, Card, Input } from '../src/components/ui';
import { useAuth } from '../src/lib/auth';
import api, { invalidateDashboardCache } from '../src/lib/api';
import {
  resetPlanDetails,
  isMobileStorePlatform,
  RESET_RENEWAL_DISCOUNT_PERCENT,
} from '../src/lib/resetSubscription';
import {
  isRevenueCatConfigured,
  purchaseResetPlan,
  restoreResetPurchases,
  purchaseErrorMessage,
} from '../src/lib/revenueCat';
import {
  isRazorpayWebConfigured,
  openStandardRazorpayCheckout,
} from '../src/lib/razorpayWeb';
import { colors, fonts, radius } from '../src/lib/theme';

export default function ResetPayment() {
  const router = useRouter();
  const { plan: planParam } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { user, refresh } = useAuth();
  const planKey = planParam === 'yearly' ? 'yearly' : 'monthly';
  const plan = useMemo(() => resetPlanDetails(planKey), [planKey]);

  const [couponOpen, setCouponOpen] = useState(false);
  const [coupon, setCoupon] = useState('');
  const [checkoutCoupon, setCheckoutCoupon] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const isWeb = Platform.OS === 'web';
  const storeReady = isMobileStorePlatform(Platform.OS);
  const billingReady = storeReady && isRevenueCatConfigured();
  const webBillingReady = isWeb && isRazorpayWebConfigured();
  const payAmount = checkoutCoupon?.checkout_price_inr ?? plan.price;

  const finishCheckout = async (entitlement) => {
    const ent = await api.syncResetRevenueCatSubscription({
      plan: entitlement.plan,
      periodEnd: entitlement.periodEnd,
      providerRef: entitlement.productId,
    });
    if (!ent.entitled) throw new Error('Could not activate your subscription.');
    invalidateDashboardCache();
    await refresh();
    router.replace('/gut-brain-plan');
  };

  const finishWebCheckout = async (paymentResponse) => {
    const data = await api.verifyRazorpayPayment({
      razorpay_payment_id: paymentResponse.razorpay_payment_id,
      razorpay_order_id: paymentResponse.razorpay_order_id,
      razorpay_signature: paymentResponse.razorpay_signature,
    });
    if (!data?.entitlement?.entitled) {
      throw new Error('Payment verified but access could not be activated.');
    }
    invalidateDashboardCache();
    await refresh();
    router.replace('/gut-brain-plan');
  };

  const onPay = async () => {
    if (isWeb) {
      if (!webBillingReady) {
        setErr('Add EXPO_PUBLIC_RAZORPAY_KEY_ID to mobile/.env and deploy Supabase Edge Functions.');
        return;
      }
      setBusy(true);
      setErr('');
      try {
        const order = await api.createRazorpayOrder(planKey, checkoutCoupon?.code);
        const paymentResponse = await openStandardRazorpayCheckout({
          orderId: order.order_id,
          keyId: order.key_id,
          amount: order.amount,
          currency: order.currency || 'INR',
          planLabel: plan.label,
          userEmail: user?.email,
          userName: user?.user_metadata?.full_name || user?.user_metadata?.name,
        });
        await finishWebCheckout(paymentResponse);
      } catch (e) {
        if (!e?.userCancelled) setErr(e?.message || 'Checkout failed.');
      } finally {
        setBusy(false);
      }
      return;
    }

    if (!storeReady) {
      setErr('Payment is available in the Psycheveda mobile app (App Store / Google Play).');
      return;
    }
    if (!billingReady) {
      setErr('RevenueCat is not configured yet. Add API keys to mobile/.env and rebuild the app.');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      const { entitlement } = await purchaseResetPlan(planKey);
      await finishCheckout(entitlement);
    } catch (e) {
      const msg = purchaseErrorMessage(e);
      if (msg !== 'Purchase cancelled.') setErr(msg);
    } finally {
      setBusy(false);
    }
  };

  const onRestore = async () => {
    if (!billingReady) {
      setErr('RevenueCat is not configured yet. Add API keys to mobile/.env and rebuild the app.');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      const { entitlement } = await restoreResetPurchases();
      await finishCheckout(entitlement);
    } catch (e) {
      setErr(purchaseErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const applyCoupon = async () => {
    setBusy(true);
    setErr('');
    setCheckoutCoupon(null);
    try {
      if (isWeb && webBillingReady) {
        const result = await api.validateResetCheckoutCoupon(coupon, planKey);
        if (result?.free_grant) {
          const ent = await api.redeemResetCoupon(coupon);
          if (!ent.entitled) throw new Error('Coupon could not be applied.');
          invalidateDashboardCache();
          await refresh();
          router.replace('/gut-brain-plan');
          return;
        }
        if (!result?.valid) throw new Error(result?.error || 'Invalid coupon.');
        setCheckoutCoupon({
          code: result.code,
          checkout_price_inr: result.checkout_price_inr,
        });
        return;
      }

      const ent = await api.redeemResetCoupon(coupon);
      if (!ent.entitled) throw new Error('Coupon could not be applied.');
      invalidateDashboardCache();
      await refresh();
      router.replace('/gut-brain-plan');
    } catch (e) {
      setErr(e?.message || 'Could not apply coupon.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
      <Pressable onPress={() => router.back()} hitSlop={10} style={styles.back}>
        <ArrowLeft size={20} strokeWidth={1.6} color={colors.subtext} />
      </Pressable>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Payment</Text>
        <Text style={styles.sub}>Review your Reset Plan and complete checkout.</Text>

        <Card style={styles.summary}>
          <Text style={styles.summaryLabel}>Reset Plan · {plan.label}</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryItem}>Success Identity assessment</Text>
            <Text style={styles.included}>Included</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryItem}>Elevate daily habit list</Text>
            <Text style={styles.included}>Included</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <View style={{ alignItems: 'flex-end' }}>
              {checkoutCoupon ? (
                <>
                  <Text style={styles.strikePrice}>₹{plan.price}</Text>
                  <Text style={styles.totalPrice}>₹{payAmount}</Text>
                </>
              ) : (
                <Text style={styles.totalPrice}>₹{plan.price}</Text>
              )}
              <Text style={styles.totalCadence}>{plan.cadence}</Text>
            </View>
          </View>
          {checkoutCoupon ? (
            <Text style={styles.couponApplied}>
              Coupon {checkoutCoupon.code} applied — pay ₹{payAmount} at checkout
            </Text>
          ) : null}
        </Card>

        <View style={styles.secureRow}>
          <ShieldCheck size={16} strokeWidth={1.5} color={colors.secondary} />
          <Text style={styles.secureText}>
            {isWeb
              ? `Secure Razorpay checkout · renew active plans with ${RESET_RENEWAL_DISCOUNT_PERCENT}% off`
              : `Secure checkout · renew active plans with ${RESET_RENEWAL_DISCOUNT_PERCENT}% off`}
          </Text>
        </View>

        <Button onPress={onPay} disabled={busy} style={{ marginTop: 20, alignSelf: 'stretch' }}>
          {busy ? <ActivityIndicator color={colors.white} /> : `Pay ₹${payAmount}`}
        </Button>

        {storeReady ? (
          <Button variant="ghost" onPress={onRestore} disabled={busy} style={{ marginTop: 8 }}>
            Restore purchases
          </Button>
        ) : null}

        {err ? <Text style={styles.err}>{err}</Text> : null}

        <Pressable onPress={() => setCouponOpen((o) => !o)} style={styles.couponToggle}>
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
              Test codes (RESET-QA-…) grant free access. Promo codes reduce checkout to ₹1 — apply, then Pay.
            </Text>
            <Input
              value={coupon}
              onChangeText={setCoupon}
              placeholder="RESET-QA-7K4M"
              autoCapitalize="characters"
              autoCorrect={false}
              style={{ marginTop: 8 }}
            />
            <Button
              variant="secondary"
              onPress={applyCoupon}
              disabled={busy || !coupon.trim()}
              style={{ marginTop: 12 }}
            >
              {busy ? <ActivityIndicator color={colors.primary} /> : 'Apply coupon'}
            </Button>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  back: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: colors.text,
    marginTop: 8,
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.subtext,
    marginTop: 4,
    marginBottom: 20,
  },
  summary: { padding: 18, gap: 10 },
  summaryLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.primary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  summaryItem: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text,
  },
  included: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.secondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 6,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.text,
  },
  totalPrice: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: colors.text,
  },
  strikePrice: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.subtext,
    textDecorationLine: 'line-through',
  },
  couponApplied: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.secondary,
    marginTop: 4,
  },
  totalCadence: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.subtext,
  },
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  secureText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.subtext,
    lineHeight: 18,
  },
  err: {
    color: colors.danger,
    fontSize: 13,
    fontFamily: fonts.body,
    marginTop: 12,
    textAlign: 'center',
  },
  couponToggle: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
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
    backgroundColor: colors.card,
  },
  couponHint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.subtext,
    lineHeight: 18,
  },
});
