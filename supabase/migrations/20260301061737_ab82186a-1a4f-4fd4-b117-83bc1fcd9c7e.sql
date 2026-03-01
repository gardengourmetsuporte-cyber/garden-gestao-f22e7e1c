-- Batch reorder functions for checklist sectors, subcategories and items
-- Replaces N parallel UPDATE calls with a single RPC call

CREATE OR REPLACE FUNCTION public.batch_reorder_checklist_sectors(p_ids uuid[], p_orders integer[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE checklist_sectors cs
  SET sort_order = v.new_order
  FROM unnest(p_ids, p_orders) AS v(id, new_order)
  WHERE cs.id = v.id;
END;
$$;

CREATE OR REPLACE FUNCTION public.batch_reorder_checklist_subcategories(p_ids uuid[], p_orders integer[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE checklist_subcategories cs
  SET sort_order = v.new_order
  FROM unnest(p_ids, p_orders) AS v(id, new_order)
  WHERE cs.id = v.id;
END;
$$;

CREATE OR REPLACE FUNCTION public.batch_reorder_checklist_items(p_ids uuid[], p_orders integer[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE checklist_items ci
  SET sort_order = v.new_order
  FROM unnest(p_ids, p_orders) AS v(id, new_order)
  WHERE ci.id = v.id;
END;
$$;