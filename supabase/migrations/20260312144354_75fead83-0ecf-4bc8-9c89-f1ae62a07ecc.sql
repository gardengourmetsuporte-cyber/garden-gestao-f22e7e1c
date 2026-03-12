
-- =============================================
-- 1. INVENTORY COUNTS (periodic stock counting)
-- =============================================
CREATE TABLE public.inventory_counts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  status text NOT NULL DEFAULT 'in_progress',
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.inventory_counts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "unit_access" ON public.inventory_counts
  FOR ALL TO authenticated
  USING (unit_id IN (SELECT get_user_unit_ids(auth.uid())));

CREATE TABLE public.inventory_count_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  count_id uuid NOT NULL REFERENCES inventory_counts(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  system_stock numeric NOT NULL DEFAULT 0,
  counted_stock numeric,
  adjusted boolean DEFAULT false,
  counted_by uuid REFERENCES auth.users(id),
  counted_at timestamptz
);

ALTER TABLE public.inventory_count_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "unit_access" ON public.inventory_count_items
  FOR ALL TO authenticated
  USING (count_id IN (SELECT id FROM inventory_counts WHERE unit_id IN (SELECT get_user_unit_ids(auth.uid()))));

-- =============================================
-- 2. RESERVATIONS
-- =============================================
CREATE TABLE public.reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  customer_phone text,
  customer_email text,
  party_size int NOT NULL DEFAULT 2,
  reservation_date date NOT NULL,
  reservation_time time NOT NULL,
  duration_minutes int DEFAULT 120,
  status text NOT NULL DEFAULT 'confirmed',
  table_number text,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "unit_access" ON public.reservations
  FOR ALL TO authenticated
  USING (unit_id IN (SELECT get_user_unit_ids(auth.uid())));

-- =============================================
-- 3. DISCOUNT COUPONS
-- =============================================
CREATE TABLE public.discount_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  code text NOT NULL,
  discount_type text NOT NULL DEFAULT 'percentage',
  discount_value numeric NOT NULL DEFAULT 0,
  min_order_value numeric DEFAULT 0,
  max_uses int,
  current_uses int DEFAULT 0,
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(unit_id, code)
);

ALTER TABLE public.discount_coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "unit_access" ON public.discount_coupons
  FOR ALL TO authenticated
  USING (unit_id IN (SELECT get_user_unit_ids(auth.uid())));
