import { useEffect } from 'react';
import { useAuth } from '../lib/auth';
import api, { invalidateDashboardCache } from '../lib/api';
import {
  initRevenueCat,
  logoutRevenueCat,
  getRevenueCatCustomerInfo,
  extractResetEntitlement,
  isRevenueCatConfigured,
} from '../lib/revenueCat';

/** Keeps RevenueCat logged in and mirrors active Reset entitlement to Supabase. */
export default function RevenueCatSync() {
  const { user } = useAuth();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!user?.id) {
        await logoutRevenueCat();
        return;
      }
      if (!isRevenueCatConfigured()) return;

      const ready = await initRevenueCat(user.id);
      if (!ready || cancelled) return;

      try {
        const customerInfo = await getRevenueCatCustomerInfo();
        const ent = extractResetEntitlement(customerInfo);
        if (!ent?.periodEnd || cancelled) return;

        await api.syncResetRevenueCatSubscription({
          plan: ent.plan,
          periodEnd: ent.periodEnd,
          providerRef: ent.productId,
        });
        invalidateDashboardCache();
      } catch (e) {
        console.warn('RevenueCat sync', e);
      }
    })();

    return () => { cancelled = true; };
  }, [user?.id]);

  return null;
}
