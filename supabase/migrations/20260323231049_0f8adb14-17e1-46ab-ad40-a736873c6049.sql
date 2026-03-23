
-- Update checklist_items policy to also allow users with checklists.manage module access
DROP POLICY IF EXISTS "Admins can manage checklist_items" ON public.checklist_items;
CREATE POLICY "Admins can manage checklist_items" ON public.checklist_items
  FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_module_access(auth.uid(), 'checklists.manage')
  ) WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_module_access(auth.uid(), 'checklists.manage')
  );

-- Update checklist_sectors policy
DROP POLICY IF EXISTS "Admins can manage sectors" ON public.checklist_sectors;
CREATE POLICY "Admins can manage sectors" ON public.checklist_sectors
  FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_module_access(auth.uid(), 'checklists.manage')
  ) WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_module_access(auth.uid(), 'checklists.manage')
  );

-- Update checklist_subcategories policy
DROP POLICY IF EXISTS "Admins can manage subcategories" ON public.checklist_subcategories;
CREATE POLICY "Admins can manage subcategories" ON public.checklist_subcategories
  FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_module_access(auth.uid(), 'checklists.manage')
  ) WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_module_access(auth.uid(), 'checklists.manage')
  );
