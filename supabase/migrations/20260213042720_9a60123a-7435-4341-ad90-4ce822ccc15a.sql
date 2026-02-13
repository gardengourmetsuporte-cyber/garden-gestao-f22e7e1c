
-- =============================================
-- WhatsApp Module: 6 new tables
-- =============================================

-- 1. whatsapp_channels
CREATE TABLE public.whatsapp_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  phone_number text NOT NULL,
  provider text NOT NULL DEFAULT 'evolution',
  api_url text,
  api_key_ref text, -- reference name for the secret stored externally
  is_active boolean NOT NULL DEFAULT false,
  ai_personality text DEFAULT 'Você é um assistente virtual simpático e eficiente. Responda de forma clara e objetiva.',
  business_hours jsonb DEFAULT '{"mon":{"open":"08:00","close":"22:00"},"tue":{"open":"08:00","close":"22:00"},"wed":{"open":"08:00","close":"22:00"},"thu":{"open":"08:00","close":"22:00"},"fri":{"open":"08:00","close":"22:00"},"sat":{"open":"08:00","close":"22:00"},"sun":{"open":"08:00","close":"22:00"}}'::jsonb,
  fallback_message text DEFAULT 'Olá! No momento estamos fora do horário de atendimento. Retornaremos em breve!',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage whatsapp_channels"
  ON public.whatsapp_channels FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. whatsapp_contacts
CREATE TABLE public.whatsapp_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  phone text NOT NULL,
  name text,
  notes text,
  total_orders integer NOT NULL DEFAULT 0,
  last_interaction_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(unit_id, phone)
);

ALTER TABLE public.whatsapp_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage whatsapp_contacts"
  ON public.whatsapp_contacts FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. whatsapp_conversations
CREATE TABLE public.whatsapp_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.whatsapp_channels(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.whatsapp_contacts(id) ON DELETE CASCADE,
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'ai_active' CHECK (status IN ('ai_active', 'human_active', 'closed')),
  assigned_to uuid,
  ai_context jsonb DEFAULT '{}'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage whatsapp_conversations"
  ON public.whatsapp_conversations FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for conversations
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_conversations;

-- 4. whatsapp_messages
CREATE TABLE public.whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  sender_type text NOT NULL CHECK (sender_type IN ('customer', 'ai', 'human')),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage whatsapp_messages"
  ON public.whatsapp_messages FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_messages;

-- 5. whatsapp_orders
CREATE TABLE public.whatsapp_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.whatsapp_conversations(id) ON DELETE SET NULL,
  contact_id uuid NOT NULL REFERENCES public.whatsapp_contacts(id) ON DELETE CASCADE,
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'cancelled')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage whatsapp_orders"
  ON public.whatsapp_orders FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 6. whatsapp_ai_logs
CREATE TABLE public.whatsapp_ai_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  message_id uuid REFERENCES public.whatsapp_messages(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('respond', 'create_order', 'escalate', 'off_hours')),
  reasoning text,
  context_used jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_ai_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage whatsapp_ai_logs"
  ON public.whatsapp_ai_logs FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Indexes for performance
CREATE INDEX idx_whatsapp_contacts_phone ON public.whatsapp_contacts(unit_id, phone);
CREATE INDEX idx_whatsapp_conversations_status ON public.whatsapp_conversations(unit_id, status);
CREATE INDEX idx_whatsapp_messages_conversation ON public.whatsapp_messages(conversation_id, created_at);
CREATE INDEX idx_whatsapp_orders_unit ON public.whatsapp_orders(unit_id, status);
CREATE INDEX idx_whatsapp_ai_logs_conversation ON public.whatsapp_ai_logs(conversation_id, created_at);

-- Update trigger for channels
CREATE TRIGGER update_whatsapp_channels_updated_at
  BEFORE UPDATE ON public.whatsapp_channels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update trigger for orders
CREATE TRIGGER update_whatsapp_orders_updated_at
  BEFORE UPDATE ON public.whatsapp_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
