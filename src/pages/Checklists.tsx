import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { format, parseISO, isAfter, startOfDay, addDays } from 'date-fns';
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
import { DatePicker } from '@/components/ui/date-picker';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type TabView = 'checklist' | 'settings';

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
  const [currentTab, setCurrentTab] = useState<TabView>('checklist');
  const [checklistType, setChecklistType] = useState<ChecklistType>('abertura');
  const [settingsType, setSettingsType] = useState<ChecklistType>('abertura');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const currentDate = format(selectedDate, 'yyyy-MM-dd');

  useFabAction(isAdmin ? { icon: currentTab === 'settings' ? 'X' : 'Settings', label: 'Configurações', onClick: () => setCurrentTab(currentTab === 'settings' ? 'checklist' : 'settings') } : null, [isAdmin, currentTab]);

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
      // Deadline: same day at 07:30
      const deadline = new Date(checkDate);
      deadline.setHours(7, 30, 0, 0);
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
          <div className="animate-fade-in space-y-5" key={currentTab}>
          {currentTab === 'checklist' ? (
            <div className="space-y-5">
              <div className="flex justify-center">
                <DatePicker
                  date={selectedDate}
                  onSelect={(date) => setSelectedDate(date)}
                  className="w-auto"
                />
              </div>

              {/* Checklist Type Cards */}
              <div className="grid grid-cols-2 gap-3">
                {/* Abertura Card */}
                <button
                  onClick={() => setChecklistType('abertura')}
                  className={cn(
                    "relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-300",
                    checklistType === 'abertura'
                      ? "finance-hero-card ring-0 scale-[1.02]"
                      : "ring-1 ring-border/40 hover:ring-border bg-card/60 opacity-70 hover:opacity-90"
                  )}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <AppIcon
                      name={getTypeProgress.abertura.percent === 100 ? 'check_circle' : 'Sun'}
                      size={22}
                      fill={getTypeProgress.abertura.percent === 100 ? 1 : 0}
                      style={{ color: checklistType === 'abertura' ? '#475569' : undefined }}
                      className={cn(
                        "transition-colors",
                        getTypeProgress.abertura.percent === 100 ? "text-success" : "text-muted-foreground"
                      )}
                    />
                    <h3 className={cn(
                      "text-base font-bold font-display",
                      checklistType === 'abertura' ? "text-slate-800" : "text-foreground"
                    )} style={{ letterSpacing: '-0.02em' }}>Abertura</h3>
                  </div>
                  <div className="space-y-1.5">
                    <div className={cn("w-full h-1.5 rounded-full overflow-hidden", checklistType === 'abertura' ? "bg-slate-200/60" : "bg-secondary/60")}>
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
                      <span className={cn("text-[10px]", checklistType === 'abertura' ? "text-slate-500" : "text-muted-foreground")}>
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
                      ? "finance-hero-card ring-0 scale-[1.02]"
                      : "ring-1 ring-border/40 hover:ring-border bg-card/60 opacity-70 hover:opacity-90"
                  )}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <AppIcon
                      name={getTypeProgress.fechamento.percent === 100 ? 'check_circle' : 'Moon'}
                      size={22}
                      fill={getTypeProgress.fechamento.percent === 100 ? 1 : 0}
                      style={{ color: checklistType === 'fechamento' ? '#475569' : undefined }}
                      className={cn(
                        "transition-colors",
                        getTypeProgress.fechamento.percent === 100 ? "text-success" : "text-muted-foreground"
                      )}
                    />
                    <h3 className={cn(
                      "text-base font-bold font-display",
                      checklistType === 'fechamento' ? "text-slate-800" : "text-foreground"
                    )} style={{ letterSpacing: '-0.02em' }}>Fechamento</h3>
                  </div>
                  <div className="space-y-1.5">
                    <div className={cn("w-full h-1.5 rounded-full overflow-hidden", checklistType === 'fechamento' ? "bg-slate-200/60" : "bg-secondary/60")}>
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
                      <span className={cn("text-[10px]", checklistType === 'fechamento' ? "text-slate-500" : "text-muted-foreground")}>
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
                  {checklistType === 'fechamento' && (
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full animate-pulse" style={{ background: 'hsl(234 89% 67%)' }} />
                  )}
                </button>
              </div>

              {/* Bônus Card - Full width, distinct colors (cyan/emerald, NOT amber) */}
              <button
                onClick={() => setChecklistType('bonus')}
                className={cn(
                  "relative w-full overflow-hidden rounded-2xl p-5 text-left transition-all duration-300",
                  checklistType === 'bonus'
                    ? "finance-hero-card ring-0 scale-[1.01] shadow-xl"
                    : "bg-card hover:shadow-lg"
                )}
                style={checklistType !== 'bonus' ? {
                  border: '1px solid hsl(160 60% 45% / 0.3)',
                  boxShadow: '0 0 12px hsl(160 70% 45% / 0.08), 0 2px 8px hsl(0 0% 0% / 0.04)',
                } : undefined}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300",
                    checklistType === 'bonus'
                      ? "bg-emerald-500/15"
                      : "bg-emerald-500/10"
                  )}>
                    <AppIcon
                      name="Zap"
                      size={22}
                      fill={checklistType === 'bonus' ? 1 : 0}
                      className="transition-colors"
                      style={{ color: checklistType === 'bonus' ? '#475569' : 'hsl(160 70% 45%)' }}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className={cn(
                        "text-base font-black font-display",
                        checklistType === 'bonus' ? "text-slate-800" : "text-foreground"
                      )} style={{ letterSpacing: '-0.02em' }}>Bônus</h3>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{
                        color: checklistType === 'bonus' ? 'hsl(160 84% 30%)' : 'hsl(160 84% 50%)',
                        background: checklistType === 'bonus' ? 'hsl(160 84% 39% / 0.15)' : 'hsl(160 84% 39% / 0.12)',
                      }}>
                        Extra pts
                      </span>
                    </div>
                    <p className={cn(
                      "text-xs mt-0.5",
                      checklistType === 'bonus' ? "text-slate-500" : "text-muted-foreground"
                    )}>
                      Tarefas exclusivas para mais pontos ⚡
                    </p>
                  </div>
                  <AppIcon name="ChevronRight" size={18} className={checklistType === 'bonus' ? "text-slate-400" : "text-muted-foreground"} />
                </div>
                {/* Shimmer effect — always visible, stronger when selected */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    opacity: checklistType === 'bonus' ? 0.3 : 0.2,
                    background: 'linear-gradient(105deg, transparent 40%, hsl(160 84% 39% / 0.15) 45%, hsl(var(--neon-cyan) / 0.1) 55%, transparent 60%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 3s ease-in-out infinite',
                  }}
                />
              </button>

              {/* Spacer + Checklist View */}
              <div className="pt-3">
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
              </div>
            </div>
          ) : (
            <>
              {/* Settings Header */}
              <div className="card-command p-4">
                <div className="flex items-center gap-3">
                  <AppIcon name="ClipboardCheck" size={20} className="text-primary" />
                  <div>
                    <h2 className="font-semibold text-foreground">Configurar Checklists</h2>
                    <p className="text-sm text-muted-foreground">
                      Gerencie setores, subcategorias e itens
                    </p>
                  </div>
                </div>
              </div>

              {/* Type Selector */}
              <div className="tab-command">
                <button
                  onClick={() => setSettingsType('abertura')}
                  className={cn(
                    "tab-command-item gap-2",
                    settingsType === 'abertura' ? "tab-command-active" : "tab-command-inactive"
                  )}
                  style={settingsType === 'abertura' ? { borderColor: 'hsl(38 92% 50% / 0.4)', boxShadow: '0 0 12px hsl(38 92% 50% / 0.15)' } : undefined}
                >
                  <AppIcon name="Sun" size={20} />
                   <span className="font-semibold">Abertura</span>
                </button>
                <button
                  onClick={() => setSettingsType('fechamento')}
                  className={cn(
                    "tab-command-item gap-2",
                    settingsType === 'fechamento' ? "tab-command-active" : "tab-command-inactive"
                  )}
                  style={settingsType === 'fechamento' ? { borderColor: 'hsl(var(--accent) / 0.4)', boxShadow: '0 0 12px hsl(var(--accent) / 0.15)' } : undefined}
                >
                  <AppIcon name="Moon" size={20} />
                   <span className="font-semibold">Fechamento</span>
                </button>
                <button
                  onClick={() => setSettingsType('bonus')}
                  className={cn(
                    "tab-command-item gap-1.5",
                    settingsType === 'bonus' ? "tab-command-active" : "tab-command-inactive"
                  )}
                  style={settingsType === 'bonus' ? { 
                    borderColor: 'hsl(38 92% 50% / 0.5)', 
                    boxShadow: '0 0 16px hsl(38 92% 50% / 0.25)',
                    background: 'linear-gradient(135deg, hsl(38 92% 50% / 0.08), hsl(280 90% 65% / 0.08))'
                  } : undefined}
                >
                  <AppIcon name="Zap" size={16} />
                  <span className="font-semibold text-xs">Bônus</span>
                </button>
              </div>

              {/* Settings Component */}
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
            </>
          )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
