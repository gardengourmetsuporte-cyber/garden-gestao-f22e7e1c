
-- Waitlist / Queue system
CREATE TABLE public.waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  customer_phone text,
  party_size int NOT NULL DEFAULT 2,
  status text NOT NULL DEFAULT 'waiting',
  estimated_wait_minutes int,
  called_at timestamptz,
  seated_at timestamptz,
  cancelled_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage waitlist for their units"
  ON public.waitlist FOR ALL TO authenticated
  USING (unit_id IN (SELECT get_user_unit_ids(auth.uid())));

CREATE POLICY "Public can view waitlist status"
  ON public.waitlist FOR SELECT TO anon
  USING (true);

-- Employee documents
CREATE TABLE public.employee_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  unit_id uuid NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  title text NOT NULL,
  type text NOT NULL DEFAULT 'other',
  file_url text NOT NULL,
  file_name text,
  expiry_date date,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage employee documents for their units"
  ON public.employee_documents FOR ALL TO authenticated
  USING (unit_id IN (SELECT get_user_unit_ids(auth.uid())));

-- Table map / salon layout
CREATE TABLE public.restaurant_tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  table_number text NOT NULL,
  capacity int NOT NULL DEFAULT 4,
  status text NOT NULL DEFAULT 'free',
  zone text DEFAULT 'Salão',
  pos_x numeric DEFAULT 0,
  pos_y numeric DEFAULT 0,
  shape text DEFAULT 'square',
  is_active boolean DEFAULT true,
  current_order_id uuid,
  occupied_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage tables for their units"
  ON public.restaurant_tables FOR ALL TO authenticated
  USING (unit_id IN (SELECT get_user_unit_ids(auth.uid())));

CREATE POLICY "Public can view tables"
  ON public.restaurant_tables FOR SELECT TO anon
  USING (true);
