import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import ResetPaywall from '../src/components/ResetPaywall';
import { useAuth } from '../src/lib/auth';
import { api, invalidateDashboardCache } from '../src/lib/api';
import { formatPeriodEnd } from '../src/lib/resetSubscription';
import { Button, Card } from '../src/components/ui';
import { colors, fonts } from '../src/lib/theme';

export default function ResetSubscribe() {
  const router = useRouter();
  const { reset } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { refresh } = useAuth();
  const [paywallKey, setPaywallKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [entitlement, setEntitlement] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (reset === '1') {
          try {
            await api.expireResetSubscriptionForTesting();
            invalidateDashboardCache();
            refresh().catch(() => {});
          } catch (e) {
            console.warn('expire reset subscription', e);
          }
        }
        const ent = await api.getResetEntitlement();
        if (!cancelled) setEntitlement(ent);
      } catch (e) {
        console.warn('load reset entitlement', e);
        if (!cancelled) {
          setEntitlement({
            entitled: false,
            plan: null,
            provider: null,
            current_period_end: null,
            days_remaining: 0,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [reset, refresh]);

  const onSubscribed = async (ent) => {
    setEntitlement(ent);
    try { await refresh(); } catch { /* best-effort */ }
    router.replace('/gut-brain-plan');
  };

  const onResetTestAccess = async () => {
    try {
      await api.expireResetSubscriptionForTesting();
      invalidateDashboardCache();
      await refresh();
    } catch { /* best-effort */ }
    setEntitlement({ entitled: false, plan: null, provider: null, current_period_end: null, days_remaining: 0 });
    setPaywallKey((k) => k + 1);
  };

  const continueToPlan = () => {
    router.replace('/gut-brain-plan');
  };

  const goToRevive = () => {
    router.replace('/hpa-axis');
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
      <Pressable onPress={goToRevive} hitSlop={10} style={styles.back}>
        <ArrowLeft size={20} strokeWidth={1.6} color={colors.subtext} />
      </Pressable>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 48 }} />
        ) : entitlement?.entitled ? (
          <View style={{ gap: 16, marginTop: 24 }}>
            <Card style={{ padding: 20, gap: 10, alignItems: 'center' }}>
              <Text style={styles.activeTitle}>Reset Plan active</Text>
              <Text style={styles.activeSub}>
                {entitlement.days_remaining} day{entitlement.days_remaining === 1 ? '' : 's'} remaining
                {entitlement.current_period_end
                  ? ` · until ${formatPeriodEnd(entitlement.current_period_end)}`
                  : ''}
              </Text>
              <Button onPress={continueToPlan} style={{ alignSelf: 'stretch', marginTop: 8 }}>
                Continue to assessment
              </Button>
            </Card>
            <Pressable onPress={onResetTestAccess} style={styles.devResetBtn}>
              <Text style={styles.devResetText}>Reset test access</Text>
            </Pressable>
          </View>
        ) : (
          <ResetPaywall
            key={paywallKey}
            onSubscribed={onSubscribed}
            onResetTestAccess={onResetTestAccess}
            showClose
            onClose={goToRevive}
          />
        )}
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
  activeTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.text,
    textAlign: 'center',
  },
  activeSub: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.subtext,
    textAlign: 'center',
    lineHeight: 22,
  },
  devResetBtn: {
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
});
