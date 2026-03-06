-- Fix DELETE permission for elevated roles on cash closings
-- Current policy only allows app_role=admin, which blocks super_admin users.

DROP POLICY IF EXISTS "Admins can delete closings" ON public.cash_closings;

CREATE POLICY "Admins can delete closings"
ON public.cash_closings
FOR DELETE
TO public
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);