import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { toast } from '@/hooks/use-toast';
import type { WhatsAppChannel } from '@/types/whatsapp';

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
