import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { toast } from '@/hooks/use-toast';
import type { WhatsAppKnowledgeArticle } from '@/types/whatsapp';

export function useWhatsAppKnowledge() {
  const { activeUnitId } = useUnit();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['whatsapp-knowledge', activeUnitId],
    queryFn: async () => {
      if (!activeUnitId) return [];
      const { data, error } = await supabase
        .from('whatsapp_knowledge_base')
        .select('*')
        .eq('unit_id', activeUnitId)
        .order('sort_order')
        .order('created_at');
      if (error) throw error;
      return data as unknown as WhatsAppKnowledgeArticle[];
    },
    enabled: !!activeUnitId,
  });

  const upsertArticle = useMutation({
    mutationFn: async (article: Partial<WhatsAppKnowledgeArticle> & { unit_id: string }) => {
      if (article.id) {
        const { error } = await supabase
          .from('whatsapp_knowledge_base')
          .update(article as any)
          .eq('id', article.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('whatsapp_knowledge_base')
          .insert(article as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-knowledge'] });
      toast({ title: 'Artigo salvo com sucesso' });
    },
    onError: (err: any) => {
      toast({ title: 'Erro ao salvar artigo', description: err.message, variant: 'destructive' });
    },
  });

  const deleteArticle = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('whatsapp_knowledge_base')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-knowledge'] });
      toast({ title: 'Artigo removido' });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('whatsapp_knowledge_base')
        .update({ is_active } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-knowledge'] });
    },
  });

  return { ...query, articles: query.data || [], upsertArticle, deleteArticle, toggleActive };
}
