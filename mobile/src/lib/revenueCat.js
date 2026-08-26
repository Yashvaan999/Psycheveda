import { Platform } from 'react-native';
import { isMobileStorePlatform } from './resetSubscription';

/** RevenueCat entitlement identifier — create this in the RevenueCat dashboard. */
export const RESET_ENTITLEMENT_ID = 'reset_access';

/** RevenueCat offering identifier (optional; falls back to `current`). */
export const RESET_OFFERING_ID = 'reset';

function revenueCatApiKey() {
  if (Platform.OS === 'ios') {
    return process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || '';
  }
  if (Platform.OS === 'android') {
    return process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || '';
  }
  return '';
}

export function isRevenueCatConfigured() {
  return isMobileStorePlatform(Platform.OS) && !!revenueCatApiKey();
}

async function getPurchases() {
  if (!isMobileStorePlatform(Platform.OS)) return null;
  const mod = await import('react-native-purchases');
  return mod.default;
}

export async function initRevenueCat(appUserId) {
  if (!isRevenueCatConfigured() || !appUserId) return false;
  try {
    const Purchases = await getPurchases();
    const { LOG_LEVEL } = await import('react-native-purchases');
    if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    Purchases.configure({ apiKey: revenueCatApiKey(), appUserID: appUserId });
    return true;
  } catch {
    return false;
  }
}

export async function logoutRevenueCat() {
  if (!isRevenueCatConfigured()) return;
  try {
    const Purchases = await getPurchases();
    await Purchases.logOut();
  } catch {
    // ignore logout errors
  }
}

function planFromProductId(productId = '') {
  const id = productId.toLowerCase();
  if (id.includes('year') || id.includes('annual')) return 'yearly';
  return 'monthly';
}

export function extractResetEntitlement(customerInfo) {
  const active = customerInfo?.entitlements?.active?.[RESET_ENTITLEMENT_ID];
  if (!active) return null;
  return {
    plan: planFromProductId(active.productIdentifier),
    periodEnd: active.expirationDate,
    productId: active.productIdentifier,
  };
}

export async function getRevenueCatCustomerInfo() {
  if (!isRevenueCatConfigured()) return null;
  try {
    const Purchases = await getPurchases();
    return await Purchases.getCustomerInfo();
  } catch {
    return null;
  }
}

async function resolvePackage(planKey) {
  const Purchases = await getPurchases();
  const offerings = await Purchases.getOfferings();
  const offering = offerings.all?.[RESET_OFFERING_ID] || offerings.current;
  if (!offering) {
    throw new Error('Subscriptions are not available yet. Check RevenueCat offerings.');
  }
  const pkg = planKey === 'yearly' ? offering.annual : offering.monthly;
  if (!pkg) {
    throw new Error(`The ${planKey} plan is not set up in RevenueCat yet.`);
  }
  return pkg;
}

export async function purchaseResetPlan(planKey) {
  if (!isRevenueCatConfigured()) {
    throw new Error('Add RevenueCat API keys to enable in-app purchases.');
  }
  const Purchases = await getPurchases();
  const pkg = await resolvePackage(planKey);
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  const ent = extractResetEntitlement(customerInfo);
  if (!ent?.periodEnd) {
    throw new Error('Purchase completed but Reset access was not granted.');
  }
  return { customerInfo, entitlement: ent };
}

export async function restoreResetPurchases() {
  if (!isRevenueCatConfigured()) {
    throw new Error('Add RevenueCat API keys to enable restore.');
  }
  const Purchases = await getPurchases();
  const customerInfo = await Purchases.restorePurchases();
  const ent = extractResetEntitlement(customerInfo);
  if (!ent?.periodEnd) {
    throw new Error('No active Reset subscription found for this account.');
  }
  return { customerInfo, entitlement: ent };
}

export function purchaseErrorMessage(error) {
  if (!error) return 'Purchase failed.';
  if (error.userCancelled) return 'Purchase cancelled.';
  return error.message || 'Purchase failed.';
}
