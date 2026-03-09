
-- Fix: only auto-accept tablet orders (source='mesa'), QR orders stay as awaiting_confirmation
CREATE OR REPLACE FUNCTION public.auto_accept_tablet_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only auto-accept orders from tablet (source='mesa'), not QR code orders
  IF NEW.source = 'mesa' AND NEW.status IN ('pending', 'awaiting_confirmation', 'new') THEN
    NEW.status := 'preparing';
  END IF;
  RETURN NEW;
END;
$$;
