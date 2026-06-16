import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { jsonResponse, optionsResponse } from '../_shared/cors.ts';
import { createRazorpaySubscription } from '../_shared/razorpay.ts';

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

    let offerId: string | undefined;
    let normalizedCoupon: string | undefined;

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
      offerId = coupon.razorpay_offer_id;
      normalizedCoupon = coupon.code;
    }

    const subscription = await createRazorpaySubscription(user.id, plan, {
      offerId,
      couponCode: normalizedCoupon,
    });

    return jsonResponse({
      subscription_id: subscription.id,
      key_id: Deno.env.get('RAZORPAY_KEY_ID') || '',
      status: subscription.status,
    });
  } catch (e) {
    console.error('create-reset-checkout', e);
    return jsonResponse({ error: e?.message || 'Could not start checkout' }, 500);
  }
});
