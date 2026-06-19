import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { jsonResponse, optionsResponse } from '../_shared/cors.ts';
import { createRazorpayOrder } from '../_shared/razorpay.ts';

const PLAN_AMOUNT_INR = { monthly: 150, yearly: 1500 };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse();

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Not authenticated' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return jsonResponse({ error: 'Not authenticated' }, 401);
    }

    const { plan, coupon_code: couponCode } = await req.json();
    if (plan !== 'monthly' && plan !== 'yearly') {
      return jsonResponse({ error: 'Invalid plan' }, 400);
    }

    let amountInr = PLAN_AMOUNT_INR[plan as keyof typeof PLAN_AMOUNT_INR];
    let normalizedCoupon = '';

    if (couponCode) {
      const { data: coupon, error: couponError } = await supabase.rpc(
        'validate_reset_checkout_coupon',
        { p_code: couponCode, p_plan: plan },
      );
      if (couponError) {
        return jsonResponse({ error: couponError.message || 'Invalid coupon' }, 400);
      }
      if (!coupon?.valid) {
        return jsonResponse({ error: coupon?.error || 'Invalid coupon' }, 400);
      }
      amountInr = coupon.checkout_price_inr;
      normalizedCoupon = coupon.code;
    }

    const amount = amountInr * 100;
    if (amount < 100) {
      return jsonResponse({ error: 'Amount must be at least 100 paise (₹1)' }, 400);
    }

    const receipt = `reset_${user.id.slice(0, 8)}_${Date.now()}`;
    const notes: Record<string, string> = { user_id: user.id, plan };
    if (normalizedCoupon) notes.coupon_code = normalizedCoupon;

    const order = await createRazorpayOrder({
      amount,
      currency: 'INR',
      receipt,
      notes,
    });

    return jsonResponse({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency || 'INR',
      key_id: Deno.env.get('RAZORPAY_KEY_ID') || '',
      key_prefix: (Deno.env.get('RAZORPAY_KEY_ID') || '').slice(0, 12),
    });
  } catch (e) {
    console.error('create-order', e);
    const msg = e?.message || 'Could not create order';
    // Razorpay key/secret mismatch — not a user-session 401
    if (msg.toLowerCase().includes('authentication failed')) {
      return jsonResponse({
        error: 'Razorpay authentication failed. Check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Supabase secrets.',
      }, 500);
    }
    return jsonResponse({ error: msg }, 500);
  }
});
