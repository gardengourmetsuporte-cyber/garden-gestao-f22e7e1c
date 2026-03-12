import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import type { WhatsAppAILog } from '@/types/whatsapp';

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
      if (activeUnitId && !conversationId) {
        return (data as any[]).filter(l => l.conversation?.unit_id === activeUnitId) as unknown as WhatsAppAILog[];
      }
      return data as unknown as WhatsAppAILog[];
    },
    enabled: !!activeUnitId,
  });
}
