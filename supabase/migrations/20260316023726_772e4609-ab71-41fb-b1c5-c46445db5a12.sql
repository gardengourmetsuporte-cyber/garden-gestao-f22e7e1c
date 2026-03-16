ALTER TABLE public.copilot_agent_config
  ADD COLUMN IF NOT EXISTS allowed_roles text[] DEFAULT ARRAY['owner','admin','member'],
  ADD COLUMN IF NOT EXISTS restrict_destructive_tools boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS max_response_length text DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS active_hours jsonb DEFAULT null,
  ADD COLUMN IF NOT EXISTS auto_greet boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS language text DEFAULT 'pt-BR';