import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { useEffect } from 'react';
import type { WhatsAppConversation } from '@/types/whatsapp';

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
