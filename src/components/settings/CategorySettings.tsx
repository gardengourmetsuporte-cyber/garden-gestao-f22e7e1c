import { useState } from 'react';
import { useCategories } from '@/hooks/useCategories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Plus, Trash2, Edit2, Tag } from 'lucide-react';
import { toast } from 'sonner';

const colorOptions = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', 
  '#22c55e', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6',
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
];

export function CategorySettings() {
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string; color: string } | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');

  const handleSave = async () => {
    if (!name.trim()) return;

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, { name: name.trim(), color });
      } else {
        await addCategory(name.trim(), color, 'Package');
      }
      setSheetOpen(false);
      resetForm();
    } catch (error: any) {
      if (error.message?.includes('duplicate')) {
        toast.error('Já existe uma categoria com esse nome');
      } else {
        toast.error('Erro ao salvar categoria');
      }
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCategory(id);
    } catch (error) {
      toast.error('Erro ao excluir categoria');
    }
  };

  const handleEdit = (category: { id: string; name: string; color: string }) => {
    setEditingCategory(category);
    setName(category.name);
    setColor(category.color);
    setSheetOpen(true);
  };

  const handleAdd = () => {
    resetForm();
    setSheetOpen(true);
  };

  const resetForm = () => {
    setEditingCategory(null);
    setName('');
    setColor('#6366f1');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Tag className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Categorias de Estoque</h3>
        </div>
        <Button variant="outline" size="sm" onClick={handleAdd} className="gap-2">
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
                onClick={() => handleEdit(category)}
                className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(category.id)}
                className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma categoria cadastrada
          </p>
        )}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
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
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Carnes"
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="grid grid-cols-5 gap-2">
                {colorOptions.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-full aspect-square rounded-xl transition-all ${
                      color === c ? 'ring-2 ring-primary ring-offset-2' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={!name.trim()}
              className="w-full h-12"
            >
              {editingCategory ? 'Salvar' : 'Criar Categoria'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
