import { jsonResponse, optionsResponse } from '../_shared/cors.ts';
import {
  verifyWebhookSignature,
  periodEndFromSubscription,
  planKeyFromProduct,
} from '../_shared/razorpay.ts';
import { createAdminClient, syncRazorpayEntitlement } from '../_shared/supabaseAdmin.ts';

const CANCEL_EVENTS = new Set([
  'subscription.cancelled',
  'subscription.halted',
  'subscription.completed',
  'subscription.expired',
]);

const ACTIVATE_EVENTS = new Set([
  'subscription.activated',
  'subscription.charged',
  'subscription.authenticated',
]);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse();

  try {
    const rawBody = await req.text();
    const signature = req.headers.get('X-Razorpay-Signature') || '';
    const valid = await verifyWebhookSignature(rawBody, signature);
    if (!valid) {
      return jsonResponse({ error: 'Invalid signature' }, 401);
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event as string;
    const entity = payload.payload?.subscription?.entity;
    if (!entity?.id) {
      return jsonResponse({ ok: true, skipped: 'no subscription entity' });
    }

    const notes = (entity.notes || {}) as Record<string, string>;
    const userId = notes.user_id;
    if (!userId) {
      return jsonResponse({ ok: true, skipped: 'no user_id in notes' });
    }

    const admin = createAdminClient();

    if (CANCEL_EVENTS.has(event)) {
      await syncRazorpayEntitlement(admin, {
        userId,
        plan: notes.plan || 'monthly',
        periodEnd: null,
        providerRef: entity.id,
        status: 'cancelled',
      });
      return jsonResponse({ ok: true, action: 'expired' });
    }

    if (ACTIVATE_EVENTS.has(event)) {
      const plan = notes.plan || planKeyFromProduct(entity.plan_id);
      const periodEnd = periodEndFromSubscription(entity);
      await syncRazorpayEntitlement(admin, {
        userId,
        plan,
        periodEnd,
        providerRef: entity.id,
        status: 'active',
      });
      return jsonResponse({ ok: true, action: 'activated' });
    }

    return jsonResponse({ ok: true, skipped: event });
  } catch (e) {
    console.error('razorpay-webhook', e);
    return jsonResponse({ error: e?.message || 'Webhook failed' }, 500);
  }
});
