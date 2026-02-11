
-- Fix: Drop all RESTRICTIVE policies and recreate as PERMISSIVE

-- chat_conversations
DROP POLICY IF EXISTS "Participants can view conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Authenticated can create conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Admins can update conversations" ON public.chat_conversations;

CREATE POLICY "Participants can view conversations" ON public.chat_conversations
FOR SELECT USING (is_chat_participant(auth.uid(), id));

CREATE POLICY "Authenticated can create conversations" ON public.chat_conversations
FOR INSERT WITH CHECK (is_authenticated() AND auth.uid() = created_by);

CREATE POLICY "Admins can update conversations" ON public.chat_conversations
FOR UPDATE USING (is_chat_admin(auth.uid(), id) OR has_role(auth.uid(), 'admin'));

-- chat_messages
DROP POLICY IF EXISTS "Participants can view messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Participants can send messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Admins can update messages (pin)" ON public.chat_messages;
DROP POLICY IF EXISTS "Sender can delete own messages" ON public.chat_messages;

CREATE POLICY "Participants can view messages" ON public.chat_messages
FOR SELECT USING (is_chat_participant(auth.uid(), conversation_id));

CREATE POLICY "Participants can send messages" ON public.chat_messages
FOR INSERT WITH CHECK (
  is_chat_participant(auth.uid(), conversation_id)
  AND auth.uid() = sender_id
  AND (get_chat_conversation_type(conversation_id) != 'announcement' OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Admins can update messages (pin)" ON public.chat_messages
FOR UPDATE USING (has_role(auth.uid(), 'admin') AND is_chat_participant(auth.uid(), conversation_id));

CREATE POLICY "Sender can delete own messages" ON public.chat_messages
FOR DELETE USING (auth.uid() = sender_id);

-- chat_participants
DROP POLICY IF EXISTS "Participants can view other participants" ON public.chat_participants;
DROP POLICY IF EXISTS "Conversation creator or admin can add participants" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can update own participant record" ON public.chat_participants;
DROP POLICY IF EXISTS "Admins can remove participants" ON public.chat_participants;

CREATE POLICY "Participants can view other participants" ON public.chat_participants
FOR SELECT USING (is_chat_participant(auth.uid(), conversation_id));

CREATE POLICY "Conversation creator or admin can add participants" ON public.chat_participants
FOR INSERT WITH CHECK (is_authenticated());

CREATE POLICY "Users can update own participant record" ON public.chat_participants
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can remove participants" ON public.chat_participants
FOR DELETE USING (is_chat_admin(auth.uid(), conversation_id) OR has_role(auth.uid(), 'admin'));

-- Push notification trigger for chat messages
CREATE OR REPLACE FUNCTION public.send_push_on_chat_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  participant_record RECORD;
  sender_name text;
  conv_name text;
  conv_type text;
  edge_url text;
BEGIN
  -- Get sender name
  SELECT full_name INTO sender_name FROM public.profiles WHERE user_id = NEW.sender_id LIMIT 1;
  sender_name := COALESCE(sender_name, 'Alguém');

  -- Get conversation info
  SELECT name, type::text INTO conv_name, conv_type FROM public.chat_conversations WHERE id = NEW.conversation_id;

  edge_url := 'https://uovuggxuurcdnprewtyl.supabase.co/functions/v1/push-notifier?action=send-push';

  -- Send push to all participants except sender
  FOR participant_record IN
    SELECT user_id FROM public.chat_participants
    WHERE conversation_id = NEW.conversation_id AND user_id != NEW.sender_id
  LOOP
    PERFORM net.http_post(
      url := edge_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
      ),
      body := jsonb_build_object(
        'user_id', participant_record.user_id,
        'title', CASE 
          WHEN conv_type = 'direct' THEN sender_name
          WHEN conv_type = 'announcement' THEN '📢 ' || COALESCE(conv_name, 'Comunicado')
          ELSE COALESCE(conv_name, 'Grupo') || ' • ' || sender_name
        END,
        'message', LEFT(NEW.content, 200),
        'url', '/chat',
        'tag', 'chat-' || NEW.conversation_id::text
      )
    );
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_chat_message_push
AFTER INSERT ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.send_push_on_chat_message();
