import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useCategories } from '@/hooks/useCategories';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Plus, Trash2, Edit2, Tag, Users, Shield } from 'lucide-react';
import { toast } from 'sonner';

const colorOptions = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', 
  '#22c55e', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6',
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
];

export default function SettingsPage() {
  const { profile, role, isAdmin } = useAuth();
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories();
  
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string; color: string } | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#6366f1');

  const handleSaveCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, { 
          name: newCategoryName.trim(), 
          color: newCategoryColor 
        });
        toast.success('Categoria atualizada!');
      } else {
        await addCategory(newCategoryName.trim(), newCategoryColor, 'Package');
        toast.success('Categoria criada!');
      }
      setCategorySheetOpen(false);
      resetForm();
    } catch (error: any) {
      if (error.message?.includes('duplicate')) {
        toast.error('Já existe uma categoria com esse nome');
      } else {
        toast.error('Erro ao salvar categoria');
      }
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteCategory(id);
      toast.success('Categoria excluída!');
    } catch (error) {
      toast.error('Erro ao excluir categoria');
    }
  };

  const handleEditCategory = (category: { id: string; name: string; color: string }) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setNewCategoryColor(category.color);
    setCategorySheetOpen(true);
  };

  const handleAddCategory = () => {
    resetForm();
    setCategorySheetOpen(true);
  };

  const resetForm = () => {
    setEditingCategory(null);
    setNewCategoryName('');
    setNewCategoryColor('#6366f1');
  };

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground">Acesso Restrito</h2>
            <p className="text-muted-foreground mt-2">
              Apenas administradores podem acessar as configurações.
            </p>
          </div>
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
            <h1 className="text-xl font-bold text-foreground">Configurações</h1>
            <p className="text-sm text-muted-foreground">Gerencie o sistema</p>
          </div>
        </header>

        <div className="px-4 py-6 lg:px-6 space-y-6">
          {/* Profile Info */}
          <div className="bg-card rounded-2xl border p-4">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-foreground">Seu Perfil</h2>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nome:</span>
                <span className="font-medium">{profile?.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Função:</span>
                <span className="font-medium capitalize">{role}</span>
              </div>
            </div>
          </div>

          {/* Categories Management */}
          <div className="bg-card rounded-2xl border p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Tag className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-foreground">Categorias</h2>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddCategory}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Nova
              </Button>
            </div>

            <div className="space-y-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-secondary/50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditCategory(category)}
                      className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category Form Sheet */}
        <Sheet open={categorySheetOpen} onOpenChange={setCategorySheetOpen}>
          <SheetContent side="bottom" className="rounded-t-3xl px-4 pb-8">
            <SheetHeader className="pb-4">
              <SheetTitle>
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </SheetTitle>
            </SheetHeader>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label>Nome da Categoria</Label>
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Ex: Carnes"
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label>Cor</Label>
                <div className="grid grid-cols-5 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewCategoryColor(color)}
                      className={`w-full aspect-square rounded-xl transition-all ${
                        newCategoryColor === color
                          ? 'ring-2 ring-primary ring-offset-2'
                          : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <Button
                onClick={handleSaveCategory}
                disabled={!newCategoryName.trim()}
                className="w-full h-12"
              >
                {editingCategory ? 'Salvar' : 'Criar Categoria'}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </AppLayout>
  );
}
