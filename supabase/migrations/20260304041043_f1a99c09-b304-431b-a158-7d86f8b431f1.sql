
CREATE TABLE public.shopping_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE NOT NULL,
  quantity NUMERIC DEFAULT 1,
  notes TEXT,
  added_by UUID,
  unit_id UUID REFERENCES public.units(id),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view shopping list items of their unit"
ON public.shopping_list_items FOR SELECT TO authenticated
USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can insert shopping list items to their unit"
ON public.shopping_list_items FOR INSERT TO authenticated
WITH CHECK (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can update shopping list items of their unit"
ON public.shopping_list_items FOR UPDATE TO authenticated
USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can delete shopping list items of their unit"
ON public.shopping_list_items FOR DELETE TO authenticated
USING (public.user_has_unit_access(auth.uid(), unit_id));
