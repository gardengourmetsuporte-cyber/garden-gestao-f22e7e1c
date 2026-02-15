import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';

async function fetchUnreadCount(userId: string, unitId: string): Promise<number> {
  const { data: parts } = await supabase
    .from('chat_participants')
    .select('conversation_id, last_read_at, conversation:chat_conversations!inner(id, unit_id)')
    .eq('user_id', userId)
    .eq('chat_conversations.unit_id', unitId);

  if (!parts || parts.length === 0) return 0;

  const convIds = parts.map(p => p.conversation_id);
  const oldestLastRead = parts
    .filter(p => p.last_read_at)
    .reduce((oldest, p) => {
      if (!oldest || p.last_read_at! < oldest) return p.last_read_at!;
      return oldest;
    }, '' as string);

  if (!oldestLastRead) return 0;

  const { data: messages } = await supabase
    .from('chat_messages')
    .select('conversation_id, created_at')
    .in('conversation_id', convIds)
    .gt('created_at', oldestLastRead)
    .neq('sender_id', userId);

  if (!messages || messages.length === 0) return 0;

  const lastReadMap = new Map(parts.map(p => [p.conversation_id, p.last_read_at]));
  let total = 0;
  for (const msg of messages) {
    const lastRead = lastReadMap.get(msg.conversation_id);
    if (lastRead && msg.created_at > lastRead) {
      total++;
    }
  }

  return total;
}

export function useChatUnreadCount() {
  const { user } = useAuth();
  const { activeUnitId } = useUnit();
  const queryClient = useQueryClient();

  const queryKey = ['chat-unread-count', user?.id, activeUnitId];

  const { data: unreadCount = 0 } = useQuery({
    queryKey,
    queryFn: () => fetchUnreadCount(user!.id, activeUnitId!),
    enabled: !!user && !!activeUnitId,
    staleTime: 2 * 60 * 1000,
  });

  // Listen for new messages to invalidate cache
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('chat-unread-count')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        () => queryClient.invalidateQueries({ queryKey })
      )
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [user, queryClient]);

  return unreadCount;
}
