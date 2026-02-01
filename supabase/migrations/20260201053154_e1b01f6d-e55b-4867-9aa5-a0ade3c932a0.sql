-- CATEGORIAS: Restringir escrita para admins (corrige warning categories_write_access)
DROP POLICY IF EXISTS "Authenticated can manage categories" ON public.categories;

CREATE POLICY "Admins can manage categories" ON public.categories
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- FORNECEDORES: Restringir escrita para admins
DROP POLICY IF EXISTS "Authenticated can manage suppliers" ON public.suppliers;

CREATE POLICY "Admins can manage suppliers" ON public.suppliers
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- MOVIMENTAÇÕES: Adicionar proteção DELETE (corrige warning stock_movements_no_delete)
CREATE POLICY "Admins can delete movements" ON public.stock_movements
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- ITENS DE INVENTÁRIO: Restringir INSERT/UPDATE para admins
DROP POLICY IF EXISTS "Authenticated can insert items" ON public.inventory_items;
DROP POLICY IF EXISTS "Authenticated can update items" ON public.inventory_items;

CREATE POLICY "Admins can insert items" ON public.inventory_items
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update items" ON public.inventory_items
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));