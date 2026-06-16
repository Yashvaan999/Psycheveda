/** Reset Plan subscription helpers (web Razorpay, mobile IAP, coupons). */

export const RESET_MONTHLY_INR = 150;
export const RESET_YEARLY_INR = 1500;
export const RESET_RENEWAL_DISCOUNT_PERCENT = 5;

export const EMPTY_ENTITLEMENT = {
  entitled: false,
  plan: null,
  provider: null,
  current_period_end: null,
  days_remaining: 0,
};

export function parseEntitlement(data) {
  if (!data) return { ...EMPTY_ENTITLEMENT };
  if (data.entitled !== true) {
    return {
      ...EMPTY_ENTITLEMENT,
      current_period_end: data.current_period_end || null,
    };
  }
  return {
    entitled: true,
    plan: data.plan || null,
    provider: data.provider || null,
    current_period_end: data.current_period_end || null,
    days_remaining: Number(data.days_remaining) || 0,
  };
}

export function filterElevateContent(items, entitled, sourceKey = 'source') {
  if (entitled) return items || [];
  return (items || []).filter((item) => item[sourceKey] !== 'elevate');
}

export function isMobileStorePlatform(os) {
  return os === 'ios' || os === 'android';
}

export function resetPlanDetails(plan) {
  if (plan === 'yearly') {
    return {
      key: 'yearly',
      label: 'Yearly',
      price: RESET_YEARLY_INR,
      period: '1 year',
      cadence: 'per year',
    };
  }
  return {
    key: 'monthly',
    label: 'Monthly',
    price: RESET_MONTHLY_INR,
    period: '1 month',
    cadence: 'per month',
  };
}

export function formatPeriodEnd(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
