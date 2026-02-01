import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { AppLayout } from '@/components/layout/AppLayout';
import { useChecklists } from '@/hooks/useChecklists';
import { useAuth } from '@/contexts/AuthContext';
import { ChecklistView } from '@/components/checklists/ChecklistView';
import { ChecklistSettings } from '@/components/checklists/ChecklistSettings';
import { ChecklistType } from '@/types/database';
import { ClipboardCheck, Settings, Sun, Moon, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
    // Subcategory operations
    addSubcategory,
    updateSubcategory,
    deleteSubcategory,
    // Item operations
    addItem,
    updateItem,
    deleteItem,
    // Completion operations
    toggleCompletion,
    isItemCompleted,
    getCompletionProgress,
    fetchCompletions,
  } = useChecklists();

  const [currentTab, setCurrentTab] = useState<TabView>('checklist');
  const [checklistType, setChecklistType] = useState<ChecklistType>('abertura');
  const [currentDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    fetchCompletions(currentDate, checklistType);
  }, [currentDate, checklistType, fetchCompletions]);

  const handleToggleItem = async (itemId: string) => {
    try {
      await toggleCompletion(itemId, checklistType, currentDate, isAdmin);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao marcar item');
    }
  };

  const handleAddSector = async (data: { name: string; color: string }) => {
    try {
      await addSector(data);
      toast.success('Setor criado!');
    } catch (error) {
      toast.error('Erro ao criar setor');
    }
  };

  const handleUpdateSector = async (id: string, data: { name?: string; color?: string }) => {
    try {
      await updateSector(id, data);
      toast.success('Setor atualizado!');
    } catch (error) {
      toast.error('Erro ao atualizar setor');
    }
  };

  const handleDeleteSector = async (id: string) => {
    try {
      await deleteSector(id);
      toast.success('Setor excluído!');
    } catch (error) {
      toast.error('Erro ao excluir setor');
    }
  };

  const handleAddSubcategory = async (data: { sector_id: string; name: string }) => {
    try {
      await addSubcategory(data);
      toast.success('Subcategoria criada!');
    } catch (error) {
      toast.error('Erro ao criar subcategoria');
    }
  };

  const handleUpdateSubcategory = async (id: string, data: { name?: string }) => {
    try {
      await updateSubcategory(id, data);
      toast.success('Subcategoria atualizada!');
    } catch (error) {
      toast.error('Erro ao atualizar subcategoria');
    }
  };

  const handleDeleteSubcategory = async (id: string) => {
    try {
      await deleteSubcategory(id);
      toast.success('Subcategoria excluída!');
    } catch (error) {
      toast.error('Erro ao excluir subcategoria');
    }
  };

  const handleAddItem = async (data: { subcategory_id: string; name: string; description?: string }) => {
    try {
      await addItem(data);
      toast.success('Item criado!');
    } catch (error) {
      toast.error('Erro ao criar item');
    }
  };

  const handleUpdateItem = async (id: string, data: { name?: string; description?: string; is_active?: boolean }) => {
    try {
      await updateItem(id, data);
      toast.success('Item atualizado!');
    } catch (error) {
      toast.error('Erro ao atualizar item');
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await deleteItem(id);
      toast.success('Item excluído!');
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
        <header className="bg-card border-b sticky top-0 lg:top-0 z-40">
          <div className="px-4 py-4 lg:px-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-foreground">Checklists</h1>
                <p className="text-sm text-muted-foreground">Controle de tarefas diárias</p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => setCurrentTab(currentTab === 'settings' ? 'checklist' : 'settings')}
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                    currentTab === 'settings'
                      ? "bg-primary text-primary-foreground"
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
              {/* Checklist Type Selector */}
              <div className="flex gap-2 bg-secondary p-1 rounded-xl">
                <button
                  onClick={() => setChecklistType('abertura')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all",
                    checklistType === 'abertura'
                      ? "bg-card shadow-sm text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  <Sun className="w-4 h-4" />
                  Abertura
                </button>
                <button
                  onClick={() => setChecklistType('fechamento')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all",
                    checklistType === 'fechamento'
                      ? "bg-card shadow-sm text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  <Moon className="w-4 h-4" />
                  Fechamento
                </button>
                <button
                  onClick={() => setChecklistType('limpeza')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all",
                    checklistType === 'limpeza'
                      ? "bg-card shadow-sm text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  <Sparkles className="w-4 h-4" />
                  Limpeza
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
              <div className="bg-card rounded-2xl border p-4">
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

              {/* Settings Component */}
              <ChecklistSettings
                sectors={sectors}
                onAddSector={handleAddSector}
                onUpdateSector={handleUpdateSector}
                onDeleteSector={handleDeleteSector}
                onAddSubcategory={handleAddSubcategory}
                onUpdateSubcategory={handleUpdateSubcategory}
                onDeleteSubcategory={handleDeleteSubcategory}
                onAddItem={handleAddItem}
                onUpdateItem={handleUpdateItem}
                onDeleteItem={handleDeleteItem}
              />
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
