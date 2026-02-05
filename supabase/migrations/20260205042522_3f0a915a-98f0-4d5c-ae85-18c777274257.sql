-- Add meal_voucher_amount column to cash_closings table
ALTER TABLE public.cash_closings 
ADD COLUMN IF NOT EXISTS meal_voucher_amount numeric DEFAULT 0 NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.cash_closings.meal_voucher_amount IS 'Amount received via meal voucher (Vale Alimentação)';