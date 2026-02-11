import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';

export function useChatUnreadCount() {
  const { user } = useAuth();
  const { activeUnitId } = useUnit();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchCount = useCallback(async () => {
    if (!user || !activeUnitId) {
      setUnreadCount(0);
      return;
    }

    try {
      // Single query: get all my participations with conversation unit filter
      const { data: parts } = await supabase
        .from('chat_participants')
        .select('conversation_id, last_read_at, conversation:chat_conversations!inner(id, unit_id)')
        .eq('user_id', user.id)
        .eq('chat_conversations.unit_id', activeUnitId);

      if (!parts || parts.length === 0) {
        setUnreadCount(0);
        return;
      }

      // Build a single query to count all unread messages across all conversations
      // We use OR conditions for each conversation's last_read_at
      const convIds = parts.map(p => p.conversation_id);
      const oldestLastRead = parts
        .filter(p => p.last_read_at)
        .reduce((oldest, p) => {
          if (!oldest || p.last_read_at! < oldest) return p.last_read_at!;
          return oldest;
        }, '' as string);

      if (!oldestLastRead) {
        setUnreadCount(0);
        return;
      }

      // Single count query: all messages in my conversations, after oldest last_read, not from me
      const { data: messages } = await supabase
        .from('chat_messages')
        .select('conversation_id, created_at')
        .in('conversation_id', convIds)
        .gt('created_at', oldestLastRead)
        .neq('sender_id', user.id);

      if (!messages || messages.length === 0) {
        setUnreadCount(0);
        return;
      }

      // Client-side filter: count only messages after each conversation's last_read_at
      const lastReadMap = new Map(parts.map(p => [p.conversation_id, p.last_read_at]));
      let total = 0;
      for (const msg of messages) {
        const lastRead = lastReadMap.get(msg.conversation_id);
        if (lastRead && msg.created_at > lastRead) {
          total++;
        }
      }

      setUnreadCount(total);
    } catch {
      // silent
    }
  }, [user, activeUnitId]);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  // Listen for new messages to refresh count
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('chat-unread-count')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        () => fetchCount()
      )
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [user, fetchCount]);

  return unreadCount;
}
