import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { jsonResponse, optionsResponse } from '../_shared/cors.ts';
import {
  getRazorpaySubscription,
  isPaidSubscriptionStatus,
  periodEndFromSubscription,
  planKeyFromProduct,
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

    const { subscription_id: subscriptionId } = await req.json();
    if (!subscriptionId) {
      return jsonResponse({ error: 'Missing subscription_id' }, 400);
    }

    const sub = await getRazorpaySubscription(subscriptionId);
    const notes = (sub.notes || {}) as Record<string, string>;
    if (notes.user_id !== user.id) {
      return jsonResponse({ error: 'Subscription does not belong to this account' }, 403);
    }

    if (!isPaidSubscriptionStatus(sub.status)) {
      return jsonResponse({
        error: 'Payment not completed yet. Finish checkout or wait a moment and try again.',
        status: sub.status,
      }, 409);
    }

    const plan = notes.plan || planKeyFromProduct(sub.plan_id);
    const periodEnd = periodEndFromSubscription(sub);
    const admin = createAdminClient();
    const entitlement = await syncRazorpayEntitlement(admin, {
      userId: user.id,
      plan,
      periodEnd,
      providerRef: sub.id,
      status: 'active',
    });

    if (notes.coupon_code) {
      await supabase.rpc('record_reset_checkout_coupon_redemption', {
        p_code: notes.coupon_code,
      });
    }

    return jsonResponse({ entitlement });
  } catch (e) {
    console.error('confirm-reset-razorpay', e);
    return jsonResponse({ error: e?.message || 'Could not confirm payment' }, 500);
  }
});
