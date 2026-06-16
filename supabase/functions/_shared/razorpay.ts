const RAZORPAY_BASE = 'https://api.razorpay.com/v1';

export function razorpayAuthHeader() {
  const keyId = Deno.env.get('RAZORPAY_KEY_ID') || '';
  const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET') || '';
  if (!keyId || !keySecret) {
    throw new Error('Razorpay API keys are not configured.');
  }
  const token = btoa(`${keyId}:${keySecret}`);
  return `Basic ${token}`;
}

export async function razorpayFetch(path: string, init: RequestInit = {}) {
  const res = await fetch(`${RAZORPAY_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: razorpayAuthHeader(),
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error?.description || data?.error?.reason || res.statusText;
    throw new Error(msg || 'Razorpay request failed');
  }
  return data;
}

export function planIdForKey(plan: string) {
  if (plan === 'yearly') {
    return Deno.env.get('RAZORPAY_PLAN_YEARLY') || '';
  }
  return Deno.env.get('RAZORPAY_PLAN_MONTHLY') || '';
}

export function planKeyFromProduct(planId: string) {
  const yearly = Deno.env.get('RAZORPAY_PLAN_YEARLY') || '';
  return planId && yearly && planId === yearly ? 'yearly' : 'monthly';
}

/** Standard Checkout — create a one-time order (amount in paise). */
export async function createRazorpayOrder(options: {
  amount: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}) {
  if (!options.amount || options.amount < 100) {
    throw new Error('Amount must be at least 100 paise (₹1).');
  }
  return razorpayFetch('/orders', {
    method: 'POST',
    body: JSON.stringify({
      amount: options.amount,
      currency: options.currency || 'INR',
      receipt: options.receipt,
      notes: options.notes || {},
    }),
  });
}

export async function getRazorpayOrder(orderId: string) {
  return razorpayFetch(`/orders/${orderId}`);
}

/** Standard Checkout — HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET). */
export async function verifyStandardPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
) {
  const secret = Deno.env.get('RAZORPAY_KEY_SECRET') || '';
  if (!secret || !orderId || !paymentId || !signature) return false;

  const body = `${orderId}|${paymentId}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  const expected = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return expected === signature;
}

export function planPeriodEnd(plan: string) {
  const days = plan === 'yearly' ? 365 : 30;
  return new Date(Date.now() + days * 86400000).toISOString();
}

export async function createRazorpaySubscription(
  userId: string,
  plan: string,
  options: { offerId?: string; couponCode?: string } = {},
) {
  const planId = planIdForKey(plan);
  if (!planId) {
    throw new Error(
      `Razorpay plan is not configured for "${plan}". Set RAZORPAY_PLAN_${plan === 'yearly' ? 'YEARLY' : 'MONTHLY'} in Supabase secrets.`,
    );
  }
  const totalCount = plan === 'yearly' ? 10 : 120;
  const notes: Record<string, string> = { user_id: userId, plan };
  if (options.couponCode) notes.coupon_code = options.couponCode;

  const payload: Record<string, unknown> = {
    plan_id: planId,
    total_count: totalCount,
    quantity: 1,
    customer_notify: 1,
    notes,
  };
  if (options.offerId) payload.offer_id = options.offerId;

  try {
    return await razorpayFetch('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (e) {
    const msg = e?.message || '';
    if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('not be found')) {
      throw new Error(
        `Invalid Razorpay plan ID for "${plan}" (${planId}). In Razorpay Test mode go to Subscriptions → Plans, copy plan_id (starts with plan_), then run: npx supabase secrets set RAZORPAY_PLAN_${plan === 'yearly' ? 'YEARLY' : 'MONTHLY'}=plan_xxx`,
      );
    }
    if (msg.toLowerCase().includes('offer')) {
      throw new Error(
        `Razorpay offer could not be applied. Check razorpay_offer_id on the coupon and that the offer is linked to the ${plan} plan in Live/Test mode.`,
      );
    }
    throw e;
  }
}

export async function getRazorpaySubscription(subscriptionId: string) {
  return razorpayFetch(`/subscriptions/${subscriptionId}`);
}

export function periodEndFromSubscription(sub: Record<string, unknown>) {
  const end = sub.current_end ?? sub.end_at;
  if (typeof end === 'number' && end > 0) {
    return new Date(end * 1000).toISOString();
  }
  const plan = (sub.notes as Record<string, string> | undefined)?.plan;
  const days = plan === 'yearly' ? 365 : 30;
  return new Date(Date.now() + days * 86400000).toISOString();
}

export function isPaidSubscriptionStatus(status: string) {
  return ['active', 'authenticated'].includes(status);
}

export async function verifyWebhookSignature(body: string, signature: string) {
  const secret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET') || '';
  if (!secret || !signature) return false;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  const expected = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return expected === signature;
}
