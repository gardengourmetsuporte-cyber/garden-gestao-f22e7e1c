import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export interface ChatConversation {
  id: string;
  unit_id: string;
  type: 'direct' | 'group' | 'announcement';
  name: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  participants?: ChatParticipant[];
  last_message?: ChatMessage | null;
  unread_count?: number;
}

export interface ChatParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  role: string;
  last_read_at: string | null;
  joined_at: string;
  profile?: { full_name: string; avatar_url: string | null };
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  attachment_url?: string | null;
  attachment_type?: string | null;
  attachment_name?: string | null;
  sender_profile?: { full_name: string; avatar_url: string | null };
}

// ---- Profile cache (shared across queries) ----
const profileCache = new Map<string, { full_name: string; avatar_url: string | null }>();

async function fetchProfilesBatch(userIds: string[]) {
  const missing = userIds.filter(id => !profileCache.has(id));
  if (missing.length > 0) {
    const { data } = await supabase
      .from('profiles').select('user_id, full_name, avatar_url').in('user_id', missing);
    (data || []).forEach(p => profileCache.set(p.user_id, { full_name: p.full_name, avatar_url: p.avatar_url }));
  }
  return profileCache;
}

// ---- Fetch helpers ----

async function fetchConversationsData(userId: string, unitId: string): Promise<ChatConversation[]> {
  // Single query: get my participant records
  const { data: participantData } = await supabase
    .from('chat_participants').select('conversation_id').eq('user_id', userId);

  if (!participantData || participantData.length === 0) return [];
  const convIds = participantData.map(p => p.conversation_id);

  // Parallel: conversations + all participants + recent messages
  const [convResult, participantsResult, messagesResult] = await Promise.all([
    supabase.from('chat_conversations').select('*')
      .in('id', convIds).eq('unit_id', unitId)
      .order('updated_at', { ascending: false }),
    supabase.from('chat_participants').select('*').in('conversation_id', convIds),
    supabase.from('chat_messages').select('id, conversation_id, sender_id, content, created_at')
      .in('conversation_id', convIds)
      .order('created_at', { ascending: false })
      .limit(500),
  ]);

  const convData = convResult.data;
  if (!convData || convData.length === 0) return [];

  const allParticipants = participantsResult.data || [];

  // Fetch profiles in batch
  const allUserIds = [...new Set(allParticipants.map(p => p.user_id))];
  await fetchProfilesBatch(allUserIds);

  // Group messages by conversation - pick latest
  const lastMessageMap = new Map<string, any>();
  (messagesResult.data || []).forEach(m => {
    if (!lastMessageMap.has(m.conversation_id)) {
      lastMessageMap.set(m.conversation_id, m);
    }
  });

  // Unread counts
  const myParticipantMap = new Map(
    allParticipants.filter(p => p.user_id === userId).map(p => [p.conversation_id, p])
  );

  const unreadCountMap = new Map<string, number>();
  (messagesResult.data || []).forEach(m => {
    const myP = myParticipantMap.get(m.conversation_id);
    if (myP?.last_read_at && m.created_at > myP.last_read_at && m.sender_id !== userId) {
      unreadCountMap.set(m.conversation_id, (unreadCountMap.get(m.conversation_id) || 0) + 1);
    }
  });

  const validConvIds = new Set(convData.map(c => c.id));
  const enriched: ChatConversation[] = convData.map(conv => {
    const convParticipants = allParticipants
      .filter(p => p.conversation_id === conv.id)
      .map(p => ({ ...p, profile: profileCache.get(p.user_id) || { full_name: 'Usuário', avatar_url: null } }));

    return {
      ...conv,
      type: conv.type as ChatConversation['type'],
      participants: convParticipants,
      last_message: lastMessageMap.get(conv.id) || null,
      unread_count: unreadCountMap.get(conv.id) || 0,
    };
  });

  enriched.sort((a, b) => {
    const aTime = a.last_message?.created_at || a.created_at;
    const bTime = b.last_message?.created_at || b.created_at;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });

  return enriched;
}

async function fetchMessagesData(conversationId: string, userId: string): Promise<ChatMessage[]> {
  const { data } = await supabase
    .from('chat_messages').select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true }).limit(200);

  if (!data) return [];

  const senderIds = [...new Set(data.map(m => m.sender_id))];
  await fetchProfilesBatch(senderIds);

  // Mark as read (fire and forget)
  supabase
    .from('chat_participants')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId).eq('user_id', userId)
    .then();

  return data.map(m => ({
    ...m,
    sender_profile: profileCache.get(m.sender_id) || { full_name: 'Usuário', avatar_url: null },
  }));
}

// ---- Hook ----

