-- Create payment method settings table
CREATE TABLE public.payment_method_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  method_key text NOT NULL,
  method_name text NOT NULL,
  settlement_type text NOT NULL DEFAULT 'immediate', -- 'immediate', 'business_days', 'weekly_day'
  settlement_days integer DEFAULT 0, -- days for business_days type
  settlement_day_of_week integer DEFAULT NULL, -- 0-6 for weekly (0=Sunday, 3=Wednesday)
  fee_percentage numeric DEFAULT 0, -- discount percentage (e.g., 0.72 for 0.72%)
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, method_key)
);

-- Enable RLS
ALTER TABLE public.payment_method_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own settings
CREATE POLICY "Users manage own payment settings"
ON public.payment_method_settings
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_payment_method_settings_updated_at
BEFORE UPDATE ON public.payment_method_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();