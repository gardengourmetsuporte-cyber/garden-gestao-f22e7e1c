
-- Function to send push notification via edge function when a notification is inserted
CREATE OR REPLACE FUNCTION public.send_push_on_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  edge_url text;
  service_key text;
BEGIN
  -- Build the edge function URL
  edge_url := 'https://uovuggxuurcdnprewtyl.supabase.co/functions/v1/push-notifier?action=send-push';
  
  -- Get the service role key from vault or use direct
  service_key := current_setting('app.settings.service_role_key', true);
  
  -- Call the edge function via pg_net
  PERFORM net.http_post(
    url := edge_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
    ),
    body := jsonb_build_object(
      'user_id', NEW.user_id,
      'title', NEW.title,
      'message', NEW.description,
      'url', CASE NEW.origin
        WHEN 'estoque' THEN '/inventory'
        WHEN 'financeiro' THEN '/finance'
        WHEN 'checklist' THEN '/checklists'
        ELSE '/'
      END,
      'tag', NEW.origin
    )
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger on notifications table
CREATE TRIGGER send_push_on_notification
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.send_push_on_notification();
