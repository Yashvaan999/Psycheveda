import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { jsonResponse, optionsResponse } from '../_shared/cors.ts';
import {
  getRazorpayOrder,
  planPeriodEnd,
  verifyStandardPaymentSignature,
} from '../_shared/razorpay.ts';
import { createAdminClient, syncRazorpayEntitlement } from '../_shared/supabaseAdmin.ts';

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

    const {
      razorpay_payment_id: paymentId,
      razorpay_order_id: orderId,
      razorpay_signature: signature,
    } = await req.json();

    if (!paymentId || !orderId || !signature) {
      return jsonResponse({ error: 'Missing payment verification fields' }, 400);
    }

    const valid = await verifyStandardPaymentSignature(orderId, paymentId, signature);
    if (!valid) {
      return jsonResponse({ error: 'Payment signature verification failed' }, 400);
    }

    const order = await getRazorpayOrder(orderId);
    const notes = (order.notes || {}) as Record<string, string>;
    if (notes.user_id !== user.id) {
      return jsonResponse({ error: 'Order does not belong to this account' }, 403);
    }

    const plan = notes.plan === 'yearly' ? 'yearly' : 'monthly';
    const periodEnd = planPeriodEnd(plan);
    const admin = createAdminClient();
    const entitlement = await syncRazorpayEntitlement(admin, {
      userId: user.id,
      plan,
      periodEnd,
      providerRef: paymentId,
      status: 'active',
    });

    if (notes.coupon_code) {
      await supabase.rpc('record_reset_checkout_coupon_redemption', {
        p_code: notes.coupon_code,
      });
    }

    return jsonResponse({ success: true, entitlement });
  } catch (e) {
    console.error('verify-payment', e);
    return jsonResponse({ error: e?.message || 'Could not verify payment' }, 500);
  }
});
