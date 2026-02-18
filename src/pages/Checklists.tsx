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
          <div className="page-header-content">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="icon-glow icon-glow-md icon-glow-success">
                   <AppIcon name="ClipboardCheck" size={20} />
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
                  <AppIcon name="Settings" size={20} />
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
              <div className="tab-command">
                <button
                  onClick={() => setChecklistType('abertura')}
                  className={cn(
                    "tab-command-item gap-2",
                    checklistType === 'abertura' ? "tab-command-active" : "tab-command-inactive"
                  )}
                  style={checklistType === 'abertura' ? { borderColor: 'hsl(38 92% 50% / 0.4)', boxShadow: '0 0 12px hsl(38 92% 50% / 0.15)' } : undefined}
                >
                  <AppIcon name="Sun" size={20} />
                   <span className="font-bold text-sm">Abertura</span>
                </button>

                <button
                  onClick={() => setChecklistType('fechamento')}
                  className={cn(
                    "tab-command-item gap-2",
                    checklistType === 'fechamento' ? "tab-command-active" : "tab-command-inactive"
                  )}
                  style={checklistType === 'fechamento' ? { borderColor: 'hsl(262 80% 65% / 0.4)', boxShadow: '0 0 12px hsl(262 80% 65% / 0.15)' } : undefined}
                >
                  <AppIcon name="Moon" size={20} />
                   <span className="font-bold text-sm">Fechamento</span>
                </button>

                <button
                  onClick={() => setChecklistType('bonus')}
                  className={cn(
                    "tab-command-item gap-1.5 relative overflow-hidden",
                    checklistType === 'bonus' ? "tab-command-active" : "tab-command-inactive"
                  )}
                  style={checklistType === 'bonus' ? { 
                    borderColor: 'hsl(38 92% 50% / 0.5)', 
                    boxShadow: '0 0 16px hsl(38 92% 50% / 0.25), 0 0 32px hsl(280 90% 65% / 0.1)',
                    background: 'linear-gradient(135deg, hsl(38 92% 50% / 0.08), hsl(280 90% 65% / 0.08))'
                  } : undefined}
                >
                  <AppIcon name="Zap" size={16} className={cn(checklistType === 'bonus' && "animate-pulse")} />
                  <span className="font-bold text-xs">Bônus</span>
                  {checklistType === 'bonus' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse pointer-events-none" />
                  )}
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
