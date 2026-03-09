
CREATE TABLE public.employee_material_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid REFERENCES public.units(id) NOT NULL,
  employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  delivered_by uuid NOT NULL,
  category text NOT NULL DEFAULT 'uniforme',
  item_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  notes text,
  signature_url text,
  delivered_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.employee_material_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "unit_access" ON public.employee_material_deliveries
  FOR ALL TO authenticated
  USING (public.user_has_unit_access(auth.uid(), unit_id));
