import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FinanceCategory } from '@/types/finance';
import { Loader2 } from 'lucide-react';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { toast } from 'sonner';
import { SortableList, DragHandle } from '@/components/ui/sortable-list';

interface CategoryManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: FinanceCategory[];
  onRefresh: () => Promise<void>;
}

const ICONS = [
  'ShoppingCart', 'ShoppingBasket', 'Utensils', 'Car', 'Home', 'Heart', 'Briefcase', 
  'GraduationCap', 'Plane', 'Gift', 'Music', 'Film', 'Gamepad2',
  'Shirt', 'Dumbbell', 'Pill', 'Scissors', 'Wrench', 'Zap',
  'Droplets', 'Flame', 'Phone', 'Wifi', 'CreditCard', 'Wallet',
  'Store', 'Building2', 'Truck', 'Receipt', 'Landmark', 'Users', 'TrendingUp', 'FileText'
];

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899'
];

type DeleteAction = 'remove_category' | 'transfer' | 'force_delete';

export function CategoryManagement({
  open,
  onOpenChange,
  categories,
  onRefresh
}: CategoryManagementProps) {
  const { user } = useAuth();
  const { activeUnitId } = useUnit();
  const [activeType, setActiveType] = useState<'expense' | 'income'>('expense');
  const [isEditing, setIsEditing] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FinanceCategory | null>(null);
  const [parentCategory, setParentCategory] = useState<FinanceCategory | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(ICONS[0]);
  const [color, setColor] = useState(COLORS[0]);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<FinanceCategory | null>(null);
  const [deleteAction, setDeleteAction] = useState<DeleteAction>('remove_category');
  const [transferTargetId, setTransferTargetId] = useState<string>('');
  const [transactionCount, setTransactionCount] = useState(0);

  const filteredCategories = categories.filter(c => c.type === activeType && !c.parent_id);

  const getTransferOptions = () => {
    if (!categoryToDelete) return [];
    const allCats = categories.flatMap(c => [c, ...(c.subcategories || [])]);
    const childIds = (categoryToDelete.subcategories || []).map(s => s.id);
    return allCats.filter(c => 
      c.id !== categoryToDelete.id && 
      !childIds.includes(c.id) &&
      c.type === categoryToDelete.type
    );
  };

  const resetForm = () => {
    setName('');
    setIcon(ICONS[0]);
    setColor(COLORS[0]);
    setEditingCategory(null);
    setParentCategory(null);
    setIsEditing(false);
  };

  const handleEdit = (category: FinanceCategory) => {
    setEditingCategory(category);
    setName(category.name);
    setIcon(category.icon);
    setColor(category.color);
    setIsEditing(true);
  };

  const handleAddSubcategory = (parent: FinanceCategory) => {
    setParentCategory(parent);
    setColor(parent.color);
    setIcon(parent.icon);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !user) return;
    if (!activeUnitId) {
      toast.error('Nenhuma unidade ativa selecionada');
      return;
    }
    setIsLoading(true);
    
    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('finance_categories')
          .update({ name: name.trim(), icon, color })
          .eq('id', editingCategory.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('finance_categories')
          .insert({
            user_id: user.id,
            name: name.trim(),
            type: activeType,
            icon,
            color,
            parent_id: parentCategory?.id || null,
            is_system: false,
            unit_id: activeUnitId
          });
        if (error) throw error;
      }
      await onRefresh();
      resetForm();
      toast.success('Categoria salva!');
    } catch (error: any) {
      console.error('Erro ao salvar categoria:', error);
      toast.error('Erro ao salvar categoria: ' + (error?.message || ''));
    }
    
    setIsLoading(false);
  };

  const openDeleteDialog = async (category: FinanceCategory) => {
    setIsLoading(true);
    setCategoryToDelete(category);
    
    const childIds = (category.subcategories || []).map(s => s.id);
    const allIds = [category.id, ...childIds];
    
    const { count, error } = await supabase
      .from('finance_transactions')
      .select('id', { count: 'exact', head: true })
      .in('category_id', allIds);
    
    if (error) {
      toast.error('Erro ao verificar lançamentos');
      setIsLoading(false);
      return;
    }
    
    setTransactionCount(count || 0);
    setDeleteAction('remove_category');
    setTransferTargetId('');
    setDeleteDialogOpen(true);
    setIsLoading(false);
  };

  const executeDelete = async () => {
    if (!categoryToDelete) return;
    setIsLoading(true);
    
    try {
      const childIds = (categoryToDelete.subcategories || []).map(s => s.id);
      const allIds = [categoryToDelete.id, ...childIds];
      
      if (transactionCount > 0) {
        if (deleteAction === 'remove_category') {
          const { error } = await supabase
            .from('finance_transactions')
            .update({ category_id: null })
            .in('category_id', allIds);
          if (error) throw error;
        } else if (deleteAction === 'transfer') {
          if (!transferTargetId) {
            toast.error('Selecione uma categoria de destino');
            setIsLoading(false);
            return;
          }
          const { error } = await supabase
            .from('finance_transactions')
            .update({ category_id: transferTargetId })
            .in('category_id', allIds);
          if (error) throw error;
        }
      }
      
      if (childIds.length > 0) {
        const { error: delChildrenErr } = await supabase
          .from('finance_categories')
          .delete()
          .in('id', childIds);
        if (delChildrenErr) throw delChildrenErr;
      }
      
      const { error } = await supabase
        .from('finance_categories')
        .delete()
        .eq('id', categoryToDelete.id);
      if (error) throw error;
      await onRefresh();
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao excluir categoria');
    }
    
    setIsLoading(false);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) resetForm(); }}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              {isEditing && (
                <Button variant="ghost" size="icon" onClick={resetForm}>
                  <AppIcon name="ArrowLeft" size={20} />
                </Button>
              )}
              {isEditing 
                ? (editingCategory ? 'Editar Categoria' : parentCategory ? `Nova Subcategoria de ${parentCategory.name}` : 'Nova Categoria') 
                : 'Gerenciar Categorias'}
            </SheetTitle>
          </SheetHeader>

          {!isEditing ? (
            <div className="space-y-4">
              <Tabs value={activeType} onValueChange={(v) => setActiveType(v as 'expense' | 'income')}>
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="expense">Despesas</TabsTrigger>
                  <TabsTrigger value="income">Receitas</TabsTrigger>
                </TabsList>
              </Tabs>

              <SortableList
                items={filteredCategories}
                getItemId={(cat) => cat.id}
                onReorder={async (reordered) => {
                  const promises = reordered.map((cat, index) =>
                    supabase
                      .from('finance_categories')
                      .update({ sort_order: index })
                      .eq('id', cat.id)
                  );
                  await Promise.all(promises);
                  await onRefresh();
                }}
                className="space-y-2"
                renderItem={(category, { isDragging, dragHandleProps }) => {
                  return (
                    <div key={category.id}>
                      <div className={cn(
                        "flex items-center gap-3 p-3 bg-card border rounded-xl transition-all",
                        isDragging && "shadow-lg ring-2 ring-primary/30"
                      )}>
                        <DragHandle dragHandleProps={dragHandleProps} />
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: category.color + '20' }}
                        >
                          <AppIcon name={category.icon} size={20} style={{ color: category.color }} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{category.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {category.subcategories?.length || 0} subcategorias
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleAddSubcategory(category)}>
                          <AppIcon name="Plus" size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(category)}>
                          <AppIcon name="Pencil" size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => openDeleteDialog(category)}
                          disabled={isLoading}
                        >
                          <AppIcon name="Trash2" size={16} className="text-destructive" />
                        </Button>
                      </div>
                      
                      {category.subcategories && category.subcategories.length > 0 && (
                        <div className="ml-6 mt-1 space-y-1">
                          {category.subcategories.map(sub => (
                            <div 
                              key={sub.id}
                              className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg"
                            >
                              <AppIcon name={sub.icon} size={16} style={{ color: sub.color }} />
                              <span className="flex-1 text-sm">{sub.name}</span>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(sub)}>
                                <AppIcon name="Pencil" size={12} />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => openDeleteDialog(sub)}
                                disabled={isLoading}
                              >
                                <AppIcon name="Trash2" size={12} className="text-destructive" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }}
              />

              <Button className="w-full h-12" onClick={() => setIsEditing(true)}>
                <AppIcon name="Plus" size={20} className="mr-2" />
                Nova Categoria
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Alimentação, Transporte..."
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label>Ícone</Label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-secondary/30 rounded-lg">
                  {ICONS.map(i => (
                    <button
                      key={i}
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
                        icon === i ? "bg-primary text-primary-foreground" : "bg-background hover:bg-secondary"
                      )}
                      onClick={() => setIcon(i)}
                    >
                      <AppIcon name={i} size={20} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Cor</Label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      className={cn(
                        "w-8 h-8 rounded-full transition-transform",
                        color === c && "ring-2 ring-offset-2 ring-primary scale-110"
                      )}
                      style={{ backgroundColor: c }}
                      onClick={() => setColor(c)}
                    />
                  ))}
                </div>
              </div>

              <div className="p-4 bg-secondary/30 rounded-lg">
                <Label className="text-xs text-muted-foreground mb-2 block">Prévia</Label>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: color + '20' }}
                  >
                    <AppIcon name={icon} size={24} style={{ color }} />
                  </div>
                  <span className="font-medium">{name || 'Nome da categoria'}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1 h-12" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button 
                  className="flex-1 h-12" 
                  onClick={handleSave}
                  disabled={isLoading || !name.trim()}
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar'}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Categoria</DialogTitle>
            <DialogDescription>
              {transactionCount > 0 ? (
                <>
                  <span className="text-destructive font-medium">{transactionCount} lançamento(s)</span> usa(m) essa categoria.
                  <br />O que deseja fazer?
                </>
              ) : (
                <>Tem certeza que deseja excluir "{categoryToDelete?.name}"?</>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {transactionCount > 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                {(['remove_category', 'transfer', 'force_delete'] as DeleteAction[]).map(action => (
                  <label key={action} className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    deleteAction === action ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/50"
                  )}>
                    <input
                      type="radio"
                      name="deleteAction"
                      value={action}
                      checked={deleteAction === action}
                      onChange={() => setDeleteAction(action)}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium text-sm">
                        {action === 'remove_category' && 'Remover categoria dos lançamentos'}
                        {action === 'transfer' && 'Transferir para outra categoria'}
                        {action === 'force_delete' && 'Excluir tudo (categoria + lançamentos)'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {action === 'remove_category' && 'Os lançamentos ficam sem categoria'}
                        {action === 'transfer' && 'Mover os lançamentos para outra categoria'}
                        {action === 'force_delete' && 'Remove a categoria e apaga os lançamentos vinculados'}
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              {deleteAction === 'transfer' && (
                <Select value={transferTargetId} onValueChange={setTransferTargetId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar categoria destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {getTransferOptions().map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={executeDelete}
              disabled={isLoading || (deleteAction === 'transfer' && !transferTargetId)}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
