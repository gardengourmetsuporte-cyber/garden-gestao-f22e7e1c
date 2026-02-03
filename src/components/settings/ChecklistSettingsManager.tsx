import { useState } from 'react';
import { useChecklists } from '@/hooks/useChecklists';
import { ChecklistSettings } from '@/components/checklists/ChecklistSettings';
import { ChecklistTrash } from '@/components/checklists/ChecklistTrash';
import { Loader2, ClipboardCheck, Sun, Moon } from 'lucide-react';
import { toast } from 'sonner';
import { ChecklistType } from '@/types/database';
import { cn } from '@/lib/utils';

export function ChecklistSettingsManager() {
  const {
    sectors,
    isLoading,
    addSector,
    updateSector,
    deleteSector,
    reorderSectors,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory,
    reorderSubcategories,
    addItem,
    updateItem,
    deleteItem,
    restoreItem,
    permanentDeleteItem,
    fetchDeletedItems,
    emptyTrash,
    reorderItems,
  } = useChecklists();

  const [selectedType, setSelectedType] = useState<ChecklistType>('abertura');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const handleAddSector = async (data: { name: string; color: string }) => {
    try {
      await addSector(data);
      toast.success('Setor criado!');
    } catch (error) {
      toast.error('Erro ao criar setor');
      throw error;
    }
  };

  const handleUpdateSector = async (id: string, data: { name?: string; color?: string }) => {
    try {
      await updateSector(id, data);
      toast.success('Setor atualizado!');
    } catch (error) {
      toast.error('Erro ao atualizar setor');
      throw error;
    }
  };

  const handleDeleteSector = async (id: string) => {
    try {
      await deleteSector(id);
      toast.success('Setor excluído!');
    } catch (error) {
      toast.error('Erro ao excluir setor');
      throw error;
    }
  };

  const handleAddSubcategory = async (data: { sector_id: string; name: string }) => {
    try {
      await addSubcategory(data);
      toast.success('Subcategoria criada!');
    } catch (error) {
      toast.error('Erro ao criar subcategoria');
      throw error;
    }
  };

  const handleUpdateSubcategory = async (id: string, data: { name?: string }) => {
    try {
      await updateSubcategory(id, data);
      toast.success('Subcategoria atualizada!');
    } catch (error) {
      toast.error('Erro ao atualizar subcategoria');
      throw error;
    }
  };

  const handleDeleteSubcategory = async (id: string) => {
    try {
      await deleteSubcategory(id);
      toast.success('Subcategoria excluída!');
    } catch (error) {
      toast.error('Erro ao excluir subcategoria');
      throw error;
    }
  };

  const handleAddItem = async (data: { subcategory_id: string; name: string; description?: string; frequency?: 'daily' | 'weekly' | 'monthly'; checklist_type?: ChecklistType }) => {
    try {
      // Auto-assign selected type when adding new item
      await addItem({ ...data, checklist_type: data.checklist_type || selectedType });
      toast.success('Item criado!');
    } catch (error) {
      toast.error('Erro ao criar item');
      throw error;
    }
  };

  const handleUpdateItem = async (id: string, data: { name?: string; description?: string; is_active?: boolean; frequency?: 'daily' | 'weekly' | 'monthly'; checklist_type?: 'abertura' | 'fechamento' }) => {
    try {
      await updateItem(id, data);
      toast.success('Item atualizado!');
    } catch (error) {
      toast.error('Erro ao atualizar item');
      throw error;
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await deleteItem(id);
      toast.success('Item movido para lixeira!');
    } catch (error) {
      toast.error('Erro ao excluir item');
      throw error;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <ClipboardCheck className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Configurar Checklists</h3>
        </div>
        <ChecklistTrash
          fetchDeletedItems={fetchDeletedItems}
          onRestore={restoreItem}
          onPermanentDelete={permanentDeleteItem}
          onEmptyTrash={emptyTrash}
        />
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Configure os setores, subcategorias e itens de verificação para os checklists diários.
      </p>

      {/* Type Selector */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setSelectedType('abertura')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all",
            selectedType === 'abertura' 
              ? "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400" 
              : "border-border bg-card text-muted-foreground hover:bg-secondary/50"
          )}
        >
          <Sun className="w-5 h-5" />
          <span className="font-semibold">Abertura</span>
        </button>
        <button
          onClick={() => setSelectedType('fechamento')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all",
            selectedType === 'fechamento' 
              ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400" 
              : "border-border bg-card text-muted-foreground hover:bg-secondary/50"
          )}
        >
          <Moon className="w-5 h-5" />
          <span className="font-semibold">Fechamento</span>
        </button>
      </div>
      
      <ChecklistSettings
        sectors={sectors}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
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
    </div>
  );
}
