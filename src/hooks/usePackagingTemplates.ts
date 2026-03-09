import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { toast } from 'sonner';

export interface PackagingTemplate {
  id: string;
  user_id: string;
  unit_id: string | null;
  name: string;
  created_at: string;
  updated_at: string;
  items: PackagingTemplateItem[];
  total_cost: number;
}

export interface PackagingTemplateItem {
  id: string;
  template_id: string;
  name: string;
  cost: number;
  quantity: number;
  sort_order: number;
}

export function usePackagingTemplates() {
  const { user } = useAuth();
  const { activeUnitId } = useUnit();
  const queryClient = useQueryClient();

  const queryKey = ['packaging-templates', user?.id, activeUnitId];

  const { data: templates = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from('packaging_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (activeUnitId) {
        query = query.eq('unit_id', activeUnitId);
      }

      const { data: tpls, error } = await query;
      if (error) throw error;
      if (!tpls?.length) return [];

      const tplIds = tpls.map(t => t.id);
      const { data: items, error: itemsError } = await supabase
        .from('packaging_template_items')
        .select('*')
        .in('template_id', tplIds)
        .order('sort_order');

      if (itemsError) throw itemsError;

      return tpls.map(t => {
        const tplItems = (items || []).filter(i => i.template_id === t.id) as PackagingTemplateItem[];
        const total_cost = tplItems.reduce((sum, i) => sum + i.cost * i.quantity, 0);
        return { ...t, items: tplItems, total_cost } as PackagingTemplate;
      });
    },
    enabled: !!user?.id,
  });

  const createTemplate = useMutation({
    mutationFn: async (data: { name: string; items: { name: string; cost: number; quantity: number }[] }) => {
      if (!user?.id) throw new Error('Not logged in');

      const { data: tpl, error } = await supabase
        .from('packaging_templates')
        .insert({ user_id: user.id, unit_id: activeUnitId, name: data.name })
        .select()
        .single();

      if (error) throw error;

      if (data.items.length > 0) {
        const { error: itemsError } = await supabase
          .from('packaging_template_items')
          .insert(data.items.map((item, idx) => ({
            template_id: tpl.id,
            name: item.name,
            cost: item.cost,
            quantity: item.quantity,
            sort_order: idx,
          })));
        if (itemsError) throw itemsError;
      }

      return tpl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Template de embalagem criado!');
    },
    onError: () => toast.error('Erro ao criar template'),
  });

  const updateTemplate = useMutation({
    mutationFn: async (data: { id: string; name: string; items: { id?: string; name: string; cost: number; quantity: number }[] }) => {
      const { error } = await supabase
        .from('packaging_templates')
        .update({ name: data.name, updated_at: new Date().toISOString() })
        .eq('id', data.id);
      if (error) throw error;

      // Delete existing items and re-insert
      await supabase.from('packaging_template_items').delete().eq('template_id', data.id);

      if (data.items.length > 0) {
        const { error: itemsError } = await supabase
          .from('packaging_template_items')
          .insert(data.items.map((item, idx) => ({
            template_id: data.id,
            name: item.name,
            cost: item.cost,
            quantity: item.quantity,
            sort_order: idx,
          })));
        if (itemsError) throw itemsError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Template atualizado!');
    },
    onError: () => toast.error('Erro ao atualizar template'),
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('packaging_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Template removido!');
    },
    onError: () => toast.error('Erro ao remover template'),
  });

  const getTemplateCost = (templateId: string | null): number => {
    if (!templateId) return 0;
    const tpl = templates.find(t => t.id === templateId);
    return tpl?.total_cost || 0;
  };

  return {
    templates,
    isLoading,
    createTemplate: createTemplate.mutate,
    updateTemplate: updateTemplate.mutate,
    deleteTemplate: deleteTemplate.mutate,
    isCreating: createTemplate.isPending,
    isUpdating: updateTemplate.isPending,
    getTemplateCost,
  };
}
