
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free',
ADD COLUMN IF NOT EXISTS plan_status text NOT NULL DEFAULT 'active',
ADD COLUMN IF NOT EXISTS stripe_customer_id text;
