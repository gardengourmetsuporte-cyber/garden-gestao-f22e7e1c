-- Allow reset/deletion of timers by owner, admins, or users with unit access
CREATE POLICY "Users can delete task times they can manage"
ON public.checklist_task_times
FOR DELETE
USING (
  user_id = auth.uid()
  OR public.user_has_unit_access(auth.uid(), unit_id)
  OR public.has_role(auth.uid(), 'admin')
);

-- Make reset RPC accept owner reset (not only unit membership)
CREATE OR REPLACE FUNCTION public.reset_checklist_timer(
  p_unit_id uuid,
  p_item_id uuid,
  p_date date,
  p_checklist_type text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_deleted integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF NOT (
    public.user_has_unit_access(auth.uid(), p_unit_id)
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1
      FROM public.checklist_task_times t
      WHERE t.unit_id = p_unit_id
        AND t.item_id = p_item_id
        AND t.date = p_date
        AND t.checklist_type = p_checklist_type
        AND t.user_id = auth.uid()
    )
  ) THEN
    RAISE EXCEPTION 'access_denied';
  END IF;

  DELETE FROM public.checklist_task_times
  WHERE unit_id = p_unit_id
    AND item_id = p_item_id
    AND date = p_date
    AND checklist_type = p_checklist_type;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN COALESCE(v_deleted, 0);
END;
$function$;