
-- Create chat conversation type enum
CREATE TYPE public.chat_conversation_type AS ENUM ('direct', 'group', 'announcement');

-- Chat conversations table
CREATE TABLE public.chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  type chat_conversation_type NOT NULL DEFAULT 'direct',
  name text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Chat participants table
CREATE TABLE public.chat_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  last_read_at timestamptz DEFAULT now(),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (conversation_id, user_id)
);

-- Chat messages table
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  is_pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_chat_participants_user ON public.chat_participants(user_id);
CREATE INDEX idx_chat_participants_conversation ON public.chat_participants(conversation_id);
CREATE INDEX idx_chat_messages_conversation ON public.chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_created ON public.chat_messages(created_at);
CREATE INDEX idx_chat_conversations_unit ON public.chat_conversations(unit_id);

-- Helper function: check if user is participant of a conversation
CREATE OR REPLACE FUNCTION public.is_chat_participant(_user_id uuid, _conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_participants
    WHERE user_id = _user_id AND conversation_id = _conversation_id
  )
$$;

-- Helper function: check if user is admin participant of a conversation
CREATE OR REPLACE FUNCTION public.is_chat_admin(_user_id uuid, _conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_participants
    WHERE user_id = _user_id AND conversation_id = _conversation_id AND role = 'admin'
  )
$$;

-- Helper: get conversation type
CREATE OR REPLACE FUNCTION public.get_chat_conversation_type(_conversation_id uuid)
RETURNS chat_conversation_type
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT type FROM public.chat_conversations WHERE id = _conversation_id
$$;

-- RLS for chat_conversations
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view conversations"
ON public.chat_conversations FOR SELECT
USING (is_chat_participant(auth.uid(), id));

CREATE POLICY "Authenticated can create conversations"
ON public.chat_conversations FOR INSERT
WITH CHECK (is_authenticated() AND auth.uid() = created_by);

CREATE POLICY "Admins can update conversations"
ON public.chat_conversations FOR UPDATE
USING (is_chat_admin(auth.uid(), id) OR has_role(auth.uid(), 'admin'::app_role));

-- RLS for chat_participants
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view other participants"
ON public.chat_participants FOR SELECT
USING (is_chat_participant(auth.uid(), conversation_id));

CREATE POLICY "Conversation creator or admin can add participants"
ON public.chat_participants FOR INSERT
WITH CHECK (is_authenticated());

CREATE POLICY "Users can update own participant record"
ON public.chat_participants FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can remove participants"
ON public.chat_participants FOR DELETE
USING (is_chat_admin(auth.uid(), conversation_id) OR has_role(auth.uid(), 'admin'::app_role));

-- RLS for chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view messages"
ON public.chat_messages FOR SELECT
USING (is_chat_participant(auth.uid(), conversation_id));

CREATE POLICY "Participants can send messages"
ON public.chat_messages FOR INSERT
WITH CHECK (
  is_chat_participant(auth.uid(), conversation_id)
  AND auth.uid() = sender_id
  AND (
    get_chat_conversation_type(conversation_id) != 'announcement'
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "Admins can update messages (pin)"
ON public.chat_messages FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) AND is_chat_participant(auth.uid(), conversation_id));

CREATE POLICY "Sender can delete own messages"
ON public.chat_messages FOR DELETE
USING (auth.uid() = sender_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_participants;

-- Updated_at trigger for conversations
CREATE TRIGGER update_chat_conversations_updated_at
BEFORE UPDATE ON public.chat_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
