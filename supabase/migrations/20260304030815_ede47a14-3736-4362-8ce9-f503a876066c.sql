
-- Create delivery status enum
CREATE TYPE public.delivery_status AS ENUM ('pending', 'out', 'delivered', 'cancelled');

-- Create delivery_addresses table
CREATE TABLE public.delivery_addresses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  customer_name text NOT NULL DEFAULT '',
  full_address text NOT NULL DEFAULT '',
  neighborhood text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  reference text,
  lat numeric,
  lng numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create deliveries table
CREATE TABLE public.deliveries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  address_id uuid NOT NULL REFERENCES public.delivery_addresses(id) ON DELETE CASCADE,
  status delivery_status NOT NULL DEFAULT 'pending',
  items_summary text,
  photo_url text,
  total numeric NOT NULL DEFAULT 0,
  notes text,
  assigned_to uuid,
  delivered_at timestamptz,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.delivery_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

-- RLS policies for delivery_addresses
CREATE POLICY "Users can view delivery addresses of their units"
  ON public.delivery_addresses FOR SELECT
  TO authenticated
  USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can insert delivery addresses for their units"
  ON public.delivery_addresses FOR INSERT
  TO authenticated
  WITH CHECK (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can update delivery addresses of their units"
  ON public.delivery_addresses FOR UPDATE
  TO authenticated
  USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can delete delivery addresses of their units"
  ON public.delivery_addresses FOR DELETE
  TO authenticated
  USING (public.user_has_unit_access(auth.uid(), unit_id));

-- RLS policies for deliveries
CREATE POLICY "Users can view deliveries of their units"
  ON public.deliveries FOR SELECT
  TO authenticated
  USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can insert deliveries for their units"
  ON public.deliveries FOR INSERT
  TO authenticated
  WITH CHECK (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can update deliveries of their units"
  ON public.deliveries FOR UPDATE
  TO authenticated
  USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can delete deliveries of their units"
  ON public.deliveries FOR DELETE
  TO authenticated
  USING (public.user_has_unit_access(auth.uid(), unit_id));

-- Storage bucket for delivery photos (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('delivery-photos', 'delivery-photos', false);

-- Storage policies
CREATE POLICY "Authenticated users can upload delivery photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'delivery-photos');

CREATE POLICY "Authenticated users can view delivery photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'delivery-photos');

-- Indexes
CREATE INDEX idx_deliveries_unit_status ON public.deliveries (unit_id, status);
CREATE INDEX idx_deliveries_address ON public.deliveries (address_id);
CREATE INDEX idx_delivery_addresses_unit ON public.delivery_addresses (unit_id);
CREATE INDEX idx_delivery_addresses_neighborhood ON public.delivery_addresses (unit_id, neighborhood);
