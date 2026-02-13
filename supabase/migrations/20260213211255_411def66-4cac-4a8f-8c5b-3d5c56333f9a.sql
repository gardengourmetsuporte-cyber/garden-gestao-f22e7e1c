
-- Create table for time alert settings per module per unit
CREATE TABLE public.time_alert_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  unit_id uuid REFERENCES public.units(id) ON DELETE CASCADE,
  module_key text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  warning_hour numeric,
  critical_hour numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, unit_id, module_key)
);

-- Enable RLS
ALTER TABLE public.time_alert_settings ENABLE ROW LEVEL SECURITY;

-- Users manage own settings
CREATE POLICY "Users manage own time alert settings"
ON public.time_alert_settings
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_time_alert_settings_updated_at
BEFORE UPDATE ON public.time_alert_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
