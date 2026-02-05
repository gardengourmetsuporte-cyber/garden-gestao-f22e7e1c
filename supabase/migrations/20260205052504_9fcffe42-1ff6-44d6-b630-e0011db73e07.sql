-- Add new columns to manager_tasks for reminders-style tasks
ALTER TABLE public.manager_tasks 
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS due_date DATE,
ADD COLUMN IF NOT EXISTS due_time TIME;

-- Remove period column constraint (make it optional with default)
-- We'll keep the column for backward compatibility but won't use it
COMMENT ON COLUMN public.manager_tasks.period IS 'Deprecated - kept for backward compatibility';
COMMENT ON COLUMN public.manager_tasks.date IS 'Deprecated - use due_date instead';