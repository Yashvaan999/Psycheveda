-- Expire all active Reset Plan subscriptions (dev / QA reset)
-- Run in Supabase SQL editor to force the paywall for every user.

update public.reset_subscriptions
set status = 'expired', updated_at = now()
where status = 'active';
