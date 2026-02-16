
ALTER TABLE public.cash_closings ADD COLUMN IF NOT EXISTS signed_account_amount numeric NOT NULL DEFAULT 0;
