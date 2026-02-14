import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  ChecklistSector, 
  ChecklistSubcategory, 
  ChecklistItem, 
  ChecklistCompletion,
  ChecklistType 
} from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ---- Fetch helpers ----

async function fetchSectorsData(unitId: string | null) {
  let query = supabase
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

  if (unitId) query = query.eq('unit_id', unitId);

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map(sector => ({
    ...sector,
    subcategories: (sector.subcategories || []).map((sub: any) => ({
      ...sub,
      items: (sub.items || []).filter((item: any) => item.deleted_at === null)
    }))
  })) as ChecklistSector[];
}

async function fetchCompletionsData(date: string, type: ChecklistType) {
  const { data: completionsData, error } = await supabase
    .from('checklist_completions')
    .select('*')
    .eq('date', date)
    .eq('checklist_type', type);

  if (error) throw error;

  // Batch profile fetch — single query for all unique user IDs
  const userIds = [...new Set((completionsData || []).map(c => c.completed_by))];
  const profileMap = new Map<string, { full_name: string }>();

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .in('user_id', userIds);
    (profiles || []).forEach(p => profileMap.set(p.user_id, { full_name: p.full_name }));
  }

  return (completionsData || []).map(c => ({
    ...c,
    awarded_points: c.awarded_points ?? true,
    profile: profileMap.get(c.completed_by),
  })) as unknown as ChecklistCompletion[];
}

// ---- Hook ----

