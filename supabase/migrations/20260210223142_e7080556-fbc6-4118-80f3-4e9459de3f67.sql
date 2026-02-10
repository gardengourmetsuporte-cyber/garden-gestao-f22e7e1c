-- Add sort_order column to finance_transactions for manual ordering within a day
ALTER TABLE public.finance_transactions 
ADD COLUMN sort_order integer NOT NULL DEFAULT 0;