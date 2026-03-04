
-- Fix: Replace FOR ALL with specific operation policies
DROP POLICY IF EXISTS "Users can manage timer settings for their units" ON public.checklist_timer_settings;

CREATE POLICY "Users can insert timer settings for their units"
ON public.checklist_timer_settings FOR INSERT TO authenticated
WITH CHECK (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can update timer settings for their units"
ON public.checklist_timer_settings FOR UPDATE TO authenticated
USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can delete timer settings for their units"
ON public.checklist_timer_settings FOR DELETE TO authenticated
USING (public.user_has_unit_access(auth.uid(), unit_id));
