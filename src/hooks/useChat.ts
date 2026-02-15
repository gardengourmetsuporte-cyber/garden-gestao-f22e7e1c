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
  sender_profile?: { full_name: string; avatar_url: string | null };
}

// ---- Fetch helpers ----

async function fetchConversationsData(userId: string, unitId: string): Promise<ChatConversation[]> {
  const { data: participantData } = await supabase
    .from('chat_participants').select('conversation_id').eq('user_id', userId);

  if (!participantData || participantData.length === 0) return [];

  const convIds = participantData.map(p => p.conversation_id);

  const { data: convData } = await supabase
    .from('chat_conversations').select('*')
    .in('id', convIds).eq('unit_id', unitId)
    .order('updated_at', { ascending: false });

  if (!convData || convData.length === 0) return [];

  // Batch: get all participants for all conversations at once
  const { data: allParticipants } = await supabase
    .from('chat_participants').select('*').in('conversation_id', convData.map(c => c.id));

  // Batch: get all unique user_ids and fetch profiles once
  const allUserIds = [...new Set((allParticipants || []).map(p => p.user_id))];
  const profileMap = new Map<string, { full_name: string; avatar_url: string | null }>();
  if (allUserIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles').select('user_id, full_name, avatar_url').in('user_id', allUserIds);
    (profiles || []).forEach(p => profileMap.set(p.user_id, { full_name: p.full_name, avatar_url: p.avatar_url }));
  }

  // Batch: get last message for each conversation (we'll do one query per conv but could optimize further)
  // For now, fetch latest messages in bulk
  const { data: allRecentMessages } = await supabase
    .from('chat_messages').select('*')
    .in('conversation_id', convData.map(c => c.id))
    .order('created_at', { ascending: false });

  // Group messages by conversation and pick the latest
  const lastMessageMap = new Map<string, any>();
  (allRecentMessages || []).forEach(m => {
    if (!lastMessageMap.has(m.conversation_id)) {
      lastMessageMap.set(m.conversation_id, m);
    }
  });

  // Get my participant records for unread count
  const myParticipants = (allParticipants || []).filter(p => p.user_id === userId);
  const myParticipantMap = new Map(myParticipants.map(p => [p.conversation_id, p]));

  // Batch unread count: find the earliest last_read_at, fetch all unread messages in one query
  const unreadCountMap = new Map<string, number>();
  const convsWithLastRead = convData
    .map(c => ({ id: c.id, lastRead: myParticipantMap.get(c.id)?.last_read_at }))
    .filter(c => c.lastRead);

  if (convsWithLastRead.length > 0) {
    const earliestRead = convsWithLastRead.reduce((min, c) => c.lastRead! < min ? c.lastRead! : min, convsWithLastRead[0].lastRead!);
    const { data: unreadMessages } = await supabase
      .from('chat_messages')
      .select('conversation_id, created_at')
      .in('conversation_id', convsWithLastRead.map(c => c.id))
      .gt('created_at', earliestRead)
      .neq('sender_id', userId);

    (unreadMessages || []).forEach(m => {
      const convLastRead = myParticipantMap.get(m.conversation_id)?.last_read_at;
      if (convLastRead && m.created_at > convLastRead) {
        unreadCountMap.set(m.conversation_id, (unreadCountMap.get(m.conversation_id) || 0) + 1);
      }
    });
  }

  const enriched: ChatConversation[] = convData.map(conv => {
    const convParticipants = (allParticipants || []).filter(p => p.conversation_id === conv.id);
    const participantsWithProfile = convParticipants.map(p => ({
      ...p,
      profile: profileMap.get(p.user_id) || { full_name: 'Usuário', avatar_url: null },
    }));

    return {
      ...conv,
      type: conv.type as ChatConversation['type'],
      participants: participantsWithProfile,
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
  const { data: profiles } = await supabase
    .from('profiles').select('user_id, full_name, avatar_url').in('user_id', senderIds);
  const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

  // Mark as read
  await supabase
    .from('chat_participants')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId).eq('user_id', userId);

  return data.map(m => ({
    ...m,
    sender_profile: profileMap.get(m.sender_id) || { full_name: 'Usuário', avatar_url: null },
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
    staleTime: 0, // Always fresh when opening a conversation
  });

  const totalUnreadCount = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  const fetchConversations = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: conversationsKey });
  }, [queryClient, conversationsKey]);

  const fetchMessages = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: messagesKey });
  }, [queryClient, messagesKey]);

  // Send message
  const sendMessage = useCallback(async (content: string) => {
    if (!user || !activeConversationId || !content.trim()) return;

    await supabase.from('chat_messages').insert({
      conversation_id: activeConversationId,
      sender_id: user.id,
      content: content.trim(),
    });

    await supabase
      .from('chat_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', activeConversationId);
  }, [user, activeConversationId]);

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
          const { data: profile } = await supabase
            .from('profiles').select('user_id, full_name, avatar_url')
            .eq('user_id', newMsg.sender_id).maybeSingle();

          queryClient.setQueryData<ChatMessage[]>(messagesKey, (old) => [
            ...(old || []),
            { ...newMsg, sender_profile: profile || { full_name: 'Usuário', avatar_url: null } },
          ]);

          if (newMsg.sender_id !== user?.id) {
            await supabase
              .from('chat_participants')
              .update({ last_read_at: new Date().toISOString() })
              .eq('conversation_id', activeConversationId)
              .eq('user_id', user?.id);
          }
        }
      )
      .subscribe();

    messagesChannelRef.current = channel;
    return () => { channel.unsubscribe(); };
  }, [activeConversationId, user?.id, queryClient, messagesKey]);

  // Realtime for conversation list updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('chat-global')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        () => fetchConversations()
      )
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [user, fetchConversations]);

  return {
    conversations, activeConversationId, setActiveConversationId,
    messages, isLoadingConversations, isLoadingMessages, totalUnreadCount,
    sendMessage, createDirectConversation, createGroupConversation,
    togglePin, fetchConversations, fetchMessages,
  };
}
