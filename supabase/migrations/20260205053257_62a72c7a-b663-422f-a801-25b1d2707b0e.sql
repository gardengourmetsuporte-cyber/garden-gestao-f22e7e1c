-- Add create_transaction column to payment_method_settings
ALTER TABLE public.payment_method_settings 
ADD COLUMN create_transaction boolean NOT NULL DEFAULT true;

-- Update existing records to have create_transaction = true
UPDATE public.payment_method_settings SET create_transaction = true WHERE create_transaction IS NULL;