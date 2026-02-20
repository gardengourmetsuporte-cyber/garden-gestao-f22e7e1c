-- Batch reorder function to replace N individual UPDATE calls
CREATE OR REPLACE FUNCTION public.batch_reorder_transactions(p_ids uuid[], p_orders int[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE finance_transactions ft
  SET sort_order = v.new_order
  FROM unnest(p_ids, p_orders) AS v(id, new_order)
  WHERE ft.id = v.id;
END;
$$;

-- Tighten tablet_orders INSERT: require valid unit_id
DROP POLICY IF EXISTS "Public can insert tablet_orders" ON public.tablet_orders;
CREATE POLICY "Public can insert tablet_orders"
ON public.tablet_orders
FOR INSERT
WITH CHECK (
  unit_id IS NOT NULL
);