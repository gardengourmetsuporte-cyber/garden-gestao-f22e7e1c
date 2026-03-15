
-- Configuração do agente por unidade
CREATE TABLE public.copilot_agent_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid REFERENCES public.units(id) ON DELETE CASCADE NOT NULL UNIQUE,
  agent_name text DEFAULT 'Copiloto Garden',
  system_prompt text,
  tone_of_voice text DEFAULT 'profissional e amigável',
  enabled_tools text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Base de conhecimento do Copilot
CREATE TABLE public.copilot_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  category text DEFAULT 'geral',
  is_active boolean DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.copilot_agent_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copilot_knowledge ENABLE ROW LEVEL SECURITY;

-- Policies for copilot_agent_config
CREATE POLICY "Users can view own unit config" ON public.copilot_agent_config
  FOR SELECT TO authenticated
  USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can insert own unit config" ON public.copilot_agent_config
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can update own unit config" ON public.copilot_agent_config
  FOR UPDATE TO authenticated
  USING (public.user_has_unit_access(auth.uid(), unit_id));

-- Policies for copilot_knowledge
CREATE POLICY "Users can view own unit knowledge" ON public.copilot_knowledge
  FOR SELECT TO authenticated
  USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can insert own unit knowledge" ON public.copilot_knowledge
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can update own unit knowledge" ON public.copilot_knowledge
  FOR UPDATE TO authenticated
  USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can delete own unit knowledge" ON public.copilot_knowledge
  FOR DELETE TO authenticated
  USING (public.user_has_unit_access(auth.uid(), unit_id));
