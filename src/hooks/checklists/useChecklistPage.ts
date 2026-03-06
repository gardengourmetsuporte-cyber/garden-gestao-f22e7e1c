import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { format, subDays } from 'date-fns';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useChecklists } from '@/hooks/useChecklists';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { ChecklistType } from '@/types/database';
import { useFabAction } from '@/contexts/FabActionContext';
import { toast } from 'sonner';
import { getDeadlineInfo, shouldAutoClose } from '@/lib/checklistTiming';
import { useChecklistDeadlines } from '@/hooks/useChecklistDeadlines';
import { useChecklistTimer, ItemTimeStats } from '@/hooks/checklists/useChecklistTimer';

export function useChecklistPage() {
  const { isAdmin, user } = useAuth();
  const {
    sectors, completions, completionsFetched, isLoading,
    addSector, updateSector, deleteSector, reorderSectors,
    addSubcategory, updateSubcategory, deleteSubcategory, reorderSubcategories,
    addItem, updateItem, deleteItem, reorderItems,
    toggleCompletion, contestCompletion, splitCompletion, isItemCompleted, getCompletionProgress,
    fetchCompletions,
  } = useChecklists();

  const queryClient = useQueryClient();
  const { activeUnitId } = useUnit();
  const { settings: deadlineSettings, updateDeadline, removeDeadline, isSaving: isSavingDeadline } = useChecklistDeadlines();
  const [settingsMode, setSettingsMode] = useState(false);
  const [checklistType, setChecklistType] = useState<ChecklistType>('abertura');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const currentDate = format(selectedDate, 'yyyy-MM-dd');

  // Timer mode
  const {
    isTimerMode, timerSettings, activeTimers,
    validatePin, startTimer, finishTimer, cancelTimer, getActiveTimer, getUserActiveTimer, getTimeStats,
  } = useChecklistTimer(checklistType, currentDate);

  const [timeStatsMap, setTimeStatsMap] = useState<Map<string, ItemTimeStats>>(new Map());

  // Fetch time stats when timer mode is active
  useEffect(() => {
    if (!isTimerMode || sectors.length === 0) return;
    const itemIds: string[] = [];
    sectors.forEach((s: any) => {
      s.subcategories?.forEach((sub: any) => {
        sub.items?.forEach((item: any) => {
          if (item.is_active && item.checklist_type === checklistType) itemIds.push(item.id);
        });
      });
    });
    if (itemIds.length === 0) return;
    getTimeStats(itemIds).then(stats => {
      const map = new Map<string, ItemTimeStats>();
      stats.forEach(s => map.set(s.itemId, s));
      setTimeStatsMap(map);
    });
  }, [isTimerMode, sectors, checklistType, getTimeStats]);

  const settingsType = checklistType;
  const setSettingsType = setChecklistType;

  useFabAction(isAdmin ? { icon: settingsMode ? 'X' : 'Settings', label: settingsMode ? 'Voltar' : 'Configurar', onClick: () => setSettingsMode(!settingsMode) } : null, [isAdmin, settingsMode]);

  // Fetch completions for abertura & fechamento to show progress on cards
  const { data: aberturaCompletions = [] } = useQuery({
    queryKey: ['card-completions', currentDate, 'abertura', activeUnitId],
    queryFn: async () => {
      let q = supabase.from('checklist_completions').select('item_id').eq('date', currentDate).eq('checklist_type', 'abertura');
      if (activeUnitId) q = q.or(`unit_id.eq.${activeUnitId},unit_id.is.null`);
      const { data } = await q;
      return data || [];
    },
    enabled: !!user && !!activeUnitId,
    staleTime: 30_000,
  });

  const { data: fechamentoCompletions = [] } = useQuery({
    queryKey: ['card-completions', currentDate, 'fechamento', activeUnitId],
    queryFn: async () => {
      let q = supabase.from('checklist_completions').select('item_id').eq('date', currentDate).eq('checklist_type', 'fechamento');
      if (activeUnitId) q = q.or(`unit_id.eq.${activeUnitId},unit_id.is.null`);
      const { data } = await q;
      return data || [];
    },
    enabled: !!user && !!activeUnitId,
    staleTime: 30_000,
  });

  // Compute progress per type
  const getTypeProgress = useMemo(() => {
    const calc = (type: ChecklistType, completionsList: { item_id: string }[]) => {
      let total = 0;
      const completedIds = new Set(completionsList.map(c => c.item_id));
      const validIds: string[] = [];
      sectors.forEach((s: any) => {
        s.subcategories?.forEach((sub: any) => {
          sub.items?.forEach((item: any) => {
            if (item.is_active && item.checklist_type === type) {
              total++;
              if (completedIds.has(item.id)) validIds.push(item.id);
            }
          });
        });
      });
      const completed = validIds.length;
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
      return { completed, total, percent };
    };
    return {
      abertura: calc('abertura', aberturaCompletions),
      fechamento: calc('fechamento', fechamentoCompletions),
    };
  }, [sectors, aberturaCompletions, fechamentoCompletions]);

  // Deadline logic
  const [deadlineLabel, setDeadlineLabel] = useState<Record<string, string>>({});

  useEffect(() => {
    const update = () => {
      const ab = getDeadlineInfo(currentDate, 'abertura', deadlineSettings);
      const fe = getDeadlineInfo(currentDate, 'fechamento', deadlineSettings);
      const bo = getDeadlineInfo(currentDate, 'bonus', deadlineSettings);
      const nextLabels = { abertura: ab?.label || '', fechamento: fe?.label || '', bonus: bo?.label || '' };
      setDeadlineLabel((prev) => {
        if (prev.abertura === nextLabels.abertura && prev.fechamento === nextLabels.fechamento && prev.bonus === nextLabels.bonus) return prev;
        return nextLabels;
      });
    };
    update();
    const iv = setInterval(update, 30_000);
    return () => clearInterval(iv);
  }, [currentDate, deadlineSettings]);

  const [deadlinePassed, setDeadlinePassed] = useState(() => {
    const info = getDeadlineInfo(currentDate, checklistType, deadlineSettings);
    return info?.passed ?? false;
  });

  useEffect(() => {
    const update = () => {
      const info = getDeadlineInfo(currentDate, checklistType, deadlineSettings);
      setDeadlinePassed(info?.passed ?? false);
    };
    update();
    const iv = setInterval(update, 30_000);
    return () => clearInterval(iv);
  }, [currentDate, checklistType, deadlineSettings]);

  // Auto-close
  const autoClosedRef = useRef<string>('');

  useEffect(() => {
    fetchCompletions(currentDate, checklistType);
  }, [currentDate, checklistType, fetchCompletions]);

  useEffect(() => {
    const key = `${currentDate}|${checklistType}`;
    if (autoClosedRef.current === key) return;
    if (!deadlinePassed || !user?.id || !activeUnitId) return;
    if (sectors.length === 0 || !completionsFetched) return;
    if (!isAdmin) { autoClosedRef.current = key; return; }
    if (!shouldAutoClose(currentDate, checklistType, deadlineSettings)) { autoClosedRef.current = key; return; }

    const activeItemIds: string[] = [];
    sectors.forEach((s: any) => {
      if (checklistType === 'bonus' ? s.scope === 'bonus' : s.scope !== 'bonus') {
        s.subcategories?.forEach((sub: any) => {
          sub.items?.forEach((item: any) => {
            if (item.is_active && item.checklist_type === checklistType) activeItemIds.push(item.id);
          });
        });
      }
    });

    const completedIds = new Set(completions.map(c => c.item_id));
    const pendingIds = activeItemIds.filter(id => !completedIds.has(id));
    if (pendingIds.length === 0) { autoClosedRef.current = key; return; }
    autoClosedRef.current = key;

    (async () => {
      let q = supabase.from('checklist_completions').select('item_id').eq('date', currentDate).eq('checklist_type', checklistType);
      if (activeUnitId) q = q.or(`unit_id.eq.${activeUnitId},unit_id.is.null`);
      const { data: freshCompletions } = await q;
      const freshIds = new Set((freshCompletions || []).map((c: any) => c.item_id));
      const realPending = pendingIds.filter(id => !freshIds.has(id));
      if (realPending.length === 0) return;

      const rows = realPending.map(itemId => ({
        item_id: itemId, checklist_type: checklistType, completed_by: user!.id,
        date: currentDate, awarded_points: false, points_awarded: 0, is_skipped: true, unit_id: activeUnitId,
      }));

      const { error } = await supabase.from('checklist_completions').upsert(rows, { onConflict: 'item_id,completed_by,date,checklist_type' });
      if (error) { console.error('Auto-close error:', error); return; }
      fetchCompletions(currentDate, checklistType);
      queryClient.invalidateQueries({ queryKey: ['card-completions', currentDate, checklistType, activeUnitId] });
    })();
  }, [deadlinePassed, currentDate, checklistType, sectors, completions, completionsFetched, user?.id, isAdmin, activeUnitId, fetchCompletions, queryClient, deadlineSettings]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('checklist-completions-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checklist_completions' }, () => {
        queryClient.invalidateQueries({ queryKey: ['card-completions', currentDate, 'abertura', activeUnitId] });
        queryClient.invalidateQueries({ queryKey: ['card-completions', currentDate, 'fechamento', activeUnitId] });
        fetchCompletions(currentDate, checklistType);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentDate, activeUnitId, checklistType, queryClient, fetchCompletions]);

  // Handlers
  const handleToggleItem = useCallback(async (itemId: string, points: number = 1, completedByUserId?: string, isSkipped?: boolean, photoUrl?: string, preserveTimerOnUncheck?: boolean, bypassGrace?: boolean) => {
    try {
      await toggleCompletion(itemId, checklistType, currentDate, isAdmin, points, completedByUserId, isSkipped, photoUrl, preserveTimerOnUncheck, bypassGrace);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao marcar item');
    }
  }, [toggleCompletion, checklistType, currentDate, isAdmin]);

  const handleAddSector = useCallback(async (data: { name: string; color: string }) => {
    const scope = settingsType === 'bonus' ? 'bonus' : 'standard';
    try {
      const newSector = await addSector({ ...data, scope });
      if (scope === 'bonus' && newSector?.id) await addSubcategory({ sector_id: newSector.id, name: 'Geral' });
    } catch { toast.error('Erro ao criar setor'); }
  }, [settingsType, addSector, addSubcategory]);

  const handleUpdateSector = useCallback(async (id: string, data: { name?: string; color?: string }) => {
    try { await updateSector(id, data); } catch { toast.error('Erro ao atualizar setor'); }
  }, [updateSector]);

  const handleDeleteSector = useCallback(async (id: string) => {
    try { await deleteSector(id); } catch { toast.error('Erro ao excluir setor'); }
  }, [deleteSector]);

  const handleAddSubcategory = useCallback(async (data: { sector_id: string; name: string }) => {
    try { await addSubcategory(data); } catch { toast.error('Erro ao criar subcategoria'); }
  }, [addSubcategory]);

  const handleUpdateSubcategory = useCallback(async (id: string, data: { name?: string }) => {
    try { await updateSubcategory(id, data); } catch { toast.error('Erro ao atualizar subcategoria'); }
  }, [updateSubcategory]);

  const handleDeleteSubcategory = useCallback(async (id: string) => {
    try { await deleteSubcategory(id); } catch { toast.error('Erro ao excluir subcategoria'); }
  }, [deleteSubcategory]);

  const handleAddItem = useCallback(async (data: { subcategory_id: string; name: string; description?: string; frequency?: 'daily' | 'weekly' | 'monthly'; checklist_type?: ChecklistType; points?: number }) => {
    try { await addItem(data); } catch (err: any) { console.error('addItem error:', err); toast.error(err?.message || 'Erro ao criar item'); }
  }, [addItem]);

  const handleUpdateItem = useCallback(async (id: string, data: { name?: string; description?: string; is_active?: boolean; frequency?: 'daily' | 'weekly' | 'monthly'; checklist_type?: ChecklistType; points?: number }) => {
    try { await updateItem(id, data); } catch { toast.error('Erro ao atualizar item'); }
  }, [updateItem]);

  const handleDeleteItem = useCallback(async (id: string) => {
    try { await deleteItem(id); } catch { toast.error('Erro ao excluir item'); }
  }, [deleteItem]);

  const [closingType, setClosingType] = useState<ChecklistType | null>(null);
  const [sendingReminder, setSendingReminder] = useState(false);

  const handleSendReminder = useCallback(async () => {
    if (!user?.id || !activeUnitId) return;
    setSendingReminder(true);
    try {
      const { data: unitUsers } = await supabase.from('user_units').select('user_id').eq('unit_id', activeUnitId).neq('user_id', user.id);
      if (!unitUsers || unitUsers.length === 0) { toast.info('Nenhum funcionário encontrado na unidade'); return; }
      const typeLabel = checklistType === 'abertura' ? 'Abertura' : checklistType === 'fechamento' ? 'Fechamento' : 'Bônus';
      const progress = checklistType === 'abertura' ? getTypeProgress.abertura : getTypeProgress.fechamento;
      const pending = progress.total - progress.completed;
      const rows = unitUsers.map((u: any) => ({
        user_id: u.user_id, type: 'alert' as const,
        title: `⏰ Finalize o Checklist de ${typeLabel}!`,
        description: `Faltam ${pending} tarefa(s) e o prazo está acabando. Corra para completar!`,
        origin: 'checklist' as const, read: false,
      }));
      const { error } = await supabase.from('notifications').insert(rows as any);
      if (error) throw error;
      toast.success(`Lembrete enviado para ${unitUsers.length} funcionário(s)!`);
    } catch (err) {
      console.error('Reminder error:', err);
      toast.error('Erro ao enviar lembrete');
    } finally { setSendingReminder(false); }
  }, [user?.id, activeUnitId, checklistType, getTypeProgress]);

  const handleManualClose = useCallback(async (type: ChecklistType) => {
    if (!user?.id || !activeUnitId) return;
    setClosingType(type);
    try {
      const activeItemIds: string[] = [];
      sectors.forEach((s: any) => {
        if (type === 'bonus' ? s.scope === 'bonus' : s.scope !== 'bonus') {
          s.subcategories?.forEach((sub: any) => {
            sub.items?.forEach((item: any) => {
              if (item.is_active && item.checklist_type === type) activeItemIds.push(item.id);
            });
          });
        }
      });
      let q = supabase.from('checklist_completions').select('item_id').eq('date', currentDate).eq('checklist_type', type);
      if (activeUnitId) q = q.or(`unit_id.eq.${activeUnitId},unit_id.is.null`);
      const { data: fresh } = await q;
      const doneIds = new Set((fresh || []).map((c: any) => c.item_id));
      const pending = activeItemIds.filter(id => !doneIds.has(id));
      if (pending.length === 0) { toast.info('Todas as tarefas já estão concluídas!'); return; }
      const rows = pending.map(itemId => ({
        item_id: itemId, checklist_type: type, completed_by: user!.id,
        date: currentDate, awarded_points: false, points_awarded: 0, is_skipped: true, unit_id: activeUnitId,
      }));
      const { error } = await supabase.from('checklist_completions').upsert(rows, { onConflict: 'item_id,completed_by,date,checklist_type' });
      if (error) throw error;
      fetchCompletions(currentDate, checklistType);
      queryClient.invalidateQueries({ queryKey: ['card-completions', currentDate, type, activeUnitId] });
      toast.success(`${type === 'abertura' ? 'Abertura' : 'Fechamento'} encerrado — ${pending.length} tarefa(s) marcada(s) como não concluída(s)`);
    } catch (err: any) {
      console.error('Manual close error:', err);
      toast.error('Erro ao encerrar checklist');
    } finally { setClosingType(null); }
  }, [user?.id, activeUnitId, sectors, currentDate, checklistType, fetchCompletions, queryClient]);

  return {
    // State
    isAdmin, user, sectors, completions, completionsFetched, isLoading,
    settingsMode, setSettingsMode, checklistType, setChecklistType,
    selectedDate, setSelectedDate, currentDate,
    settingsType, setSettingsType,
    deadlineSettings, updateDeadline, removeDeadline, isSavingDeadline,
    deadlineLabel, deadlinePassed,
    closingType, sendingReminder,
    getTypeProgress,
    // Timer
    isTimerMode, timerSettings, timeStatsMap,
    getActiveTimer, getUserActiveTimer, startTimer, finishTimer, cancelTimer, validatePin,
    // Handlers
    handleToggleItem, handleAddSector, handleUpdateSector, handleDeleteSector,
    handleAddSubcategory, handleUpdateSubcategory, handleDeleteSubcategory,
    handleAddItem, handleUpdateItem, handleDeleteItem,
    handleSendReminder, handleManualClose,
    // Checklist ops
    reorderSectors, reorderSubcategories, reorderItems,
    isItemCompleted, getCompletionProgress, contestCompletion, splitCompletion,
  };
}
