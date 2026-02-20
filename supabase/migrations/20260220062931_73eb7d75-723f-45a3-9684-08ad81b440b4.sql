
-- Copilot conversations table
CREATE TABLE public.copilot_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  unit_id UUID REFERENCES public.units(id),
  title TEXT DEFAULT 'Nova conversa',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.copilot_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own copilot conversations"
  ON public.copilot_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own copilot conversations"
  ON public.copilot_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own copilot conversations"
  ON public.copilot_conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own copilot conversations"
  ON public.copilot_conversations FOR DELETE
  USING (auth.uid() = user_id);

-- Copilot messages table
CREATE TABLE public.copilot_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.copilot_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  image_url TEXT,
  tool_calls JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.copilot_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own copilot messages"
  ON public.copilot_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.copilot_conversations c
    WHERE c.id = copilot_messages.conversation_id AND c.user_id = auth.uid()
  ));

CREATE POLICY "Users can create messages in their conversations"
  ON public.copilot_messages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.copilot_conversations c
    WHERE c.id = copilot_messages.conversation_id AND c.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own copilot messages"
  ON public.copilot_messages FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.copilot_conversations c
    WHERE c.id = copilot_messages.conversation_id AND c.user_id = auth.uid()
  ));

-- Indexes for performance
CREATE INDEX idx_copilot_conversations_user ON public.copilot_conversations(user_id);
CREATE INDEX idx_copilot_messages_conversation ON public.copilot_messages(conversation_id);
CREATE INDEX idx_copilot_messages_created ON public.copilot_messages(conversation_id, created_at);

-- Updated_at trigger
CREATE TRIGGER update_copilot_conversations_updated_at
  BEFORE UPDATE ON public.copilot_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
