
-- Fix: restrict INSERT to authenticated users or allow system inserts via SECURITY DEFINER
DROP POLICY "System can insert notifications" ON public.notifications;

CREATE POLICY "Authenticated can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (is_authenticated());
