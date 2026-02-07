-- Add points_awarded column to checklist_completions to store 1-4 stars
ALTER TABLE public.checklist_completions
ADD COLUMN IF NOT EXISTS points_awarded integer NOT NULL DEFAULT 1;

-- Add comment for clarity
COMMENT ON COLUMN public.checklist_completions.points_awarded IS 'Number of points awarded (1-4 stars), 0 means already done';