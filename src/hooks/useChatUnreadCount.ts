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
      // Get my participations
      const { data: parts } = await supabase
        .from('chat_participants')
        .select('conversation_id, last_read_at')
        .eq('user_id', user.id);

      if (!parts || parts.length === 0) {
        setUnreadCount(0);
        return;
      }

      // Filter to only conversations in active unit
      const convIds = parts.map(p => p.conversation_id);
      const { data: convs } = await supabase
        .from('chat_conversations')
        .select('id')
        .in('id', convIds)
        .eq('unit_id', activeUnitId);

      if (!convs || convs.length === 0) {
        setUnreadCount(0);
        return;
      }

      const unitConvIds = new Set(convs.map(c => c.id));
      let total = 0;

      for (const part of parts) {
        if (!unitConvIds.has(part.conversation_id)) continue;
        if (!part.last_read_at) continue;

        const { count } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', part.conversation_id)
          .gt('created_at', part.last_read_at)
          .neq('sender_id', user.id);

        total += count || 0;
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
