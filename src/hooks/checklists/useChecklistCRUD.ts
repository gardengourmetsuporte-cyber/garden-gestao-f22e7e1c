import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  ChecklistSector,
  ChecklistSubcategory,
  ChecklistItem,
  ChecklistType,
} from '@/types/database';
import { useQueryClient } from '@tanstack/react-query';

interface UseChecklistCRUDOptions {
  sectors: ChecklistSector[];
  sectorsKey: readonly string[];
  activeUnitId: string | null;
  invalidateSectors: () => void;
}

export function useChecklistCRUD({ sectors, sectorsKey, activeUnitId, invalidateSectors }: UseChecklistCRUDOptions) {
  const queryClient = useQueryClient();

  // ---- Sector CRUD ----
  const addSector = useCallback(async (sector: { name: string; color: string; icon?: string; scope?: string }) => {
    const maxOrder = sectors.reduce((max, s) => Math.max(max, s.sort_order), 0);
    const { scope, ...rest } = sector;
    const { data, error } = await supabase
      .from('checklist_sectors')
      .insert({ ...rest, sort_order: maxOrder + 1, unit_id: activeUnitId, scope: scope || 'standard' } as any)
      .select().single();
    if (error) throw error;
    invalidateSectors();
    return { ...data, subcategories: [] } as ChecklistSector;
  }, [sectors, invalidateSectors, activeUnitId]);

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
      .insert({ ...subcategory, sort_order: maxOrder + 1, unit_id: activeUnitId })
      .select().single();
    if (error) throw error;
    invalidateSectors();
    return data as ChecklistSubcategory;
  }, [sectors, invalidateSectors, activeUnitId]);

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
    requires_photo?: boolean;
  }) => {
    const { data, error } = await supabase
      .from('checklist_items')
      .insert({
        subcategory_id: item.subcategory_id, name: item.name,
        description: item.description, frequency: item.frequency || 'daily',
        checklist_type: item.checklist_type || 'abertura', points: item.points ?? 1,
        requires_photo: item.requires_photo ?? false,
        unit_id: activeUnitId,
      } as any)
      .select().single();
    if (error) throw error;
    invalidateSectors();
    return data as ChecklistItem;
  }, [invalidateSectors, activeUnitId]);

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
    queryClient.setQueryData<ChecklistSector[]>(sectorsKey as string[], (old) => {
      if (!old) return old;
      const map = new Map(old.map(s => [s.id, s]));
      return orderedIds
        .map(id => map.get(id))
        .filter((s): s is ChecklistSector => !!s)
        .map((s, i) => ({ ...s, sort_order: i }));
    });
    await supabase.rpc('batch_reorder_checklist_sectors', {
      p_ids: orderedIds,
      p_orders: orderedIds.map((_, i) => i),
    });
  }, [queryClient, sectorsKey]);

  const reorderSubcategories = useCallback(async (sectorId: string, orderedIds: string[]) => {
    queryClient.setQueryData<ChecklistSector[]>(sectorsKey as string[], (old) => {
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
    await supabase.rpc('batch_reorder_checklist_subcategories', {
      p_ids: orderedIds,
      p_orders: orderedIds.map((_, i) => i),
    });
  }, [queryClient, sectorsKey]);

  const reorderItems = useCallback(async (subcategoryId: string, orderedIds: string[]) => {
    queryClient.setQueryData<ChecklistSector[]>(sectorsKey as string[], (old) => {
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
    await supabase.rpc('batch_reorder_checklist_items', {
      p_ids: orderedIds,
      p_orders: orderedIds.map((_, i) => i),
    });
  }, [queryClient, sectorsKey]);

  return {
    addSector, updateSector, deleteSector, reorderSectors,
    addSubcategory, updateSubcategory, deleteSubcategory, reorderSubcategories,
    addItem, updateItem, deleteItem, restoreItem, permanentDeleteItem,
    fetchDeletedItems, emptyTrash, reorderItems,
  };
}
