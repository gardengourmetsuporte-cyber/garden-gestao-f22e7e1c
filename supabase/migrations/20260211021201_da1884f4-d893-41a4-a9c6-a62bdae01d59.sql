
-- Clean up duplicate checklist completions (keep only the first one per item/user/date/type)
DELETE FROM public.checklist_completions
WHERE id NOT IN (
  SELECT DISTINCT ON (item_id, completed_by, date, checklist_type) id
  FROM public.checklist_completions
  ORDER BY item_id, completed_by, date, checklist_type, completed_at ASC
);

-- Add unique constraint to prevent future duplicates
ALTER TABLE public.checklist_completions
ADD CONSTRAINT unique_completion_per_item_user_date
UNIQUE (item_id, completed_by, date, checklist_type);
