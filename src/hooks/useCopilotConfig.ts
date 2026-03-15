import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { toast } from 'sonner';

export interface CopilotAgentConfig {
  id: string;
  unit_id: string;
  agent_name: string;
  system_prompt: string | null;
  tone_of_voice: string;
  enabled_tools: string[];
  created_at: string;
  updated_at: string;
}

export interface CopilotKnowledgeArticle {
  id: string;
  unit_id: string;
  title: string;
  content: string;
  category: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function useCopilotConfig() {
  const { activeUnitId } = useUnit();
  const qc = useQueryClient();

  const configQuery = useQuery({
    queryKey: ['copilot-agent-config', activeUnitId],
    queryFn: async () => {
      if (!activeUnitId) return null;
      const { data, error } = await supabase
        .from('copilot_agent_config' as any)
        .select('*')
        .eq('unit_id', activeUnitId)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as CopilotAgentConfig | null;
    },
    enabled: !!activeUnitId,
  });

  const upsertConfig = useMutation({
    mutationFn: async (config: Partial<CopilotAgentConfig>) => {
      if (!activeUnitId) throw new Error('No unit');
      const payload = { ...config, unit_id: activeUnitId, updated_at: new Date().toISOString() };
      
      if (configQuery.data?.id) {
        const { error } = await supabase
          .from('copilot_agent_config' as any)
          .update(payload)
          .eq('id', configQuery.data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('copilot_agent_config' as any)
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['copilot-agent-config', activeUnitId] });
      toast.success('Configuração salva!');
    },
  });

  return {
    config: configQuery.data,
    isLoading: configQuery.isLoading,
    upsertConfig,
  };
}

export function useCopilotKnowledge() {
  const { activeUnitId } = useUnit();
  const qc = useQueryClient();

  const articlesQuery = useQuery({
    queryKey: ['copilot-knowledge', activeUnitId],
    queryFn: async () => {
      if (!activeUnitId) return [];
      const { data, error } = await supabase
        .from('copilot_knowledge' as any)
        .select('*')
        .eq('unit_id', activeUnitId)
        .order('sort_order');
      if (error) throw error;
      return (data || []) as unknown as CopilotKnowledgeArticle[];
    },
    enabled: !!activeUnitId,
  });

  const upsertArticle = useMutation({
    mutationFn: async (article: Partial<CopilotKnowledgeArticle>) => {
      if (!activeUnitId) throw new Error('No unit');
      const payload = { ...article, unit_id: activeUnitId, updated_at: new Date().toISOString() };
      
      if (article.id) {
        const { error } = await supabase
          .from('copilot_knowledge' as any)
          .update(payload)
          .eq('id', article.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('copilot_knowledge' as any)
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['copilot-knowledge', activeUnitId] });
      toast.success('Artigo salvo!');
    },
  });

  const deleteArticle = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('copilot_knowledge' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['copilot-knowledge', activeUnitId] });
      toast.success('Artigo excluído!');
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('copilot_knowledge' as any)
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['copilot-knowledge', activeUnitId] });
    },
  });

  return {
    articles: articlesQuery.data || [],
    isLoading: articlesQuery.isLoading,
    upsertArticle,
    deleteArticle,
    toggleActive,
  };
}
