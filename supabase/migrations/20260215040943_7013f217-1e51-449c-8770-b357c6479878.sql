-- Add delivery_frequency column to suppliers table
-- Values: 'daily' (pedido diário) or 'weekly' (pedido semanal, default)
ALTER TABLE public.suppliers ADD COLUMN delivery_frequency text NOT NULL DEFAULT 'weekly';
