import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
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
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

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
    toggleCompletion, isItemCompleted, getCompletionProgress,
    fetchCompletions,
  } = useChecklists();

  const queryClient = useQueryClient();
  const { activeUnitId } = useUnit();
  const [currentTab, setCurrentTab] = useState<TabView>('checklist');
  const [checklistType, setChecklistType] = useState<ChecklistType>('abertura');
  const [settingsType, setSettingsType] = useState<ChecklistType>('abertura');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const currentDate = format(selectedDate, 'yyyy-MM-dd');

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
  useEffect(() => {
    fetchCompletions(currentDate, checklistType);
  }, [currentDate, checklistType, fetchCompletions]);

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
          <header className="page-header-bar">
            <div className="page-header-content">
              <Skeleton className="h-7 w-28" />
            </div>
          </header>
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
        {/* Header */}
        <header className="page-header-bar">
          <div className="page-header-content flex items-center justify-between">
            <h1 className="page-title">Checklists</h1>
            {isAdmin && (
              <button
                onClick={() => setCurrentTab(currentTab === 'settings' ? 'checklist' : 'settings')}
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                  currentTab === 'settings'
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                <AppIcon name="Settings" size={18} />
              </button>
            )}
          </div>
        </header>

        <div className="px-4 py-4 lg:px-6 space-y-8">
          <div className="animate-fade-in space-y-6" key={currentTab}>
          {currentTab === 'checklist' ? (
            <div className="space-y-6">
              <Popover modal={false}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-medium h-12 rounded-xl bg-card border"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start" avoidCollisions={false}>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                    className="p-3 pointer-events-auto"
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>

              {/* Checklist Type Cards */}
              <div className="grid grid-cols-2 gap-4">
                {/* Abertura Card */}
                <button
                  onClick={() => setChecklistType('abertura')}
                  className={cn(
                    "relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-300",
                    checklistType === 'abertura'
                      ? "ring-2 scale-[1.02] shadow-lg"
                      : "ring-1 ring-border/40 hover:ring-border opacity-80 hover:opacity-100"
                  )}
                  style={{
                    background: checklistType === 'abertura'
                      ? 'linear-gradient(135deg, hsl(38 92% 50% / 0.15), hsl(45 100% 60% / 0.05))'
                      : 'hsl(var(--card))',
                    ...(checklistType === 'abertura' ? { ringColor: 'hsl(38 92% 50% / 0.5)' } : {}),
                    borderColor: checklistType === 'abertura' ? 'hsl(38 92% 50% / 0.5)' : undefined,
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                      checklistType === 'abertura'
                        ? "shadow-inner"
                        : "bg-secondary"
                    )}
                    style={checklistType === 'abertura' ? { background: 'hsl(38 92% 50% / 0.2)' } : undefined}
                    >
                      <AppIcon name="Sun" size={22} className={cn(
                        "transition-colors",
                        checklistType === 'abertura' ? "text-amber-400" : "text-muted-foreground"
                      )} />
                    </div>
                    <h3 className="text-base font-bold text-foreground">Abertura</h3>
                  </div>
                  {/* Progress bar + percentage */}
                  <div className="space-y-1.5">
                    <div className="w-full h-1.5 rounded-full bg-secondary/60 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${getTypeProgress.abertura.percent}%`,
                          background: getTypeProgress.abertura.percent === 100
                            ? 'hsl(var(--success))'
                            : 'linear-gradient(90deg, hsl(38 92% 50%), hsl(38 92% 50% / 0.6))',
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">
                        {getTypeProgress.abertura.completed}/{getTypeProgress.abertura.total}
                      </span>
                      <span className={cn(
                        "text-sm font-black",
                        getTypeProgress.abertura.percent === 100 ? "text-success" : "text-amber-400"
                      )}>
                        {getTypeProgress.abertura.percent}%
                      </span>
                    </div>
                  </div>
                  {checklistType === 'abertura' && (
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  )}
                </button>

                {/* Fechamento Card */}
                <button
                  onClick={() => setChecklistType('fechamento')}
                  className={cn(
                    "relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-300",
                    checklistType === 'fechamento'
                      ? "ring-2 scale-[1.02] shadow-lg"
                      : "ring-1 ring-border/40 hover:ring-border opacity-80 hover:opacity-100"
                  )}
                  style={{
                    background: checklistType === 'fechamento'
                      ? 'linear-gradient(135deg, hsl(262 80% 65% / 0.15), hsl(280 90% 70% / 0.05))'
                      : 'hsl(var(--card))',
                    borderColor: checklistType === 'fechamento' ? 'hsl(262 80% 65% / 0.5)' : undefined,
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                      checklistType === 'fechamento'
                        ? "shadow-inner"
                        : "bg-secondary"
                    )}
                    style={checklistType === 'fechamento' ? { background: 'hsl(262 80% 65% / 0.2)' } : undefined}
                    >
                      <AppIcon name="Moon" size={22} className={cn(
                        "transition-colors",
                        checklistType === 'fechamento' ? "text-violet-400" : "text-muted-foreground"
                      )} />
                    </div>
                    <h3 className="text-base font-bold text-foreground">Fechamento</h3>
                  </div>
                  {/* Progress bar + percentage */}
                  <div className="space-y-1.5">
                    <div className="w-full h-1.5 rounded-full bg-secondary/60 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${getTypeProgress.fechamento.percent}%`,
                          background: getTypeProgress.fechamento.percent === 100
                            ? 'hsl(var(--success))'
                            : 'linear-gradient(90deg, hsl(262 80% 65%), hsl(262 80% 65% / 0.6))',
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">
                        {getTypeProgress.fechamento.completed}/{getTypeProgress.fechamento.total}
                      </span>
                      <span className={cn(
                        "text-sm font-black",
                        getTypeProgress.fechamento.percent === 100 ? "text-success" : "text-violet-400"
                      )}>
                        {getTypeProgress.fechamento.percent}%
                      </span>
                    </div>
                  </div>
                  {checklistType === 'fechamento' && (
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                  )}
                </button>
              </div>

              {/* Bônus Card - Full width, distinct colors (cyan/emerald, NOT amber) */}
              <button
                onClick={() => setChecklistType('bonus')}
                className={cn(
                  "relative w-full overflow-hidden rounded-2xl p-5 text-left transition-all duration-300",
                  checklistType === 'bonus'
                    ? "ring-2 scale-[1.01] shadow-xl"
                    : "ring-1 hover:ring-emerald-500/40"
                )}
                style={{
                  background: checklistType === 'bonus'
                    ? 'linear-gradient(135deg, hsl(160 84% 39% / 0.15), hsl(var(--neon-cyan) / 0.1), hsl(160 84% 39% / 0.05))'
                    : 'linear-gradient(135deg, hsl(160 84% 39% / 0.05), hsl(var(--neon-cyan) / 0.03))',
                  borderColor: checklistType === 'bonus' ? 'hsl(160 84% 39% / 0.5)' : 'hsl(160 84% 39% / 0.15)',
                }}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-14 h-14 rounded-xl flex items-center justify-center relative",
                    checklistType === 'bonus'
                      ? "bg-emerald-500/15"
                      : "bg-emerald-500/8"
                  )}
                  style={{
                    background: checklistType === 'bonus'
                      ? 'linear-gradient(135deg, hsl(160 84% 39% / 0.25), hsl(var(--neon-cyan) / 0.15))'
                      : 'hsl(160 84% 39% / 0.08)',
                  }}
                  >
                    <AppIcon name="Zap" size={28} className={cn(
                      "transition-all",
                      checklistType === 'bonus' ? "text-emerald-400 animate-pulse" : "text-emerald-500/50"
                    )} />
                    {checklistType === 'bonus' && (
                      <div className="absolute inset-0 rounded-xl animate-ping" style={{ animationDuration: '2s', background: 'hsl(160 84% 39% / 0.08)' }} />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-foreground">Bônus</h3>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-emerald-400" style={{ background: 'hsl(160 84% 39% / 0.12)' }}>
                        Extra pts
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Tarefas exclusivas para mais pontos ⚡
                    </p>
                  </div>
                  <AppIcon name="ChevronRight" size={18} className="text-muted-foreground" />
                </div>
                {/* Shimmer effect */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-30"
                  style={{
                    background: 'linear-gradient(105deg, transparent 40%, hsl(160 84% 39% / 0.15) 45%, hsl(var(--neon-cyan) / 0.1) 55%, transparent 60%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 3s ease-in-out infinite',
                  }}
                />
              </button>

              {/* Checklist View */}
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
              />
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
                  style={settingsType === 'fechamento' ? { borderColor: 'hsl(262 80% 65% / 0.4)', boxShadow: '0 0 12px hsl(262 80% 65% / 0.15)' } : undefined}
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
