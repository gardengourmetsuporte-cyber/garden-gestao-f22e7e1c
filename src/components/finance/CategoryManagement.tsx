import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FinanceCategory } from '@/types/finance';
import { Plus, Pencil, Trash2, Loader2, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getLucideIcon } from '@/lib/icons';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface CategoryManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: FinanceCategory[];
  onRefresh: () => Promise<void>;
}

const ICONS = [
  'ShoppingCart', 'Utensils', 'Car', 'Home', 'Heart', 'Briefcase', 
  'GraduationCap', 'Plane', 'Gift', 'Music', 'Film', 'Gamepad2',
  'Shirt', 'Dumbbell', 'Pill', 'Scissors', 'Wrench', 'Zap',
  'Droplets', 'Flame', 'Phone', 'Wifi', 'CreditCard', 'Wallet'
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
  const [activeType, setActiveType] = useState<'expense' | 'income'>('expense');
  const [isEditing, setIsEditing] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FinanceCategory | null>(null);
  const [parentCategory, setParentCategory] = useState<FinanceCategory | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(ICONS[0]);
  const [color, setColor] = useState(COLORS[0]);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<FinanceCategory | null>(null);
  const [deleteAction, setDeleteAction] = useState<DeleteAction>('remove_category');
  const [transferTargetId, setTransferTargetId] = useState<string>('');
  const [transactionCount, setTransactionCount] = useState(0);

  const filteredCategories = categories.filter(c => c.type === activeType && !c.parent_id);

  // Get all categories for transfer (excluding the one being deleted and its children)
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
    setIsLoading(true);
    
    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('finance_categories')
          .update({ name: name.trim(), icon, color })
          .eq('id', editingCategory.id);
        if (error) throw error;
        toast.success('Categoria atualizada!');
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
            is_system: false
          });
        if (error) throw error;
        toast.success('Categoria criada!');
      }
      await onRefresh();
      resetForm();
    } catch (error) {
      toast.error('Erro ao salvar categoria');
    }
    
    setIsLoading(false);
  };

  const openDeleteDialog = async (category: FinanceCategory) => {
    setIsLoading(true);
    setCategoryToDelete(category);
    
    // Count transactions using this category or its children
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
          // Set category_id to null for all affected transactions
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
          // Transfer transactions to target category
          const { error } = await supabase
            .from('finance_transactions')
            .update({ category_id: transferTargetId })
            .in('category_id', allIds);
          if (error) throw error;
        }
        // force_delete: just proceed to delete the category
      }
      
      // Delete children first (subcategories)
      if (childIds.length > 0) {
        const { error: delChildrenErr } = await supabase
          .from('finance_categories')
          .delete()
          .in('id', childIds);
        if (delChildrenErr) throw delChildrenErr;
      }
      
      // Delete the category itself
      const { error } = await supabase
        .from('finance_categories')
        .delete()
        .eq('id', categoryToDelete.id);
      if (error) throw error;
      
      toast.success('Categoria excluída!');
      await onRefresh();
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao excluir categoria');
    }
    
    setIsLoading(false);
  };

  const IconComponent = getLucideIcon(icon);

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) resetForm(); }}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              {isEditing && (
                <Button variant="ghost" size="icon" onClick={resetForm}>
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              )}
              {isEditing 
                ? (editingCategory ? 'Editar Categoria' : parentCategory ? `Nova Subcategoria de ${parentCategory.name}` : 'Nova Categoria') 
                : 'Gerenciar Categorias'}
            </SheetTitle>
          </SheetHeader>

          {!isEditing ? (
            <div className="space-y-4">
              {/* Type tabs */}
              <Tabs value={activeType} onValueChange={(v) => setActiveType(v as 'expense' | 'income')}>
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="expense">Despesas</TabsTrigger>
                  <TabsTrigger value="income">Receitas</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* List of categories */}
              <div className="space-y-2">
                {filteredCategories.map(category => {
                  const CatIcon = getLucideIcon(category.icon);
                  return (
                    <div key={category.id}>
                      <div className="flex items-center gap-3 p-3 bg-card border rounded-xl">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: category.color + '20' }}
                        >
                          {CatIcon && <CatIcon className="w-5 h-5" style={{ color: category.color }} />}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{category.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {category.subcategories?.length || 0} subcategorias
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleAddSubcategory(category)}>
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(category)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => openDeleteDialog(category)}
                          disabled={isLoading}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                      
                      {/* Subcategories */}
                      {category.subcategories && category.subcategories.length > 0 && (
                        <div className="ml-6 mt-1 space-y-1">
                          {category.subcategories.map(sub => {
                            const SubIcon = getLucideIcon(sub.icon);
                            return (
                              <div 
                                key={sub.id}
                                className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg"
                              >
                                {SubIcon && <SubIcon className="w-4 h-4" style={{ color: sub.color }} />}
                                <span className="flex-1 text-sm">{sub.name}</span>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(sub)}>
                                  <Pencil className="w-3 h-3" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8"
                                  onClick={() => openDeleteDialog(sub)}
                                  disabled={isLoading}
                                >
                                  <Trash2 className="w-3 h-3 text-destructive" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add button */}
              <Button 
                className="w-full h-12" 
                onClick={() => setIsEditing(true)}
              >
                <Plus className="w-5 h-5 mr-2" />
                Nova Categoria
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Alimentação, Transporte..."
                  className="h-12"
                />
              </div>

              {/* Icon */}
              <div className="space-y-2">
                <Label>Ícone</Label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-secondary/30 rounded-lg">
                  {ICONS.map(i => {
                    const Icon = getLucideIcon(i);
                    return (
                      <button
                        key={i}
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
                          icon === i ? "bg-primary text-primary-foreground" : "bg-background hover:bg-secondary"
                        )}
                        onClick={() => setIcon(i)}
                      >
                        {Icon && <Icon className="w-5 h-5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color */}
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

              {/* Preview */}
              <div className="p-4 bg-secondary/30 rounded-lg">
                <Label className="text-xs text-muted-foreground mb-2 block">Prévia</Label>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: color + '20' }}
                  >
                    {IconComponent && <IconComponent className="w-6 h-6" style={{ color }} />}
                  </div>
                  <span className="font-medium">{name || 'Nome da categoria'}</span>
                </div>
              </div>

              {/* Actions */}
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

      {/* Delete Confirmation Dialog */}
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
                <Label>Ação</Label>
                <Select value={deleteAction} onValueChange={(v) => setDeleteAction(v as DeleteAction)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="remove_category">Deixar lançamentos sem categoria</SelectItem>
                    <SelectItem value="transfer">Transferir para outra categoria</SelectItem>
                    <SelectItem value="force_delete">Excluir mesmo assim (sem alteração)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {deleteAction === 'transfer' && (
                <div className="space-y-2">
                  <Label>Transferir para</Label>
                  <Select value={transferTargetId} onValueChange={setTransferTargetId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar categoria..." />
                    </SelectTrigger>
                    <SelectContent>
                      {getTransferOptions().map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
