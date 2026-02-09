
-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Push notification subscriptions
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own push subscriptions"
ON public.push_subscriptions FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- VAPID keys configuration (auto-generated, no client access)
CREATE TABLE public.push_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vapid_public_key text NOT NULL,
  vapid_private_key text NOT NULL,
  vapid_subject text NOT NULL DEFAULT 'mailto:admin@garden-gestao.com',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.push_config ENABLE ROW LEVEL SECURITY;
-- No RLS policies = only service_role (edge functions) can access

-- Trigger for updated_at
CREATE TRIGGER update_push_subscriptions_updated_at
BEFORE UPDATE ON public.push_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
