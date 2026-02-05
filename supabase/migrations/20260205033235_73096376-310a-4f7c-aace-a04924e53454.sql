-- Add initial_cash column to cash_closings table
ALTER TABLE public.cash_closings 
ADD COLUMN initial_cash numeric NOT NULL DEFAULT 0;