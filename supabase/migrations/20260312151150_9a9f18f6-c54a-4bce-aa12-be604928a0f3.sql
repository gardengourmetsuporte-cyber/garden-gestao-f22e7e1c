
-- Stock transfers between units
CREATE TABLE public.stock_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  to_unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  completed_by uuid
);

CREATE TABLE public.stock_transfer_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id uuid NOT NULL REFERENCES public.stock_transfers(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  from_item_id uuid REFERENCES public.inventory_items(id),
  to_item_id uuid REFERENCES public.inventory_items(id),
  quantity numeric NOT NULL DEFAULT 0,
  unit_type text NOT NULL DEFAULT 'un'
);

ALTER TABLE public.stock_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transfer_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view transfers for their units" ON public.stock_transfers
  FOR SELECT TO authenticated
  USING (
    from_unit_id IN (SELECT public.get_user_unit_ids(auth.uid()))
    OR to_unit_id IN (SELECT public.get_user_unit_ids(auth.uid()))
  );

CREATE POLICY "Users can create transfers from their units" ON public.stock_transfers
  FOR INSERT TO authenticated
  WITH CHECK (from_unit_id IN (SELECT public.get_user_unit_ids(auth.uid())));

CREATE POLICY "Users can update transfers for their units" ON public.stock_transfers
  FOR UPDATE TO authenticated
  USING (
    from_unit_id IN (SELECT public.get_user_unit_ids(auth.uid()))
    OR to_unit_id IN (SELECT public.get_user_unit_ids(auth.uid()))
  );

CREATE POLICY "Users can view transfer items" ON public.stock_transfer_items
  FOR SELECT TO authenticated
  USING (
    transfer_id IN (
      SELECT id FROM public.stock_transfers 
      WHERE from_unit_id IN (SELECT public.get_user_unit_ids(auth.uid()))
        OR to_unit_id IN (SELECT public.get_user_unit_ids(auth.uid()))
    )
  );

CREATE POLICY "Users can insert transfer items" ON public.stock_transfer_items
  FOR INSERT TO authenticated
  WITH CHECK (
    transfer_id IN (
      SELECT id FROM public.stock_transfers 
      WHERE from_unit_id IN (SELECT public.get_user_unit_ids(auth.uid()))
    )
  );
