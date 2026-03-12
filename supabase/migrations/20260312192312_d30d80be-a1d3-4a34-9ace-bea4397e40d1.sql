
-- Add payment columns to tablet_orders
ALTER TABLE public.tablet_orders
  ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'presencial',
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT null,
  ADD COLUMN IF NOT EXISTS payment_link text DEFAULT null,
  ADD COLUMN IF NOT EXISTS asaas_payment_id text DEFAULT null;

-- Create asaas_config table for per-unit ASAAS settings
CREATE TABLE IF NOT EXISTS public.asaas_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  environment text NOT NULL DEFAULT 'sandbox',
  is_active boolean NOT NULL DEFAULT false,
  wallet_id text DEFAULT null,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(unit_id)
);

-- Enable RLS on asaas_config
ALTER TABLE public.asaas_config ENABLE ROW LEVEL SECURITY;

-- RLS policies for asaas_config
CREATE POLICY "Users can view asaas_config for their units"
  ON public.asaas_config FOR SELECT TO authenticated
  USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can insert asaas_config for their units"
  ON public.asaas_config FOR INSERT TO authenticated
  WITH CHECK (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can update asaas_config for their units"
  ON public.asaas_config FOR UPDATE TO authenticated
  USING (public.user_has_unit_access(auth.uid(), unit_id));

-- Allow anon to read tablet_orders payment columns (for menu checkout polling)
-- Already covered by existing tablet_orders policies
