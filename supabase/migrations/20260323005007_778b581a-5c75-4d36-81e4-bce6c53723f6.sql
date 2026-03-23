
CREATE OR REPLACE FUNCTION public.has_module_access(_user_id uuid, _module text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_units uu
    JOIN public.access_levels al ON al.id = uu.access_level_id
    WHERE uu.user_id = _user_id
      AND _module = ANY(al.modules)
  )
$$;

DROP POLICY IF EXISTS "Admins can update items" ON public.inventory_items;
DROP POLICY IF EXISTS "Admins can insert items" ON public.inventory_items;
DROP POLICY IF EXISTS "Admins can delete items" ON public.inventory_items;

CREATE POLICY "Users with inventory.create can insert items"
ON public.inventory_items FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_module_access(auth.uid(), 'inventory.create')
);

CREATE POLICY "Users with inventory.create can update items"
ON public.inventory_items FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_module_access(auth.uid(), 'inventory.create')
);

CREATE POLICY "Users with inventory.delete can delete items"
ON public.inventory_items FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_module_access(auth.uid(), 'inventory.delete')
);

DROP POLICY IF EXISTS "Admins can insert movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Admins can delete movements" ON public.stock_movements;

CREATE POLICY "Users with inventory.movements can insert"
ON public.stock_movements FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_module_access(auth.uid(), 'inventory.movements')
);

CREATE POLICY "Users with inventory.movements can delete"
ON public.stock_movements FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_module_access(auth.uid(), 'inventory.movements')
);
