-- Add points configuration field to checklist_items
-- 0 = no points, 1-4 = configurable points for the task
ALTER TABLE public.checklist_items 
ADD COLUMN points integer NOT NULL DEFAULT 1;

-- Add constraint to ensure points is between 0 and 4
ALTER TABLE public.checklist_items 
ADD CONSTRAINT checklist_items_points_check CHECK (points >= 0 AND points <= 4);

-- Update existing items to have 1 point by default (already set by default)