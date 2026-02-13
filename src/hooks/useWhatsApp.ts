import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { useEffect } from 'react';
import type {
  WhatsAppChannel, WhatsAppConversation, WhatsAppMessage,
  WhatsAppOrder, WhatsAppAILog, WhatsAppContact
} from '@/types/whatsapp';
import { toast } from '@/hooks/use-toast';

// ============ CHANNELS ============

export function useWhatsAppChannels() {
  const { activeUnitId } = useUnit();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['whatsapp-channels', activeUnitId],
    queryFn: async () => {
      if (!activeUnitId) return [];
      const { data, error } = await supabase
        .from('whatsapp_channels')
        .select('*')
        .eq('unit_id', activeUnitId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as WhatsAppChannel[];
    },
    enabled: !!activeUnitId,
  });

  const upsertChannel = useMutation({
    mutationFn: async (channel: Partial<WhatsAppChannel> & { unit_id: string }) => {
      if (channel.id) {
        const { error } = await supabase
          .from('whatsapp_channels')
          .update(channel as any)
          .eq('id', channel.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('whatsapp_channels')
          .insert(channel as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-channels'] });
      toast({ title: 'Canal salvo com sucesso' });
    },
    onError: (err: any) => {
      toast({ title: 'Erro ao salvar canal', description: err.message, variant: 'destructive' });
    },
  });

  return { ...query, channels: query.data || [], upsertChannel };
}

// ============ CONVERSATIONS ============

export function useWhatsAppConversations(statusFilter?: string) {
  const { activeUnitId } = useUnit();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['whatsapp-conversations', activeUnitId, statusFilter],
    queryFn: async () => {
      if (!activeUnitId) return [];
      let q = supabase
        .from('whatsapp_conversations')
        .select('*, contact:whatsapp_contacts(*), channel:whatsapp_channels(*)')
        .eq('unit_id', activeUnitId)
        .order('created_at', { ascending: false });
      if (statusFilter && statusFilter !== 'all') {
        q = q.eq('status', statusFilter);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as WhatsAppConversation[];
    },
    enabled: !!activeUnitId,
  });

  // Realtime subscription
  useEffect(() => {
    if (!activeUnitId) return;
    const channel = supabase
      .channel('whatsapp-conversations-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'whatsapp_conversations',
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['whatsapp-conversations'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeUnitId, queryClient]);

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, assigned_to }: { id: string; status: string; assigned_to?: string | null }) => {
      const update: any = { status };
      if (assigned_to !== undefined) update.assigned_to = assigned_to;
      if (status === 'closed') update.closed_at = new Date().toISOString();
      const { error } = await supabase
        .from('whatsapp_conversations')
        .update(update)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-conversations'] });
    },
  });

  return { ...query, conversations: query.data || [], updateStatus };
}

// ============ MESSAGES ============

export function useWhatsAppMessages(conversationId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['whatsapp-messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as unknown as WhatsAppMessage[];
    },
    enabled: !!conversationId,
  });

  // Realtime
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`whatsapp-messages-${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'whatsapp_messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['whatsapp-messages', conversationId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversationId, queryClient]);

  return { ...query, messages: query.data || [] };
}

// ============ SEND MESSAGE (human) ============

export function useWhatsAppSend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: string; content: string }) => {
      const { data, error } = await supabase.functions.invoke('whatsapp-send', {
        body: { conversation_id: conversationId, content },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-messages', vars.conversationId] });
    },
    onError: (err: any) => {
      toast({ title: 'Erro ao enviar mensagem', description: err.message, variant: 'destructive' });
    },
  });
}

// ============ ORDERS ============

export function useWhatsAppOrders() {
  const { activeUnitId } = useUnit();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['whatsapp-orders', activeUnitId],
    queryFn: async () => {
      if (!activeUnitId) return [];
      const { data, error } = await supabase
        .from('whatsapp_orders')
        .select('*, contact:whatsapp_contacts(*)')
        .eq('unit_id', activeUnitId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as WhatsAppOrder[];
    },
    enabled: !!activeUnitId,
  });

  const updateOrderStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('whatsapp_orders')
        .update({ status } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-orders'] });
      toast({ title: 'Status do pedido atualizado' });
    },
  });

  return { ...query, orders: query.data || [], updateOrderStatus };
}

// ============ AI LOGS ============

export function useWhatsAppLogs(conversationId?: string) {
  const { activeUnitId } = useUnit();

  return useQuery({
    queryKey: ['whatsapp-logs', activeUnitId, conversationId],
    queryFn: async () => {
      let q = supabase
        .from('whatsapp_ai_logs')
        .select('*, conversation:whatsapp_conversations(unit_id)')
        .order('created_at', { ascending: false })
        .limit(200);
      if (conversationId) {
        q = q.eq('conversation_id', conversationId);
      }
      const { data, error } = await q;
      if (error) throw error;
      // Filter by unit on client side since ai_logs doesn't have unit_id directly
      if (activeUnitId && !conversationId) {
        return (data as any[]).filter(l => l.conversation?.unit_id === activeUnitId) as unknown as WhatsAppAILog[];
      }
      return data as unknown as WhatsAppAILog[];
    },
    enabled: !!activeUnitId,
  });
}
