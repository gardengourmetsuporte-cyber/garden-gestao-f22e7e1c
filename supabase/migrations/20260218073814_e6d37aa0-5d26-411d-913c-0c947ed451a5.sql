-- Drop the old restrictive check constraint on points
ALTER TABLE public.checklist_items DROP CONSTRAINT checklist_items_points_check;

-- Add a new constraint allowing bonus point values (up to 20)
ALTER TABLE public.checklist_items ADD CONSTRAINT checklist_items_points_check CHECK (points >= 0 AND points <= 20);