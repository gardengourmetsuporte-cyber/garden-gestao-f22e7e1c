
-- Add parent_id column to manager_tasks for subtask hierarchy
ALTER TABLE public.manager_tasks 
ADD COLUMN parent_id UUID REFERENCES public.manager_tasks(id) ON DELETE CASCADE;

-- Create index for efficient parent-child queries
CREATE INDEX idx_manager_tasks_parent_id ON public.manager_tasks(parent_id);
