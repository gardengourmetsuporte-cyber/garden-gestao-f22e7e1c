
-- Fix: Allow conversation creator to see conversation immediately after creation
DROP POLICY IF EXISTS "Participants can view conversations" ON public.chat_conversations;

CREATE POLICY "Participants can view conversations" ON public.chat_conversations
FOR SELECT USING (
  is_chat_participant(auth.uid(), id) OR auth.uid() = created_by
);
