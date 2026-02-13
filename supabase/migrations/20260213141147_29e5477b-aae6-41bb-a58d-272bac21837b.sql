
-- ===========================================
-- Recebimento Inteligente - Database Schema
-- ===========================================

-- Storage bucket for invoice/boleto images
INSERT INTO storage.buckets (id, name, public)
VALUES ('smart-receivings', 'smart-receivings', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for smart-receivings bucket
CREATE POLICY "Admins can upload smart-receiving files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'smart-receivings' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can view smart-receiving files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'smart-receivings' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete smart-receiving files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'smart-receivings' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Main table: smart receivings
CREATE TABLE public.smart_receivings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  unit_id uuid REFERENCES public.units(id),
  
  -- Source linking
  order_id uuid REFERENCES public.orders(id),
  supplier_id uuid REFERENCES public.suppliers(id),
  supplier_invoice_id uuid REFERENCES public.supplier_invoices(id),
  
  -- Extracted data
  supplier_name text,
  invoice_number text,
  invoice_date date,
  total_amount numeric DEFAULT 0,
  
  -- Boleto data
  boleto_due_date date,
  boleto_amount numeric,
  boleto_barcode text,
  
  -- Image URLs
  invoice_image_url text,
  boleto_image_url text,
  
  -- AI raw response for debugging
  ai_raw_response jsonb,
  
  -- Status
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'review', 'confirmed', 'cancelled')),
  
  -- Financial integration
  finance_transaction_id uuid,
  
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz
);

-- Items extracted from invoice
CREATE TABLE public.smart_receiving_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  receiving_id uuid NOT NULL REFERENCES public.smart_receivings(id) ON DELETE CASCADE,
  
  -- Extracted from invoice
  raw_description text NOT NULL,
  raw_quantity numeric NOT NULL DEFAULT 0,
  raw_unit_type text,
  raw_unit_price numeric DEFAULT 0,
  raw_total numeric DEFAULT 0,
  
  -- Matched to inventory
  inventory_item_id uuid REFERENCES public.inventory_items(id),
  matched_name text,
  confidence numeric DEFAULT 0, -- 0-1 match confidence
  
  -- User adjustments
  confirmed_quantity numeric,
  confirmed_unit_price numeric,
  is_confirmed boolean DEFAULT false,
  is_new_item boolean DEFAULT false,
  
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.smart_receivings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_receiving_items ENABLE ROW LEVEL SECURITY;

-- RLS: Admins manage all
CREATE POLICY "Admins can manage smart_receivings"
ON public.smart_receivings FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage smart_receiving_items"
ON public.smart_receiving_items FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Indexes
CREATE INDEX idx_smart_receivings_unit ON public.smart_receivings(unit_id);
CREATE INDEX idx_smart_receivings_order ON public.smart_receivings(order_id);
CREATE INDEX idx_smart_receivings_status ON public.smart_receivings(status);
CREATE INDEX idx_smart_receiving_items_receiving ON public.smart_receiving_items(receiving_id);
CREATE INDEX idx_smart_receiving_items_inventory ON public.smart_receiving_items(inventory_item_id);
