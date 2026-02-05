-- Create enum for cash closing status
CREATE TYPE public.cash_closing_status AS ENUM ('pending', 'approved', 'divergent');

-- Create cash_closings table
CREATE TABLE public.cash_closings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  user_id UUID NOT NULL,
  unit_name TEXT NOT NULL DEFAULT 'Principal',
  
  -- Payment values
  cash_amount NUMERIC NOT NULL DEFAULT 0,
  debit_amount NUMERIC NOT NULL DEFAULT 0,
  credit_amount NUMERIC NOT NULL DEFAULT 0,
  pix_amount NUMERIC NOT NULL DEFAULT 0,
  delivery_amount NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC GENERATED ALWAYS AS (cash_amount + debit_amount + credit_amount + pix_amount + delivery_amount) STORED,
  
  -- Cash difference (if any)
  cash_difference NUMERIC DEFAULT 0,
  
  -- Receipt/proof
  receipt_url TEXT NOT NULL,
  
  -- Status and validation
  status cash_closing_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  
  -- Manager validation
  validated_by UUID,
  validated_at TIMESTAMP WITH TIME ZONE,
  validation_notes TEXT,
  
  -- Financial integration
  financial_integrated BOOLEAN NOT NULL DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Prevent duplicate closings for same date/unit/user
  UNIQUE(date, unit_name, user_id)
);

-- Enable RLS
ALTER TABLE public.cash_closings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Authenticated users can view their own closings
CREATE POLICY "Users can view own closings"
ON public.cash_closings
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all closings
CREATE POLICY "Admins can view all closings"
ON public.cash_closings
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can create their own closings
CREATE POLICY "Users can create own closings"
ON public.cash_closings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update only pending closings they created
CREATE POLICY "Users can update own pending closings"
ON public.cash_closings
FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending');

-- Admins can update all closings (for validation)
CREATE POLICY "Admins can update all closings"
ON public.cash_closings
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete closings
CREATE POLICY "Admins can delete closings"
ON public.cash_closings
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create updated_at trigger
CREATE TRIGGER update_cash_closings_updated_at
BEFORE UPDATE ON public.cash_closings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('cash-receipts', 'cash-receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for cash-receipts bucket
CREATE POLICY "Cash receipts are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'cash-receipts');

CREATE POLICY "Authenticated can upload receipts"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'cash-receipts' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own receipts"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'cash-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can delete receipts"
ON storage.objects
FOR DELETE
USING (bucket_id = 'cash-receipts' AND has_role(auth.uid(), 'admin'::app_role));