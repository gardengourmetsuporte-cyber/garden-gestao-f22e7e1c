import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppLayout } from '@/components/layout/AppLayout';
import { useChecklists } from '@/hooks/useChecklists';
import { useAuth } from '@/contexts/AuthContext';
import { ChecklistView } from '@/components/checklists/ChecklistView';
import { ChecklistSettings } from '@/components/checklists/ChecklistSettings';
import { ChecklistType } from '@/types/database';
import { AppIcon } from '@/components/ui/app-icon';
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

  const [currentTab, setCurrentTab] = useState<TabView>('checklist');
  const [checklistType, setChecklistType] = useState<ChecklistType>('abertura');
  const [settingsType, setSettingsType] = useState<ChecklistType>('abertura');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const currentDate = format(selectedDate, 'yyyy-MM-dd');

  useEffect(() => {
    fetchCompletions(currentDate, checklistType);
  }, [currentDate, checklistType, fetchCompletions]);

  const handleToggleItem = async (itemId: string, points: number = 1, completedByUserId?: string, isSkipped?: boolean) => {
    try {
      await toggleCompletion(itemId, checklistType, currentDate, isAdmin, points, completedByUserId, isSkipped);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao marcar item');
    }
  };

  const handleAddSector = async (data: { name: string; color: string }) => {
    try { await addSector(data); } catch { toast.error('Erro ao criar setor'); }
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
  const handleAddItem = async (data: { subcategory_id: string; name: string; description?: string }) => {
    try { await addItem(data); } catch { toast.error('Erro ao criar item'); }
  };
  const handleUpdateItem = async (id: string, data: { name?: string; description?: string; is_active?: boolean }) => {
    try { await updateItem(id, data); } catch { toast.error('Erro ao atualizar item'); }
  };
  const handleDeleteItem = async (id: string) => {
    try { await deleteItem(id); } catch { toast.error('Erro ao excluir item'); }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Carregando...</div>
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

        <div className="px-4 py-4 lg:px-6 space-y-4">
          {currentTab === 'checklist' ? (
            <>
              {/* Date Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-medium h-12 rounded-xl bg-card border"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
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
              <div className="grid grid-cols-2 gap-3">
                {/* Abertura Card */}
                <button
                  onClick={() => setChecklistType('abertura')}
                  className={cn(
                    "relative overflow-hidden rounded-2xl p-5 text-left transition-all duration-300",
                    checklistType === 'abertura'
                      ? "ring-2 ring-amber-400/60 scale-[1.02] shadow-lg"
                      : "ring-1 ring-border/40 hover:ring-border opacity-80 hover:opacity-100"
                  )}
                  style={{
                    background: checklistType === 'abertura'
                      ? 'linear-gradient(135deg, hsl(38 92% 50% / 0.15), hsl(45 100% 60% / 0.05))'
                      : 'hsl(var(--card))',
                  }}
                >
                  <div className="flex flex-col gap-3">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
                      checklistType === 'abertura'
                        ? "bg-amber-400/20 shadow-inner"
                        : "bg-secondary"
                    )}>
                      <AppIcon name="Sun" size={24} className={cn(
                        "transition-colors",
                        checklistType === 'abertura' ? "text-amber-400" : "text-muted-foreground"
                      )} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">Abertura</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Tarefas do início</p>
                    </div>
                  </div>
                  {checklistType === 'abertura' && (
                    <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                  )}
                </button>

                {/* Fechamento Card */}
                <button
                  onClick={() => setChecklistType('fechamento')}
                  className={cn(
                    "relative overflow-hidden rounded-2xl p-5 text-left transition-all duration-300",
                    checklistType === 'fechamento'
                      ? "ring-2 ring-violet-400/60 scale-[1.02] shadow-lg"
                      : "ring-1 ring-border/40 hover:ring-border opacity-80 hover:opacity-100"
                  )}
                  style={{
                    background: checklistType === 'fechamento'
                      ? 'linear-gradient(135deg, hsl(262 80% 65% / 0.15), hsl(280 90% 70% / 0.05))'
                      : 'hsl(var(--card))',
                  }}
                >
                  <div className="flex flex-col gap-3">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
                      checklistType === 'fechamento'
                        ? "bg-violet-400/20 shadow-inner"
                        : "bg-secondary"
                    )}>
                      <AppIcon name="Moon" size={24} className={cn(
                        "transition-colors",
                        checklistType === 'fechamento' ? "text-violet-400" : "text-muted-foreground"
                      )} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">Fechamento</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Tarefas do final</p>
                    </div>
                  </div>
                  {checklistType === 'fechamento' && (
                    <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-violet-400 animate-pulse" />
                  )}
                </button>
              </div>

              {/* Bônus Card - Full width, eye-catching */}
              <button
                onClick={() => setChecklistType('bonus')}
                className={cn(
                  "relative w-full overflow-hidden rounded-2xl p-5 text-left transition-all duration-300",
                  checklistType === 'bonus'
                    ? "ring-2 ring-amber-400/60 scale-[1.01] shadow-xl"
                    : "ring-1 ring-amber-500/20 hover:ring-amber-500/40"
                )}
                style={{
                  background: checklistType === 'bonus'
                    ? 'linear-gradient(135deg, hsl(38 92% 50% / 0.18), hsl(280 90% 65% / 0.12), hsl(38 92% 50% / 0.08))'
                    : 'linear-gradient(135deg, hsl(38 92% 50% / 0.06), hsl(280 90% 65% / 0.04))',
                }}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-14 h-14 rounded-xl flex items-center justify-center relative",
                    checklistType === 'bonus'
                      ? "bg-gradient-to-br from-amber-400/30 to-violet-500/20"
                      : "bg-amber-500/10"
                  )}>
                    <AppIcon name="Zap" size={28} className={cn(
                      "transition-all",
                      checklistType === 'bonus' ? "text-amber-400 animate-pulse" : "text-amber-500/60"
                    )} />
                    {checklistType === 'bonus' && (
                      <div className="absolute inset-0 rounded-xl bg-amber-400/10 animate-ping" style={{ animationDuration: '2s' }} />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-foreground">Bônus</h3>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-400">
                        Extra pts
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Tarefas extras para ganhar mais pontos ⚡
                    </p>
                  </div>
                  <AppIcon name="ChevronRight" size={18} className="text-muted-foreground" />
                </div>
                {/* Shimmer effect */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-30"
                  style={{
                    background: 'linear-gradient(105deg, transparent 40%, hsl(38 92% 60% / 0.15) 45%, hsl(280 90% 65% / 0.1) 55%, transparent 60%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 3s ease-in-out infinite',
                  }}
                />
              </button>

              {/* Checklist View */}
              <ChecklistView
                sectors={sectors}
                checklistType={checklistType}
                date={currentDate}
                completions={completions}
                isItemCompleted={isItemCompleted}
                onToggleItem={handleToggleItem}
                getCompletionProgress={(sectorId) => getCompletionProgress(sectorId, checklistType)}
                currentUserId={user?.id}
                isAdmin={isAdmin}
              />
            </>
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
                sectors={sectors}
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
    </AppLayout>
  );
}
