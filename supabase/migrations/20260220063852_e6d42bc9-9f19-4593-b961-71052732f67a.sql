
-- Create copilot_preferences table for user alias/shortcut memory
CREATE TABLE public.copilot_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  unit_id UUID REFERENCES public.units(id),
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'alias',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unique index to prevent duplicate keys per user
CREATE UNIQUE INDEX idx_copilot_preferences_user_key ON public.copilot_preferences (user_id, key);

-- Index for fast lookups
CREATE INDEX idx_copilot_preferences_user_id ON public.copilot_preferences (user_id);

-- Enable RLS
ALTER TABLE public.copilot_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own preferences
CREATE POLICY "Users can view own preferences"
  ON public.copilot_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own preferences"
  ON public.copilot_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.copilot_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences"
  ON public.copilot_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_copilot_preferences_updated_at
  BEFORE UPDATE ON public.copilot_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
