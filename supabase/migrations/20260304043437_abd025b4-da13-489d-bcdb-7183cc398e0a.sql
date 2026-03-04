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
AS $$
DECLARE
  v_deleted integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF NOT public.user_has_unit_access(auth.uid(), p_unit_id) THEN
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
$$;

GRANT EXECUTE ON FUNCTION public.reset_checklist_timer(uuid, uuid, date, text) TO authenticated;