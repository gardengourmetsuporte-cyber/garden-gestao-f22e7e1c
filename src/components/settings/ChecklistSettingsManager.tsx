import { useChecklists } from '@/hooks/useChecklists';
import { ChecklistSettings } from '@/components/checklists/ChecklistSettings';
import { Loader2, ClipboardCheck } from 'lucide-react';
import { toast } from 'sonner';

export function ChecklistSettingsManager() {
  const {
    sectors,
    isLoading,
    addSector,
    updateSector,
    deleteSector,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory,
    addItem,
    updateItem,
    deleteItem,
  } = useChecklists();

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

  const handleAddItem = async (data: { subcategory_id: string; name: string; description?: string }) => {
    try {
      await addItem(data);
      toast.success('Item criado!');
    } catch (error) {
      toast.error('Erro ao criar item');
      throw error;
    }
  };

  const handleUpdateItem = async (id: string, data: { name?: string; description?: string; is_active?: boolean }) => {
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
      toast.success('Item excluído!');
    } catch (error) {
      toast.error('Erro ao excluir item');
      throw error;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <ClipboardCheck className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Configurar Checklists</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Configure os setores, subcategorias e itens de verificação para os checklists diários.
      </p>
      
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
    </div>
  );
}