export function useChat() {
  const { user } = useAuth();
  const { activeUnitId } = useUnit();
  const queryClient = useQueryClient();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const messagesChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const conversationsKey = ['chat-conversations', activeUnitId];
  const messagesKey = ['chat-messages', activeConversationId];

  const { data: conversations = [], isLoading: isLoadingConversations } = useQuery({
    queryKey: conversationsKey,
    queryFn: () => fetchConversationsData(user!.id, activeUnitId!),
    enabled: !!user && !!activeUnitId,
    staleTime: 2 * 60 * 1000,
  });

  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: messagesKey,
    queryFn: () => fetchMessagesData(activeConversationId!, user!.id),
    enabled: !!user && !!activeConversationId,
    staleTime: 0,
  });

  const totalUnreadCount = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  const fetchConversations = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: conversationsKey });
  }, [queryClient, activeUnitId]);

  const fetchMessages = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: messagesKey });
  }, [queryClient, activeConversationId]);

  // Optimistic send message
  const sendMessage = useCallback(async (content: string, attachment?: { url: string; type: string; name: string }) => {
    if (!user || !activeConversationId || (!content.trim() && !attachment)) return;

    const optimisticMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: activeConversationId,
      sender_id: user.id,
      content: content.trim(),
      is_pinned: false,
      created_at: new Date().toISOString(),
      attachment_url: attachment?.url || null,
      attachment_type: attachment?.type || null,
      attachment_name: attachment?.name || null,
      sender_profile: profileCache.get(user.id) || { full_name: 'Eu', avatar_url: null },
    };

    // Optimistic update
    queryClient.setQueryData<ChatMessage[]>(messagesKey, old => [...(old || []), optimisticMsg]);

    await supabase.from('chat_messages').insert({
      conversation_id: activeConversationId,
      sender_id: user.id,
      content: content.trim() || (attachment ? `📎 ${attachment.name}` : ''),
      attachment_url: attachment?.url || null,
      attachment_type: attachment?.type || null,
      attachment_name: attachment?.name || null,
    });

    supabase.from('chat_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', activeConversationId).then();
  }, [user, activeConversationId, queryClient, messagesKey]);

  // Create direct conversation
  const createDirectConversation = useCallback(async (otherUserId: string) => {
    if (!user || !activeUnitId) return null;

    const { data: myConvs } = await supabase
      .from('chat_participants').select('conversation_id').eq('user_id', user.id);

    if (myConvs) {
      for (const mc of myConvs) {
        const { data: conv } = await supabase
          .from('chat_conversations').select('*')
          .eq('id', mc.conversation_id).eq('type', 'direct')
          .eq('unit_id', activeUnitId).maybeSingle();

        if (conv) {
          const { data: otherP } = await supabase
            .from('chat_participants').select('user_id')
            .eq('conversation_id', conv.id).eq('user_id', otherUserId).maybeSingle();
          if (otherP) return conv.id;
        }
      }
    }

    const { data: newConv } = await supabase
      .from('chat_conversations')
      .insert({ unit_id: activeUnitId, type: 'direct', created_by: user.id })
      .select().single();

    if (!newConv) return null;

    await supabase.from('chat_participants').insert([
      { conversation_id: newConv.id, user_id: user.id, role: 'admin' },
      { conversation_id: newConv.id, user_id: otherUserId, role: 'member' },
    ]);

    fetchConversations();
    return newConv.id;
  }, [user, activeUnitId, fetchConversations]);

  // Create group conversation
  const createGroupConversation = useCallback(async (name: string, memberIds: string[], type: 'group' | 'announcement' = 'group') => {
    if (!user || !activeUnitId) return null;

    const { data: newConv } = await supabase
      .from('chat_conversations')
      .insert({ unit_id: activeUnitId, type, name, created_by: user.id })
      .select().single();

    if (!newConv) return null;

    const participants = [
      { conversation_id: newConv.id, user_id: user.id, role: 'admin' },
      ...memberIds.map(id => ({ conversation_id: newConv.id, user_id: id, role: 'member' as const })),
    ];

    await supabase.from('chat_participants').insert(participants);
    fetchConversations();
    return newConv.id;
  }, [user, activeUnitId, fetchConversations]);

  // Toggle pin
  const togglePin = useCallback(async (messageId: string, isPinned: boolean) => {
    await supabase.from('chat_messages').update({ is_pinned: !isPinned }).eq('id', messageId);
    fetchMessages();
  }, [fetchMessages]);

  // Realtime subscription for messages
  useEffect(() => {
    if (!activeConversationId) return;

    messagesChannelRef.current?.unsubscribe();

    const channel = supabase
      .channel(`chat-messages-${activeConversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT', schema: 'public', table: 'chat_messages',
          filter: `conversation_id=eq.${activeConversationId}`,
        },
        async (payload) => {
          const newMsg = payload.new as ChatMessage;
          // Skip if it's our optimistic message
          if (newMsg.sender_id === user?.id) {
            // Replace optimistic message with real one
            queryClient.setQueryData<ChatMessage[]>(messagesKey, (old) => {
              const filtered = (old || []).filter(m => !m.id.startsWith('temp-'));
              return [...filtered, {
                ...newMsg,
                sender_profile: profileCache.get(newMsg.sender_id) || { full_name: 'Usuário', avatar_url: null },
              }];
            });
            return;
          }

          await fetchProfilesBatch([newMsg.sender_id]);

          queryClient.setQueryData<ChatMessage[]>(messagesKey, (old) => [
            ...(old || []),
            { ...newMsg, sender_profile: profileCache.get(newMsg.sender_id) || { full_name: 'Usuário', avatar_url: null } },
          ]);

          supabase
            .from('chat_participants')
            .update({ last_read_at: new Date().toISOString() })
            .eq('conversation_id', activeConversationId)
            .eq('user_id', user?.id)
            .then();
        }
      )
      .subscribe();

    messagesChannelRef.current = channel;
    return () => { channel.unsubscribe(); };
  }, [activeConversationId, user?.id]);

  // Realtime for conversation list updates (debounced)
  useEffect(() => {
    if (!user) return;

    let timeout: ReturnType<typeof setTimeout>;
    const channel = supabase
      .channel('chat-global')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        () => {
          clearTimeout(timeout);
          timeout = setTimeout(() => fetchConversations(), 1000);
        }
      )
      .subscribe();

    return () => { clearTimeout(timeout); channel.unsubscribe(); };
  }, [user, fetchConversations]);

  return {
    conversations, activeConversationId, setActiveConversationId,
    messages, isLoadingConversations, isLoadingMessages, totalUnreadCount,
    sendMessage, createDirectConversation, createGroupConversation,
    togglePin, fetchConversations, fetchMessages,
  };
}