export function useChecklists() {
  const { user } = useAuth();
  const { activeUnitId } = useUnit();
  const queryClient = useQueryClient();

  const sectorsKey = ['checklist-sectors', activeUnitId];

  const { data: sectors = [], isLoading } = useQuery({
    queryKey: sectorsKey,
    queryFn: () => fetchSectorsData(activeUnitId),
    enabled: !!user && !!activeUnitId,
  });

  // Completions are fetched on-demand via fetchCompletions, stored in a separate query
  const completionsKeyPrefix = ['checklist-completions'];

  const getCompletionsKey = useCallback((date: string, type: ChecklistType) => 
    [...completionsKeyPrefix, date, type], []);

  // We keep a "current" completions state via the last fetched query
  // The page component calls fetchCompletions(date, type) which triggers a query
  const fetchCompletions = useCallback(async (date: string, type: ChecklistType) => {
    const data = await queryClient.fetchQuery({
      queryKey: getCompletionsKey(date, type),
      queryFn: () => fetchCompletionsData(date, type),
    });
    return data;
  }, [queryClient, getCompletionsKey]);

  // Get current completions from cache (the last fetched ones)
  const completions = queryClient.getQueriesData<ChecklistCompletion[]>({ queryKey: completionsKeyPrefix })
    .flatMap(([, data]) => data || []);

  const invalidateSectors = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: sectorsKey });
  }, [queryClient, sectorsKey]);

  // ---- Sector CRUD ----
  const addSector = useCallback(async (sector: { name: string; color: string; icon?: string }) => {
    const maxOrder = sectors.reduce((max, s) => Math.max(max, s.sort_order), 0);
    const { data, error } = await supabase
      .from('checklist_sectors')
      .insert({ ...sector, sort_order: maxOrder + 1 })
      .select().single();
    if (error) throw error;
    invalidateSectors();
    return { ...data, subcategories: [] } as ChecklistSector;
  }, [sectors, invalidateSectors]);

  const updateSector = useCallback(async (id: string, updates: Partial<ChecklistSector>) => {
    const { subcategories, ...updateData } = updates;
    const { data, error } = await supabase
      .from('checklist_sectors').update(updateData).eq('id', id).select().single();
    if (error) throw error;
    invalidateSectors();
    return data as ChecklistSector;
  }, [invalidateSectors]);

  const deleteSector = useCallback(async (id: string) => {
    const { error } = await supabase.from('checklist_sectors').delete().eq('id', id);
    if (error) throw error;
    invalidateSectors();
  }, [invalidateSectors]);

  // ---- Subcategory CRUD ----
  const addSubcategory = useCallback(async (subcategory: { sector_id: string; name: string }) => {
    const sector = sectors.find(s => s.id === subcategory.sector_id);
    const maxOrder = sector?.subcategories?.reduce((max, s) => Math.max(max, s.sort_order), 0) || 0;
    const { data, error } = await supabase
      .from('checklist_subcategories')
      .insert({ ...subcategory, sort_order: maxOrder + 1 })
      .select().single();
    if (error) throw error;
    invalidateSectors();
    return data as ChecklistSubcategory;
  }, [sectors, invalidateSectors]);

  const updateSubcategory = useCallback(async (id: string, updates: Partial<ChecklistSubcategory>) => {
    const { items, sector, ...updateData } = updates;
    const { data, error } = await supabase
      .from('checklist_subcategories').update(updateData).eq('id', id).select().single();
    if (error) throw error;
    invalidateSectors();
    return data as ChecklistSubcategory;
  }, [invalidateSectors]);

  const deleteSubcategory = useCallback(async (id: string) => {
    const { error } = await supabase.from('checklist_subcategories').delete().eq('id', id);
    if (error) throw error;
    invalidateSectors();
  }, [invalidateSectors]);

  // ---- Item CRUD ----
  const addItem = useCallback(async (item: {
    subcategory_id: string; name: string; description?: string;
    frequency?: 'daily' | 'weekly' | 'monthly';
    checklist_type?: ChecklistType; points?: number;
  }) => {
    const { data, error } = await supabase
      .from('checklist_items')
      .insert({
        subcategory_id: item.subcategory_id, name: item.name,
        description: item.description, frequency: item.frequency || 'daily',
        checklist_type: item.checklist_type || 'abertura', points: item.points ?? 1,
      })
      .select().single();
    if (error) throw error;
    invalidateSectors();
    return data as ChecklistItem;
  }, [invalidateSectors]);

  const updateItem = useCallback(async (id: string, updates: Partial<ChecklistItem>) => {
    const { subcategory, ...updateData } = updates;
    const { data, error } = await supabase
      .from('checklist_items').update(updateData).eq('id', id).select().single();
    if (error) throw error;
    invalidateSectors();
    return data as ChecklistItem;
  }, [invalidateSectors]);

  const deleteItem = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('checklist_items').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
    invalidateSectors();
  }, [invalidateSectors]);

  const restoreItem = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('checklist_items').update({ deleted_at: null }).eq('id', id);
    if (error) throw error;
    invalidateSectors();
  }, [invalidateSectors]);

  const fetchDeletedItems = useCallback(async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { data, error } = await supabase
      .from('checklist_items').select('*')
      .not('deleted_at', 'is', null)
      .gte('deleted_at', thirtyDaysAgo.toISOString())
      .order('deleted_at', { ascending: false });
    if (error) throw error;
    return (data || []) as ChecklistItem[];
  }, []);

  const permanentDeleteItem = useCallback(async (id: string) => {
    const { error } = await supabase.from('checklist_items').delete().eq('id', id);
    if (error) throw error;
  }, []);

  const emptyTrash = useCallback(async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { error } = await supabase
      .from('checklist_items').delete()
      .not('deleted_at', 'is', null)
      .gte('deleted_at', thirtyDaysAgo.toISOString());
    if (error) throw error;
  }, []);

  // ---- Reorder (optimistic) ----
  const reorderSectors = useCallback(async (orderedIds: string[]) => {
    queryClient.setQueryData<ChecklistSector[]>(sectorsKey, (old) => {
      if (!old) return old;
      const map = new Map(old.map(s => [s.id, s]));
      return orderedIds
        .map(id => map.get(id))
        .filter((s): s is ChecklistSector => !!s)
        .map((s, i) => ({ ...s, sort_order: i }));
    });
    await Promise.all(orderedIds.map((id, i) =>
      supabase.from('checklist_sectors').update({ sort_order: i }).eq('id', id)
    ));
  }, [queryClient, sectorsKey]);

  const reorderSubcategories = useCallback(async (sectorId: string, orderedIds: string[]) => {
    queryClient.setQueryData<ChecklistSector[]>(sectorsKey, (old) => {
      if (!old) return old;
      return old.map(sector => {
        if (sector.id !== sectorId) return sector;
        const subMap = new Map((sector.subcategories || []).map(s => [s.id, s]));
        const reordered = orderedIds
          .map(id => subMap.get(id))
          .filter((s): s is ChecklistSubcategory => !!s)
          .map((s, i) => ({ ...s, sort_order: i }));
        return { ...sector, subcategories: reordered };
      });
    });
    await Promise.all(orderedIds.map((id, i) =>
      supabase.from('checklist_subcategories').update({ sort_order: i }).eq('id', id)
    ));
  }, [queryClient, sectorsKey]);

  const reorderItems = useCallback(async (subcategoryId: string, orderedIds: string[]) => {
    queryClient.setQueryData<ChecklistSector[]>(sectorsKey, (old) => {
      if (!old) return old;
      return old.map(sector => ({
        ...sector,
        subcategories: (sector.subcategories || []).map(sub => {
          if (sub.id !== subcategoryId) return sub;
          const itemMap = new Map((sub.items || []).map(i => [i.id, i]));
          const reordered = orderedIds
            .map(id => itemMap.get(id))
            .filter((i): i is ChecklistItem => !!i)
            .map((i, idx) => ({ ...i, sort_order: idx }));
          return { ...sub, items: reordered };
        })
      }));
    });
    await Promise.all(orderedIds.map((id, i) =>
      supabase.from('checklist_items').update({ sort_order: i }).eq('id', id)
    ));
  }, [queryClient, sectorsKey]);

  // ---- Completion toggle ----
  const toggleCompletion = useCallback(async (
    itemId: string, checklistType: ChecklistType, date: string,
    isAdmin?: boolean, points: number = 1, completedByUserId?: string
  ) => {
    const existing = completions.find(
      c => c.item_id === itemId && c.checklist_type === checklistType && c.date === date
    );

    if (existing) {
      const canDelete = isAdmin || existing.completed_by === user?.id;
      if (!canDelete) throw new Error('Apenas o administrador pode desmarcar tarefas de outros usuários');

      const { error } = await supabase.from('checklist_completions').delete().eq('id', existing.id);
      if (error) throw error;
    } else {
      const targetUserId = completedByUserId || user?.id;
      const { error } = await supabase
        .from('checklist_completions')
        .upsert({
          item_id: itemId, checklist_type: checklistType,
          completed_by: targetUserId, date,
          awarded_points: points > 0, points_awarded: points,
        }, { onConflict: 'item_id,completed_by,date,checklist_type' })
        .select().single();
      if (error) throw error;
    }

    // Invalidate the specific completions query
    queryClient.invalidateQueries({ queryKey: [...completionsKeyPrefix, date, checklistType] });
  }, [completions, user?.id, queryClient]);

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
    sectors, completions, isLoading,
    addSector, updateSector, deleteSector, reorderSectors,
    addSubcategory, updateSubcategory, deleteSubcategory, reorderSubcategories,
    addItem, updateItem, deleteItem, restoreItem, permanentDeleteItem,
    fetchDeletedItems, emptyTrash, reorderItems,
    toggleCompletion, isItemCompleted, getCompletionProgress,
    fetchCompletions,
    refetch: invalidateSectors,
  };
}
