-- Add expenses array column to cash_closings table
ALTER TABLE public.cash_closings 
ADD COLUMN IF NOT EXISTS expenses JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.cash_closings.expenses IS 'Array of expenses objects [{description: string, amount: number}]';