
-- Price Surveys
CREATE TABLE public.price_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.price_surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own unit price surveys" ON public.price_surveys
  FOR ALL TO authenticated
  USING (public.user_has_unit_access(auth.uid(), unit_id))
  WITH CHECK (public.user_has_unit_access(auth.uid(), unit_id));

-- Price Survey Suppliers
CREATE TABLE public.price_survey_suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid NOT NULL REFERENCES public.price_surveys(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  token uuid NOT NULL DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'pending',
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.price_survey_suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own unit price survey suppliers" ON public.price_survey_suppliers
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.price_surveys ps
    WHERE ps.id = survey_id AND public.user_has_unit_access(auth.uid(), ps.unit_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.price_surveys ps
    WHERE ps.id = survey_id AND public.user_has_unit_access(auth.uid(), ps.unit_id)
  ));

CREATE UNIQUE INDEX idx_price_survey_suppliers_token ON public.price_survey_suppliers(token);

-- Price Survey Responses
CREATE TABLE public.price_survey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_supplier_id uuid NOT NULL REFERENCES public.price_survey_suppliers(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  unit_price numeric NOT NULL DEFAULT 0,
  brand text,
  has_item boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.price_survey_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own unit price survey responses" ON public.price_survey_responses
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.price_survey_suppliers pss
    JOIN public.price_surveys ps ON ps.id = pss.survey_id
    WHERE pss.id = survey_supplier_id AND public.user_has_unit_access(auth.uid(), ps.unit_id)
  ));
