import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppLayout } from '@/components/layout/AppLayout';
import { useChecklists } from '@/hooks/useChecklists';
import { useAuth } from '@/contexts/AuthContext';
import { ChecklistView } from '@/components/checklists/ChecklistView';
import { ChecklistSettings } from '@/components/checklists/ChecklistSettings';
import { ChecklistType } from '@/types/database';
import { ClipboardCheck, Settings, Sun, Moon, CalendarIcon } from 'lucide-react';
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
    reorderItems,
    // Completion operations
    toggleCompletion,
    isItemCompleted,
    getCompletionProgress,
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

  const handleToggleItem = async (itemId: string, points: number = 1) => {
    try {
      await toggleCompletion(itemId, checklistType, currentDate, isAdmin, points);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao marcar item');
    }
  };

  const handleAddSector = async (data: { name: string; color: string }) => {
    try {
      await addSector(data);
    } catch (error) {
      toast.error('Erro ao criar setor');
    }
  };

  const handleUpdateSector = async (id: string, data: { name?: string; color?: string }) => {
    try {
      await updateSector(id, data);
    } catch (error) {
      toast.error('Erro ao atualizar setor');
    }
  };

  const handleDeleteSector = async (id: string) => {
    try {
      await deleteSector(id);
    } catch (error) {
      toast.error('Erro ao excluir setor');
    }
  };

  const handleAddSubcategory = async (data: { sector_id: string; name: string }) => {
    try {
      await addSubcategory(data);
    } catch (error) {
      toast.error('Erro ao criar subcategoria');
    }
  };

  const handleUpdateSubcategory = async (id: string, data: { name?: string }) => {
    try {
      await updateSubcategory(id, data);
    } catch (error) {
      toast.error('Erro ao atualizar subcategoria');
    }
  };

  const handleDeleteSubcategory = async (id: string) => {
    try {
      await deleteSubcategory(id);
    } catch (error) {
      toast.error('Erro ao excluir subcategoria');
    }
  };

  const handleAddItem = async (data: { subcategory_id: string; name: string; description?: string }) => {
    try {
      await addItem(data);
    } catch (error) {
      toast.error('Erro ao criar item');
    }
  };

  const handleUpdateItem = async (id: string, data: { name?: string; description?: string; is_active?: boolean }) => {
    try {
      await updateItem(id, data);
    } catch (error) {
      toast.error('Erro ao atualizar item');
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await deleteItem(id);
    } catch (error) {
      toast.error('Erro ao excluir item');
    }
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
        <header className="page-header">
          <div className="page-header-content">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="page-header-icon bg-success/10">
                  <ClipboardCheck className="w-5 h-5 text-success" />
                </div>
                <div>
                  <h1 className="page-title">Checklists</h1>
                  <p className="page-subtitle">Controle de tarefas diárias</p>
                </div>
              </div>
              {isAdmin && (
                <button
                  onClick={() => setCurrentTab(currentTab === 'settings' ? 'checklist' : 'settings')}
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                    currentTab === 'settings'
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Settings className="w-5 h-5" />
                </button>
              )}
            </div>
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

              {/* Checklist Type Selector */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setChecklistType('abertura')}
                  className={cn(
                    "card-interactive flex flex-col items-center gap-2 p-4",
                    checklistType === 'abertura'
                      ? "border-2 border-amber-500 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 shadow-lg shadow-amber-500/20"
                      : "hover:border-amber-300"
                  )}
                >
                  <div className={cn(
                    "w-14 h-14 rounded-xl flex items-center justify-center transition-all",
                    checklistType === 'abertura'
                      ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg"
                      : "bg-amber-100 dark:bg-amber-900/30 text-amber-600"
                  )}>
                    <Sun className="w-7 h-7" />
                  </div>
                  <div className="text-center">
                    <p className={cn(
                      "font-bold text-sm",
                      checklistType === 'abertura' ? "text-amber-700 dark:text-amber-400" : "text-foreground"
                    )}>Abertura</p>
                    <p className="text-xs text-muted-foreground">Manhã</p>
                  </div>
                </button>

                <button
                  onClick={() => setChecklistType('fechamento')}
                  className={cn(
                    "card-interactive flex flex-col items-center gap-2 p-4",
                    checklistType === 'fechamento'
                      ? "border-2 border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/20 shadow-lg shadow-indigo-500/20"
                      : "hover:border-indigo-300"
                  )}
                >
                  <div className={cn(
                    "w-14 h-14 rounded-xl flex items-center justify-center transition-all",
                    checklistType === 'fechamento'
                      ? "bg-gradient-to-br from-indigo-400 to-purple-500 text-white shadow-lg"
                      : "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600"
                  )}>
                    <Moon className="w-7 h-7" />
                  </div>
                  <div className="text-center">
                    <p className={cn(
                      "font-bold text-sm",
                      checklistType === 'fechamento' ? "text-indigo-700 dark:text-indigo-400" : "text-foreground"
                    )}>Fechamento</p>
                    <p className="text-xs text-muted-foreground">Noite</p>
                  </div>
                </button>
              </div>

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
              <div className="card-base p-4">
                <div className="flex items-center gap-3">
                  <ClipboardCheck className="w-5 h-5 text-primary" />
                  <div>
                    <h2 className="font-semibold text-foreground">Configurar Checklists</h2>
                    <p className="text-sm text-muted-foreground">
                      Gerencie setores, subcategorias e itens
                    </p>
                  </div>
                </div>
              </div>

              {/* Type Selector */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSettingsType('abertura')}
                  className={cn(
                    "flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all",
                    settingsType === 'abertura' 
                      ? "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400" 
                      : "border-border bg-card text-muted-foreground hover:bg-secondary/50"
                  )}
                >
                  <Sun className="w-5 h-5" />
                  <span className="font-semibold">Abertura</span>
                </button>
                <button
                  onClick={() => setSettingsType('fechamento')}
                  className={cn(
                    "flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all",
                    settingsType === 'fechamento' 
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400" 
                      : "border-border bg-card text-muted-foreground hover:bg-secondary/50"
                  )}
                >
                  <Moon className="w-5 h-5" />
                  <span className="font-semibold">Fechamento</span>
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
