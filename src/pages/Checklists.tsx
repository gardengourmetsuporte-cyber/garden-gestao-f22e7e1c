import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { format, parseISO, isAfter, startOfDay, addDays, subDays, isSameDay, isToday as isDateToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { useChecklists } from '@/hooks/useChecklists';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { ChecklistView } from '@/components/checklists/ChecklistView';
import { ChecklistSettings } from '@/components/checklists/ChecklistSettings';
import { ChecklistType } from '@/types/database';
import { AppIcon } from '@/components/ui/app-icon';
import { useFabAction } from '@/contexts/FabActionContext';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';



export default function ChecklistsPage() {
  const { isAdmin, user } = useAuth();
  const {
    sectors,
    completions,
    isLoading,
    addSector, updateSector, deleteSector, reorderSectors,
    addSubcategory, updateSubcategory, deleteSubcategory, reorderSubcategories,
    addItem, updateItem, deleteItem, reorderItems,
    toggleCompletion, contestCompletion, isItemCompleted, getCompletionProgress,
    fetchCompletions,
  } = useChecklists();

  const queryClient = useQueryClient();
  const { activeUnitId } = useUnit();
  const [settingsMode, setSettingsMode] = useState(false);
  const [checklistType, setChecklistType] = useState<ChecklistType>('abertura');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const currentDate = format(selectedDate, 'yyyy-MM-dd');

  // The settings type follows the checklist type
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

  // Compute progress per type from sectors
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
  // ── Deadline logic ──
  const isDeadlinePassed = useCallback((date: string, type: ChecklistType): boolean => {
    if (type === 'bonus') return false;
    const now = new Date();
    const checkDate = parseISO(date);

    if (type === 'abertura') {
      // Deadline: same day at 19:30
      const deadline = new Date(checkDate);
      deadline.setHours(19, 30, 0, 0);
      return isAfter(now, deadline);
    }

    if (type === 'fechamento') {
      // Deadline: next day at 02:00
      const nextDay = addDays(startOfDay(checkDate), 1);
      nextDay.setHours(2, 0, 0, 0);
      return isAfter(now, nextDay);
    }

    return false;
  }, []);

  const deadlinePassed = useMemo(() => isDeadlinePassed(currentDate, checklistType), [currentDate, checklistType, isDeadlinePassed]);

  // ── Auto-close: mark pending items as skipped after deadline ──
  const autoClosedRef = useRef<string>('');

  useEffect(() => {
    fetchCompletions(currentDate, checklistType);
  }, [currentDate, checklistType, fetchCompletions]);

  useEffect(() => {
    const key = `${currentDate}|${checklistType}`;
    if (autoClosedRef.current === key) return;
    if (!deadlinePassed || !user?.id || !activeUnitId) return;
    if (sectors.length === 0 || completions === undefined) return;

    // Gather all active item IDs for this type
    const activeItemIds: string[] = [];
    sectors.forEach((s: any) => {
      if (checklistType === 'bonus' ? s.scope === 'bonus' : s.scope !== 'bonus') {
        s.subcategories?.forEach((sub: any) => {
          sub.items?.forEach((item: any) => {
            if (item.is_active && item.checklist_type === checklistType) {
              activeItemIds.push(item.id);
            }
          });
        });
      }
    });

    const completedIds = new Set(completions.map(c => c.item_id));
    const pendingIds = activeItemIds.filter(id => !completedIds.has(id));

    if (pendingIds.length === 0) {
      autoClosedRef.current = key;
      return;
    }

    // Batch upsert skipped completions
    const rows = pendingIds.map(itemId => ({
      item_id: itemId,
      checklist_type: checklistType,
      completed_by: user.id,
      date: currentDate,
      awarded_points: false,
      points_awarded: 0,
      is_skipped: true,
      unit_id: activeUnitId,
    }));

    autoClosedRef.current = key;

    supabase
      .from('checklist_completions')
      .upsert(rows, { onConflict: 'item_id,completed_by,date,checklist_type' })
      .then(({ error }) => {
        if (error) {
          console.error('Auto-close error:', error);
          return;
        }
        fetchCompletions(currentDate, checklistType);
        queryClient.invalidateQueries({ queryKey: ['card-completions', currentDate, checklistType, activeUnitId] });
      });
  }, [deadlinePassed, currentDate, checklistType, sectors, completions, user?.id, activeUnitId, fetchCompletions, queryClient]);

  // Realtime: invalidate progress queries when completions change
  useEffect(() => {
    const channel = supabase
      .channel('checklist-completions-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'checklist_completions' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['card-completions', currentDate, 'abertura', activeUnitId] });
          queryClient.invalidateQueries({ queryKey: ['card-completions', currentDate, 'fechamento', activeUnitId] });
          fetchCompletions(currentDate, checklistType);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentDate, activeUnitId, checklistType, queryClient, fetchCompletions]);

  const handleToggleItem = async (itemId: string, points: number = 1, completedByUserId?: string, isSkipped?: boolean) => {
    try {
      await toggleCompletion(itemId, checklistType, currentDate, isAdmin, points, completedByUserId, isSkipped);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao marcar item');
    }
  };

  const handleAddSector = async (data: { name: string; color: string }) => {
    const scope = settingsType === 'bonus' ? 'bonus' : 'standard';
    try { 
      const newSector = await addSector({ ...data, scope });
      // Auto-create a default subcategory for bonus sectors
      if (scope === 'bonus' && newSector?.id) {
        await addSubcategory({ sector_id: newSector.id, name: 'Geral' });
      }
    } catch { toast.error('Erro ao criar setor'); }
  };
  const handleUpdateSector = async (id: string, data: { name?: string; color?: string }) => {
    try { await updateSector(id, data); } catch { toast.error('Erro ao atualizar setor'); }
  };
  const handleDeleteSector = async (id: string) => {
    try { await deleteSector(id); } catch { toast.error('Erro ao excluir setor'); }
  };
  const handleAddSubcategory = async (data: { sector_id: string; name: string }) => {
    try { await addSubcategory(data); } catch { toast.error('Erro ao criar subcategoria'); }
  };
  const handleUpdateSubcategory = async (id: string, data: { name?: string }) => {
    try { await updateSubcategory(id, data); } catch { toast.error('Erro ao atualizar subcategoria'); }
  };
  const handleDeleteSubcategory = async (id: string) => {
    try { await deleteSubcategory(id); } catch { toast.error('Erro ao excluir subcategoria'); }
  };
  const handleAddItem = async (data: { subcategory_id: string; name: string; description?: string; frequency?: 'daily' | 'weekly' | 'monthly'; checklist_type?: ChecklistType; points?: number }) => {
    try { await addItem(data); } catch (err: any) { console.error('addItem error:', err); toast.error(err?.message || 'Erro ao criar item'); }
  };
  const handleUpdateItem = async (id: string, data: { name?: string; description?: string; is_active?: boolean; frequency?: 'daily' | 'weekly' | 'monthly'; checklist_type?: ChecklistType; points?: number }) => {
    try { await updateItem(id, data); } catch { toast.error('Erro ao atualizar item'); }
  };
  const handleDeleteItem = async (id: string) => {
    try { await deleteItem(id); } catch { toast.error('Erro ao excluir item'); }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-background pb-24">
          <div className="px-4 py-4 space-y-4">
            <Skeleton className="h-12 rounded-xl" />
            <div className="grid grid-cols-2 gap-3">
              {[1,2].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
            </div>
            {[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-background pb-24">
        <div className="px-4 py-3 lg:px-6 space-y-5">
          <div className="animate-fade-in space-y-5" key={settingsMode ? 'settings' : 'view'}>
            {/* Scrollable Date Strip — only in view mode */}
            {!settingsMode && (() => {
              const today = new Date();
              const days = Array.from({ length: 30 }, (_, i) => subDays(today, 20 - i));

              const scrollToSelected = (container: HTMLDivElement | null) => {
                if (!container) return;
                const selectedIdx = days.findIndex(d => isSameDay(d, selectedDate));
                if (selectedIdx < 0) return;
                const btn = container.children[selectedIdx] as HTMLElement;
                if (!btn) return;
                const scrollLeft = btn.offsetLeft - container.offsetWidth / 2 + btn.offsetWidth / 2;
                container.scrollTo({ left: scrollLeft, behavior: 'instant' });
              };

              return (
                <div className="space-y-1.5">
                  <div
                    className="-mx-4 overflow-x-auto scrollbar-hide"
                    ref={scrollToSelected}
                  >
                    <div className="flex gap-1 px-4 py-1">
                      {days.map((day) => {
                        const isSelected = isSameDay(day, selectedDate);
                        const isDayToday = isDateToday(day);
                        return (
                          <button
                            key={day.toISOString()}
                            onClick={() => setSelectedDate(day)}
                            className={cn(
                              "flex flex-col items-center w-[44px] h-[56px] justify-center rounded-xl shrink-0 transition-colors",
                              isSelected
                                ? "bg-primary text-primary-foreground shadow-md"
                                : isDayToday
                                  ? "bg-primary/8 text-primary"
                                  : "text-muted-foreground hover:bg-secondary/60"
                            )}
                          >
                            <span className="text-[10px] font-medium uppercase leading-none mb-1">
                              {format(day, 'EEE', { locale: ptBR }).slice(0, 3)}
                            </span>
                            <span className={cn(
                              "text-base font-bold leading-none",
                              isSelected ? "text-primary-foreground" : isDayToday ? "text-primary" : "text-foreground"
                            )}>
                              {format(day, 'dd')}
                            </span>
                            {isDayToday && !isSelected && (
                              <div className="w-1 h-1 rounded-full bg-primary mt-1" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Minimal date label */}
                  <p className="text-center text-xs text-muted-foreground capitalize">
                    {isDateToday(selectedDate) ? '📍 ' : ''}{format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                  </p>
                </div>
              );
            })()}

            {/* Settings mode header banner */}
            {settingsMode && (
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-primary/5 border border-primary/20">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <AppIcon name="Settings" size={18} className="text-primary animate-spin" style={{ animationDuration: '3s' }} />
                </div>
                <div className="flex-1">
                  <h2 className="font-semibold text-sm text-foreground">Modo Configuração</h2>
                  <p className="text-[11px] text-muted-foreground">Editando {checklistType === 'bonus' ? 'Bônus' : checklistType === 'abertura' ? 'Abertura' : 'Fechamento'}</p>
                </div>
                <button
                  onClick={() => setSettingsMode(false)}
                  className="p-2 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <AppIcon name="X" size={16} className="text-muted-foreground" />
                </button>
              </div>
            )}

            {/* Checklist Type Cards — always visible */}
            <div className="grid grid-cols-2 gap-3">
              {/* Abertura Card */}
              <button
                onClick={() => setChecklistType('abertura')}
                className={cn(
                  "relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-300",
                  checklistType === 'abertura'
                    ? "finance-hero-card checklist-gradient-slow ring-0 scale-[1.02]"
                    : "ring-1 ring-border/40 hover:ring-border bg-card/60 opacity-70 hover:opacity-90"
                )}
              >
                <div className="flex items-center gap-3 mb-3">
                  <AppIcon
                    name={getTypeProgress.abertura.percent === 100 ? 'check_circle' : 'Sun'}
                    size={22}
                    fill={getTypeProgress.abertura.percent === 100 ? 1 : 0}
                    className={cn(
                      "transition-colors",
                      getTypeProgress.abertura.percent === 100 ? "text-success" : checklistType === 'abertura' ? "text-foreground" : "text-muted-foreground"
                    )}
                  />
                  <h3 className="text-base font-bold font-display text-foreground" style={{ letterSpacing: '-0.02em' }}>Abertura</h3>
                </div>
                {!settingsMode && (
                  <div className="space-y-1.5">
                    <div className={cn("w-full h-1.5 rounded-full overflow-hidden", checklistType === 'abertura' ? "bg-white/15" : "bg-secondary/60")}>
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${getTypeProgress.abertura.percent}%`,
                          background: getTypeProgress.abertura.percent === 100
                            ? 'hsl(var(--success))'
                            : 'linear-gradient(90deg, hsl(32 100% 50%), hsl(40 100% 55% / 0.7))',
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">
                        {getTypeProgress.abertura.completed}/{getTypeProgress.abertura.total}
                      </span>
                      <span className={cn(
                        "text-sm font-black",
                        getTypeProgress.abertura.percent === 100 ? "text-success" : "text-orange-500"
                      )}>
                        {getTypeProgress.abertura.percent}%
                      </span>
                    </div>
                  </div>
                )}
                {checklistType === 'abertura' && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                )}
              </button>

              {/* Fechamento Card */}
              <button
                onClick={() => setChecklistType('fechamento')}
                className={cn(
                  "relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-300",
                  checklistType === 'fechamento'
                    ? "finance-hero-card checklist-gradient-slow ring-0 scale-[1.02]"
                    : "ring-1 ring-border/40 hover:ring-border bg-card/60 opacity-70 hover:opacity-90"
                )}
              >
                <div className="flex items-center gap-3 mb-3">
                  <AppIcon
                    name={getTypeProgress.fechamento.percent === 100 ? 'check_circle' : 'Moon'}
                    size={22}
                    fill={getTypeProgress.fechamento.percent === 100 ? 1 : 0}
                    className={cn(
                      "transition-colors",
                      getTypeProgress.fechamento.percent === 100 ? "text-success" : checklistType === 'fechamento' ? "text-foreground" : "text-muted-foreground"
                    )}
                  />
                  <h3 className="text-base font-bold font-display text-foreground" style={{ letterSpacing: '-0.02em' }}>Fechamento</h3>
                </div>
                {!settingsMode && (
                  <div className="space-y-1.5">
                    <div className={cn("w-full h-1.5 rounded-full overflow-hidden", checklistType === 'fechamento' ? "bg-white/15" : "bg-secondary/60")}>
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${getTypeProgress.fechamento.percent}%`,
                          background: getTypeProgress.fechamento.percent === 100
                            ? 'hsl(var(--success))'
                            : 'linear-gradient(90deg, hsl(234 89% 67%), hsl(234 70% 75% / 0.7))',
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">
                        {getTypeProgress.fechamento.completed}/{getTypeProgress.fechamento.total}
                      </span>
                      <span className={cn(
                        "text-sm font-black",
                        getTypeProgress.fechamento.percent === 100 ? "text-success" : "text-indigo-500"
                      )}>
                        {getTypeProgress.fechamento.percent}%
                      </span>
                    </div>
                  </div>
                )}
                {checklistType === 'fechamento' && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full animate-pulse" style={{ background: 'hsl(234 89% 67%)' }} />
                )}
              </button>
            </div>

            {/* Bônus Card */}
            <button
              onClick={() => setChecklistType('bonus')}
              className={cn(
                "relative w-full overflow-hidden rounded-2xl p-5 text-left transition-all duration-300",
                checklistType === 'bonus'
                  ? "finance-hero-card checklist-gradient-slow ring-0 scale-[1.01] shadow-xl"
                  : "bg-card hover:shadow-lg"
              )}
              style={checklistType !== 'bonus' ? {
                border: '1px solid hsl(160 60% 45% / 0.15)',
              } : undefined}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300",
                  checklistType === 'bonus' ? "bg-emerald-500/15" : "bg-emerald-500/10"
                )}>
                  <AppIcon
                    name="Zap"
                    size={22}
                    fill={checklistType === 'bonus' ? 1 : 0}
                    className="transition-colors"
                    style={{ color: 'hsl(160 70% 45%)' }}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black font-display text-foreground" style={{ letterSpacing: '-0.02em' }}>Bônus</h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{
                      color: checklistType === 'bonus' ? 'hsl(160 84% 70%)' : 'hsl(160 84% 50%)',
                      background: checklistType === 'bonus' ? 'hsl(160 84% 39% / 0.2)' : 'hsl(160 84% 39% / 0.12)',
                    }}>
                      Extra pts
                    </span>
                  </div>
                  <p className="text-xs mt-0.5 text-muted-foreground">
                    Tarefas exclusivas para mais pontos ⚡
                  </p>
                </div>
                <AppIcon name="ChevronRight" size={18} className="text-muted-foreground" />
              </div>
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  opacity: checklistType === 'bonus' ? 0.3 : 0.2,
                  background: 'linear-gradient(105deg, transparent 40%, hsl(160 84% 39% / 0.15) 45%, hsl(var(--neon-cyan) / 0.1) 55%, transparent 60%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 120s ease-in-out infinite',
                }}
              />
            </button>

            {/* Content area — either checklist view or settings */}
            <div className="pt-3">
              {settingsMode ? (
                <ChecklistSettings
                  sectors={sectors.filter((s: any) => settingsType === 'bonus' ? s.scope === 'bonus' : s.scope !== 'bonus')}
                  selectedType={settingsType}
                  onTypeChange={setSettingsType}
                  onAddSector={handleAddSector}
                  onUpdateSector={handleUpdateSector}
                  onDeleteSector={handleDeleteSector}
                  onReorderSectors={reorderSectors}
                  onAddSubcategory={handleAddSubcategory}
                  onUpdateSubcategory={handleUpdateSubcategory}
                  onDeleteSubcategory={handleDeleteSubcategory}
                  onReorderSubcategories={reorderSubcategories}
                  onAddItem={handleAddItem}
                  onUpdateItem={handleUpdateItem}
                  onDeleteItem={handleDeleteItem}
                  onReorderItems={reorderItems}
                />
              ) : (
                <ChecklistView
                  sectors={sectors.filter((s: any) => checklistType === 'bonus' ? s.scope === 'bonus' : s.scope !== 'bonus')}
                  checklistType={checklistType}
                  date={currentDate}
                  completions={completions}
                  isItemCompleted={isItemCompleted}
                  onToggleItem={handleToggleItem}
                  getCompletionProgress={(sectorId) => getCompletionProgress(sectorId, checklistType)}
                  currentUserId={user?.id}
                  isAdmin={isAdmin}
                  deadlinePassed={deadlinePassed}
                  onContestCompletion={contestCompletion}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
