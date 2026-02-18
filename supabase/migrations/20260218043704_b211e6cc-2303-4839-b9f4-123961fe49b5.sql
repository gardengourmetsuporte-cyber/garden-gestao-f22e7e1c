
-- Add 'bonus' to checklist_type enum
ALTER TYPE checklist_type ADD VALUE IF NOT EXISTS 'bonus';

-- Add is_skipped flag to checklist_completions
ALTER TABLE public.checklist_completions 
ADD COLUMN IF NOT EXISTS is_skipped boolean NOT NULL DEFAULT false;
