import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { useQueryClient } from '@tanstack/react-query';

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

export function useChat() {
  const { user } = useAuth();
  const { activeUnitId } = useUnit();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const messagesChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!user || !activeUnitId) {
      setConversations([]);
      setIsLoadingConversations(false);
      return;
    }

    try {
      // Get conversations user participates in for this unit
      const { data: participantData } = await supabase
        .from('chat_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (!participantData || participantData.length === 0) {
        setConversations([]);
        setIsLoadingConversations(false);
        return;
      }

      const convIds = participantData.map(p => p.conversation_id);

      const { data: convData } = await supabase
        .from('chat_conversations')
        .select('*')
        .in('id', convIds)
        .eq('unit_id', activeUnitId)
        .order('updated_at', { ascending: false });

      if (!convData) {
        setConversations([]);
        setIsLoadingConversations(false);
        return;
      }

      // For each conversation, get participants and last message
      const enriched = await Promise.all(
        convData.map(async (conv) => {
          const [participantsRes, messagesRes, myParticipant] = await Promise.all([
            supabase
              .from('chat_participants')
              .select('*')
              .eq('conversation_id', conv.id),
            supabase
              .from('chat_messages')
              .select('*')
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: false })
              .limit(1),
            supabase
              .from('chat_participants')
              .select('last_read_at')
              .eq('conversation_id', conv.id)
              .eq('user_id', user.id)
              .maybeSingle(),
          ]);

          // Fetch participant profiles
          const participantUserIds = (participantsRes.data || []).map(p => p.user_id);
          const { data: pProfiles } = participantUserIds.length > 0
            ? await supabase.from('profiles').select('user_id, full_name, avatar_url').in('user_id', participantUserIds)
            : { data: [] };
          const profileMap = new Map((pProfiles || []).map(p => [p.user_id, p]));

          const participantsWithProfile = (participantsRes.data || []).map(p => ({
            ...p,
            profile: profileMap.get(p.user_id) || { full_name: 'Usuário', avatar_url: null },
          }));

          // Count unread
          let unread_count = 0;
          if (myParticipant.data?.last_read_at) {
            const { count } = await supabase
              .from('chat_messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', conv.id)
              .gt('created_at', myParticipant.data.last_read_at)
              .neq('sender_id', user.id);
            unread_count = count || 0;
          }

          return {
            ...conv,
            type: conv.type as ChatConversation['type'],
            participants: participantsWithProfile,
            last_message: messagesRes.data?.[0] || null,
            unread_count,
          } as ChatConversation;
        })
      );

      // Sort by last message time
      enriched.sort((a, b) => {
        const aTime = a.last_message?.created_at || a.created_at;
        const bTime = b.last_message?.created_at || b.created_at;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });

      setConversations(enriched);
      setTotalUnreadCount(enriched.reduce((sum, c) => sum + (c.unread_count || 0), 0));
    } catch {
      // silent
    } finally {
      setIsLoadingConversations(false);
    }
  }, [user, activeUnitId]);

  // Fetch messages for active conversation
  const fetchMessages = useCallback(async () => {
    if (!activeConversationId || !user) {
      setMessages([]);
      return;
    }

    setIsLoadingMessages(true);
    try {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', activeConversationId)
        .order('created_at', { ascending: true })
        .limit(200);

      if (!data) {
        setMessages([]);
        setIsLoadingMessages(false);
        return;
      }

      // Get unique sender ids and fetch profiles
      const senderIds = [...new Set(data.map(m => m.sender_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', senderIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      setMessages(
        data.map(m => ({
          ...m,
          sender_profile: profileMap.get(m.sender_id) || { full_name: 'Usuário', avatar_url: null },
        }))
      );

      // Mark as read
      await supabase
        .from('chat_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', activeConversationId)
        .eq('user_id', user.id);
    } catch {
      // silent
    } finally {
      setIsLoadingMessages(false);
    }
  }, [activeConversationId, user]);

  // Send message
  const sendMessage = useCallback(async (content: string) => {
    if (!user || !activeConversationId || !content.trim()) return;

    await supabase.from('chat_messages').insert({
      conversation_id: activeConversationId,
      sender_id: user.id,
      content: content.trim(),
    });

    // Update conversation updated_at
    await supabase
      .from('chat_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', activeConversationId);
  }, [user, activeConversationId]);

  // Create direct conversation
  const createDirectConversation = useCallback(async (otherUserId: string) => {
    if (!user || !activeUnitId) return null;

    // Check if DM already exists between these two users in this unit
    const { data: myConvs } = await supabase
      .from('chat_participants')
      .select('conversation_id')
      .eq('user_id', user.id);

    if (myConvs) {
      for (const mc of myConvs) {
        const { data: conv } = await supabase
          .from('chat_conversations')
          .select('*')
          .eq('id', mc.conversation_id)
          .eq('type', 'direct')
          .eq('unit_id', activeUnitId)
          .maybeSingle();

        if (conv) {
          const { data: otherP } = await supabase
            .from('chat_participants')
            .select('user_id')
            .eq('conversation_id', conv.id)
            .eq('user_id', otherUserId)
            .maybeSingle();

          if (otherP) return conv.id;
        }
      }
    }

    // Create new DM
    const { data: newConv } = await supabase
      .from('chat_conversations')
      .insert({
        unit_id: activeUnitId,
        type: 'direct',
        created_by: user.id,
      })
      .select()
      .single();

    if (!newConv) return null;

    await supabase.from('chat_participants').insert([
      { conversation_id: newConv.id, user_id: user.id, role: 'admin' },
      { conversation_id: newConv.id, user_id: otherUserId, role: 'member' },
    ]);

    await fetchConversations();
    return newConv.id;
  }, [user, activeUnitId, fetchConversations]);

  // Create group conversation
  const createGroupConversation = useCallback(async (name: string, memberIds: string[], type: 'group' | 'announcement' = 'group') => {
    if (!user || !activeUnitId) return null;

    const { data: newConv } = await supabase
      .from('chat_conversations')
      .insert({
        unit_id: activeUnitId,
        type,
        name,
        created_by: user.id,
      })
      .select()
      .single();

    if (!newConv) return null;

    const participants = [
      { conversation_id: newConv.id, user_id: user.id, role: 'admin' },
      ...memberIds.map(id => ({
        conversation_id: newConv.id,
        user_id: id,
        role: 'member' as const,
      })),
    ];

    await supabase.from('chat_participants').insert(participants);
    await fetchConversations();
    return newConv.id;
  }, [user, activeUnitId, fetchConversations]);

  // Toggle pin
  const togglePin = useCallback(async (messageId: string, isPinned: boolean) => {
    await supabase
      .from('chat_messages')
      .update({ is_pinned: !isPinned })
      .eq('id', messageId);
    await fetchMessages();
  }, [fetchMessages]);

  // Initial fetch
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
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
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${activeConversationId}`,
        },
        async (payload) => {
          const newMsg = payload.new as ChatMessage;
          // Fetch sender profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_id, full_name, avatar_url')
            .eq('user_id', newMsg.sender_id)
            .maybeSingle();

          setMessages(prev => [
            ...prev,
            {
              ...newMsg,
              sender_profile: profile || { full_name: 'Usuário', avatar_url: null },
            },
          ]);

          // Mark as read if from someone else
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

    return () => {
      channel.unsubscribe();
    };
  }, [activeConversationId, user?.id]);

  // Realtime for conversation list updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('chat-global')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [user, fetchConversations]);

  return {
    conversations,
    activeConversationId,
    setActiveConversationId,
    messages,
    isLoadingConversations,
    isLoadingMessages,
    totalUnreadCount,
    sendMessage,
    createDirectConversation,
    createGroupConversation,
    togglePin,
    fetchConversations,
    fetchMessages,
  };
}
