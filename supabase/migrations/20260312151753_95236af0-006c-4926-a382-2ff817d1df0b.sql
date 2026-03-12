
-- Menu favorites for digital menu customers
CREATE TABLE public.menu_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.tablet_products(id) ON DELETE CASCADE,
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.menu_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own favorites" ON public.menu_favorites
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- NPS surveys
CREATE TABLE public.nps_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  customer_name text,
  customer_phone text,
  score int NOT NULL,
  comment text,
  order_id uuid,
  source text DEFAULT 'digital_menu',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.nps_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert NPS" ON public.nps_responses
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view NPS for their units" ON public.nps_responses
  FOR SELECT TO authenticated
  USING (unit_id IN (SELECT public.get_user_unit_ids(auth.uid())));
