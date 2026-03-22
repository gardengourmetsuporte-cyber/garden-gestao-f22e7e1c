CREATE OR REPLACE FUNCTION public.auto_accept_tablet_order()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  IF NEW.source IN ('mesa', 'balcao', 'mesa_levar', 'qrcode') AND NEW.status IN ('pending', 'awaiting_confirmation', 'new') THEN
    NEW.status := 'confirmed';
  END IF;
  RETURN NEW;
END;
$function$;