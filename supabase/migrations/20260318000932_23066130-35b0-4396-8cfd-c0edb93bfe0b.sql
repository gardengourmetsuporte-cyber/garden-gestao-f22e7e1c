
-- Update send_push_on_notification to route 'entregas' origin to /deliveries
CREATE OR REPLACE FUNCTION public.send_push_on_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  edge_url text;
BEGIN
  edge_url := 'https://uovuggxuurcdnprewtyl.supabase.co/functions/v1/push-notifier?action=send-push';

  PERFORM net.http_post(
    url := edge_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true),
      'Urgency', 'high'
    ),
    body := jsonb_build_object(
      'user_id', NEW.user_id,
      'title', NEW.title,
      'message', NEW.description,
      'url', CASE NEW.origin
        WHEN 'estoque' THEN '/inventory'
        WHEN 'financeiro' THEN '/finance'
        WHEN 'checklist' THEN '/checklists'
        WHEN 'entregas' THEN '/deliveries'
        WHEN 'caixa' THEN '/cash-closing'
        WHEN 'agenda' THEN '/agenda'
        ELSE '/'
      END,
      'tag', NEW.origin
    )
  );

  RETURN NEW;
END;
$$;
