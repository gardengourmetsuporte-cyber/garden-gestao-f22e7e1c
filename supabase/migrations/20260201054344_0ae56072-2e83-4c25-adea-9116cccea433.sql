-- Atualizar política de delete em checklist_completions
-- Permite: admin OU o próprio usuário que completou

DROP POLICY IF EXISTS "Admins can delete completions" ON public.checklist_completions;

CREATE POLICY "User or admin can delete completions" ON public.checklist_completions
  FOR DELETE USING (
    has_role(auth.uid(), 'admin'::app_role) 
    OR completed_by = auth.uid()
  );