import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

export function createAdminClient() {
  const url = Deno.env.get('SUPABASE_URL') || '';
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (!url || !key) {
    throw new Error('Supabase service credentials are not configured.');
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function syncRazorpayEntitlement(
  admin: ReturnType<typeof createAdminClient>,
  {
    userId,
    plan,
    periodEnd,
    providerRef,
    status = 'active',
  }: {
    userId: string;
    plan: string;
    periodEnd: string | null;
    providerRef: string;
    status?: string;
  },
) {
  const { data, error } = await admin.rpc('admin_sync_reset_razorpay_subscription', {
    p_user_id: userId,
    p_plan: plan,
    p_period_end: periodEnd,
    p_provider_ref: providerRef,
    p_status: status,
  });
  if (error) throw error;
  return data;
}
