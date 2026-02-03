import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  ChecklistSector, 
  ChecklistSubcategory, 
  ChecklistItem, 
  ChecklistCompletion,
  ChecklistType 
} from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';

export function useChecklists() {
  const { user } = useAuth();
  const [sectors, setSectors] = useState<ChecklistSector[]>([]);
  const [completions, setCompletions] = useState<ChecklistCompletion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSectors = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('checklist_sectors')
        .select(`
          *,
          subcategories:checklist_subcategories(
            *,
            items:checklist_items(*)
          )
        `)
        .order('sort_order')
        .order('sort_order', { referencedTable: 'checklist_subcategories' })
        .order('sort_order', { referencedTable: 'checklist_subcategories.checklist_items' });

      if (error) throw error;
      
      // Filter out soft-deleted items from the result
      const filteredData = (data || []).map(sector => ({
        ...sector,
        subcategories: (sector.subcategories || []).map(sub => ({
          ...sub,
          items: (sub.items || []).filter((item: any) => item.deleted_at === null)
        }))
      }));
      
      setSectors(filteredData as ChecklistSector[]);
    } catch (error) {
      // Silent fail - sectors will be empty
    }
  }, []);

  const fetchCompletions = useCallback(async (date: string, type: ChecklistType) => {
    try {
      // First fetch completions
      const { data: completionsData, error: completionsError } = await supabase
        .from('checklist_completions')
        .select('*')
        .eq('date', date)
        .eq('checklist_type', type);

      if (completionsError) throw completionsError;
      
      // Then fetch profiles for each completion
      const completionsWithProfiles = await Promise.all(
        (completionsData || []).map(async (completion) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', completion.completed_by)
            .single();
          
          return {
            ...completion,
            profile: profileData ? { full_name: profileData.full_name } : undefined
          } as ChecklistCompletion;
        })
      );
      
      setCompletions(completionsWithProfiles);
    } catch (error) {
      // Silent fail - completions will be empty
    }
  }, []);

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      fetchSectors().finally(() => setIsLoading(false));
    }
  }, [user, fetchSectors]);

  // Sector management
  const addSector = useCallback(async (sector: {
    name: string;
    color: string;
    icon?: string;
  }) => {
    const maxOrder = sectors.reduce((max, s) => Math.max(max, s.sort_order), 0);
    const { data, error } = await supabase
      .from('checklist_sectors')
      .insert({ ...sector, sort_order: maxOrder + 1 })
      .select()
      .single();

    if (error) throw error;
    setSectors(prev => [...prev, { ...data, subcategories: [] } as ChecklistSector]);
    return data as ChecklistSector;
  }, [sectors]);

  const updateSector = useCallback(async (id: string, updates: Partial<ChecklistSector>) => {
    const { subcategories, ...updateData } = updates;
    const { data, error } = await supabase
      .from('checklist_sectors')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    setSectors(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
    return data as ChecklistSector;
  }, []);

  const deleteSector = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('checklist_sectors')
      .delete()
      .eq('id', id);

    if (error) throw error;
    setSectors(prev => prev.filter(s => s.id !== id));
  }, []);

  // Subcategory management
  const addSubcategory = useCallback(async (subcategory: {
    sector_id: string;
    name: string;
  }) => {
    const sector = sectors.find(s => s.id === subcategory.sector_id);
    const maxOrder = sector?.subcategories?.reduce((max, s) => Math.max(max, s.sort_order), 0) || 0;
    
    const { data, error } = await supabase
      .from('checklist_subcategories')
      .insert({ ...subcategory, sort_order: maxOrder + 1 })
      .select()
      .single();

    if (error) throw error;
    
    setSectors(prev => prev.map(s => {
      if (s.id === subcategory.sector_id) {
        return {
          ...s,
          subcategories: [...(s.subcategories || []), { ...data, items: [] } as ChecklistSubcategory]
        };
      }
      return s;
    }));
    return data as ChecklistSubcategory;
  }, [sectors]);

  const updateSubcategory = useCallback(async (id: string, updates: Partial<ChecklistSubcategory>) => {
    const { items, sector, ...updateData } = updates;
    const { data, error } = await supabase
      .from('checklist_subcategories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    await fetchSectors();
    return data as ChecklistSubcategory;
  }, [fetchSectors]);

  const deleteSubcategory = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('checklist_subcategories')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await fetchSectors();
  }, [fetchSectors]);

  // Item management
  const addItem = useCallback(async (item: {
    subcategory_id: string;
    name: string;
    description?: string;
    frequency?: 'daily' | 'weekly' | 'monthly';
    checklist_type?: ChecklistType;
  }) => {
    const { data, error } = await supabase
      .from('checklist_items')
      .insert({
        subcategory_id: item.subcategory_id,
        name: item.name,
        description: item.description,
        frequency: item.frequency || 'daily',
        checklist_type: item.checklist_type || 'abertura',
      })
      .select()
      .single();

    if (error) throw error;
    await fetchSectors();
    return data as ChecklistItem;
  }, [fetchSectors]);

  const updateItem = useCallback(async (id: string, updates: Partial<ChecklistItem>) => {
    const { subcategory, ...updateData } = updates;
    const { data, error } = await supabase
      .from('checklist_items')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    await fetchSectors();
    return data as ChecklistItem;
  }, [fetchSectors]);

  // Soft delete - marca como deletado ao invés de remover permanentemente
  const deleteItem = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('checklist_items')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    await fetchSectors();
  }, [fetchSectors]);

  // Restaurar item da lixeira
  const restoreItem = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('checklist_items')
      .update({ deleted_at: null })
      .eq('id', id);

    if (error) throw error;
    await fetchSectors();
  }, [fetchSectors]);

  // Buscar itens na lixeira (últimos 30 dias)
  const fetchDeletedItems = useCallback(async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from('checklist_items')
      .select('*')
      .not('deleted_at', 'is', null)
      .gte('deleted_at', thirtyDaysAgo.toISOString())
      .order('deleted_at', { ascending: false });

    if (error) throw error;
    return (data || []) as ChecklistItem[];
  }, []);

  // Exclusão permanente de um item
  const permanentDeleteItem = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('checklist_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }, []);

  // Esvaziar lixeira (excluir todos os itens soft-deleted)
  const emptyTrash = useCallback(async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { error } = await supabase
      .from('checklist_items')
      .delete()
      .not('deleted_at', 'is', null)
      .gte('deleted_at', thirtyDaysAgo.toISOString());

    if (error) throw error;
  }, []);

  // Reorder functions - with optimistic UI update
  const reorderSectors = useCallback(async (orderedIds: string[]) => {
    // Optimistic update - reorder sectors in state immediately
    setSectors(prev => {
      const sectorMap = new Map(prev.map(s => [s.id, s]));
      return orderedIds
        .map(id => sectorMap.get(id))
        .filter((s): s is ChecklistSector => s !== undefined)
        .map((s, index) => ({ ...s, sort_order: index }));
    });

    // Persist to database in background
    const updates = orderedIds.map((id, index) => 
      supabase
        .from('checklist_sectors')
        .update({ sort_order: index })
        .eq('id', id)
    );
    
    await Promise.all(updates);
  }, []);

  const reorderSubcategories = useCallback(async (sectorId: string, orderedIds: string[]) => {
    // Optimistic update
    setSectors(prev => prev.map(sector => {
      if (sector.id !== sectorId) return sector;
      
      const subMap = new Map((sector.subcategories || []).map(s => [s.id, s]));
      const reorderedSubs = orderedIds
        .map(id => subMap.get(id))
        .filter((s): s is ChecklistSubcategory => s !== undefined)
        .map((s, index) => ({ ...s, sort_order: index }));
      
      return { ...sector, subcategories: reorderedSubs };
    }));

    // Persist to database
    const updates = orderedIds.map((id, index) => 
      supabase
        .from('checklist_subcategories')
        .update({ sort_order: index })
        .eq('id', id)
    );
    
    await Promise.all(updates);
  }, []);

  const reorderItems = useCallback(async (subcategoryId: string, orderedIds: string[]) => {
    // Optimistic update
    setSectors(prev => prev.map(sector => ({
      ...sector,
      subcategories: (sector.subcategories || []).map(sub => {
        if (sub.id !== subcategoryId) return sub;
        
        const itemMap = new Map((sub.items || []).map(i => [i.id, i]));
        const reorderedItems = orderedIds
          .map(id => itemMap.get(id))
          .filter((i): i is ChecklistItem => i !== undefined)
          .map((i, index) => ({ ...i, sort_order: index }));
        
        return { ...sub, items: reorderedItems };
      })
    })));

    // Persist to database
    const updates = orderedIds.map((id, index) => 
      supabase
        .from('checklist_items')
        .update({ sort_order: index })
        .eq('id', id)
    );
    
    await Promise.all(updates);
  }, []);

  // Completion management
  const toggleCompletion = useCallback(async (
    itemId: string,
    checklistType: ChecklistType,
    date: string,
    isAdmin?: boolean
  ) => {
    const existing = completions.find(
      c => c.item_id === itemId && c.checklist_type === checklistType && c.date === date
    );

    if (existing) {
      // Check permission before deleting: only admin or the user who completed can delete
      const canDelete = isAdmin || existing.completed_by === user?.id;
      if (!canDelete) {
        throw new Error('Apenas o administrador pode desmarcar tarefas de outros usuários');
      }

      // Remove completion
      const { error } = await supabase
        .from('checklist_completions')
        .delete()
        .eq('id', existing.id);

      if (error) throw error;
      setCompletions(prev => prev.filter(c => c.id !== existing.id));
    } else {
      // Add completion
      const { data, error } = await supabase
        .from('checklist_completions')
        .insert({
          item_id: itemId,
          checklist_type: checklistType,
          completed_by: user?.id,
          date,
        })
        .select()
        .single();

      if (error) throw error;
      setCompletions(prev => [...prev, data as ChecklistCompletion]);
    }
  }, [completions, user?.id]);

  const isItemCompleted = useCallback((itemId: string) => {
    return completions.some(c => c.item_id === itemId);
  }, [completions]);

  const getCompletionProgress = useCallback((sectorId: string, filterType?: ChecklistType) => {
    const sector = sectors.find(s => s.id === sectorId);
    if (!sector) return { completed: 0, total: 0 };

    let total = 0;
    let completed = 0;

    sector.subcategories?.forEach(sub => {
      sub.items?.forEach(item => {
        // Filter by checklist_type if provided
        const itemType = (item as any).checklist_type;
        if (item.is_active && (!filterType || itemType === filterType)) {
          total++;
          if (isItemCompleted(item.id)) completed++;
        }
      });
    });

    return { completed, total };
  }, [sectors, isItemCompleted]);

  return {
    sectors,
    completions,
    isLoading,
    // Sector operations
    addSector,
    updateSector,
    deleteSector,
    reorderSectors,
    // Subcategory operations
    addSubcategory,
    updateSubcategory,
    deleteSubcategory,
    reorderSubcategories,
    // Item operations
    addItem,
    updateItem,
    deleteItem,
    restoreItem,
    permanentDeleteItem,
    fetchDeletedItems,
    emptyTrash,
    reorderItems,
    // Completion operations
    toggleCompletion,
    isItemCompleted,
    getCompletionProgress,
    fetchCompletions,
    refetch: fetchSectors,
  };
}
