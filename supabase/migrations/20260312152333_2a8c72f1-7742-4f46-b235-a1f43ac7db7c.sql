
-- Batch/Expiry tracking for inventory (FIFO)
CREATE TABLE public.inventory_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES public.inventory_items(id) ON DELETE CASCADE NOT NULL,
  unit_id uuid REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
  batch_number text,
  quantity numeric NOT NULL DEFAULT 0,
  expiry_date date,
  received_at date NOT NULL DEFAULT CURRENT_DATE,
  cost_per_unit numeric DEFAULT 0,
  notes text,
  is_consumed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.inventory_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage batches for their units"
ON public.inventory_batches FOR ALL
TO authenticated
USING (unit_id IN (SELECT public.get_user_unit_ids(auth.uid())))
WITH CHECK (unit_id IN (SELECT public.get_user_unit_ids(auth.uid())));

-- Menu replication log
CREATE TABLE public.menu_replication_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_unit_id uuid REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
  target_unit_id uuid REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
  replicated_by uuid NOT NULL,
  categories_count int DEFAULT 0,
  groups_count int DEFAULT 0,
  products_count int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.menu_replication_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view replication logs for their units"
ON public.menu_replication_logs FOR ALL
TO authenticated
USING (
  source_unit_id IN (SELECT public.get_user_unit_ids(auth.uid()))
  OR target_unit_id IN (SELECT public.get_user_unit_ids(auth.uid()))
);
