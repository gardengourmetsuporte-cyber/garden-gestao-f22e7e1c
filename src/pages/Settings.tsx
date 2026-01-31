import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useCategories } from '@/hooks/useCategories';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Plus, Trash2, Edit2, Tag, Users, Shield, Truck, Phone, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { Supplier } from '@/types/database';

const colorOptions = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', 
  '#22c55e', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6',
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
];

export default function SettingsPage() {
  const { profile, role, isAdmin } = useAuth();
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories();
  const { suppliers, addSupplier, updateSupplier, deleteSupplier } = useSuppliers();
  
  // Category state
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string; color: string } | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#6366f1');

  // Supplier state
  const [supplierSheetOpen, setSupplierSheetOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');

  // Category handlers
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
      resetCategoryForm();
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
    resetCategoryForm();
    setCategorySheetOpen(true);
  };

  const resetCategoryForm = () => {
    setEditingCategory(null);
    setNewCategoryName('');
    setNewCategoryColor('#6366f1');
  };

  // Supplier handlers
  const handleSaveSupplier = async () => {
    if (!supplierName.trim()) return;

    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, { 
          name: supplierName.trim(), 
          phone: supplierPhone.trim() || null,
          email: supplierEmail.trim() || null,
        });
        toast.success('Fornecedor atualizado!');
      } else {
        await addSupplier({ 
          name: supplierName.trim(), 
          phone: supplierPhone.trim() || undefined,
          email: supplierEmail.trim() || undefined,
        });
        toast.success('Fornecedor criado!');
      }
      setSupplierSheetOpen(false);
      resetSupplierForm();
    } catch (error: any) {
      toast.error('Erro ao salvar fornecedor');
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    try {
      await deleteSupplier(id);
      toast.success('Fornecedor excluído!');
    } catch (error) {
      toast.error('Erro ao excluir fornecedor');
    }
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setSupplierName(supplier.name);
    setSupplierPhone(supplier.phone || '');
    setSupplierEmail(supplier.email || '');
    setSupplierSheetOpen(true);
  };

  const handleAddSupplier = () => {
    resetSupplierForm();
    setSupplierSheetOpen(true);
  };

  const resetSupplierForm = () => {
    setEditingSupplier(null);
    setSupplierName('');
    setSupplierPhone('');
    setSupplierEmail('');
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
              {categories.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma categoria cadastrada
                </p>
              )}
            </div>
          </div>

          {/* Suppliers Management */}
          <div className="bg-card rounded-2xl border p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Truck className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-foreground">Fornecedores</h2>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddSupplier}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Novo
              </Button>
            </div>

            <div className="space-y-2">
              {suppliers.map((supplier) => (
                <div
                  key={supplier.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-secondary/50"
                >
                  <div className="flex-1">
                    <span className="font-medium block">{supplier.name}</span>
                    {supplier.phone && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Phone className="w-3 h-3" />
                        {supplier.phone}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditSupplier(supplier)}
                      className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSupplier(supplier.id)}
                      className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {suppliers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum fornecedor cadastrado
                </p>
              )}
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

        {/* Supplier Form Sheet */}
        <Sheet open={supplierSheetOpen} onOpenChange={setSupplierSheetOpen}>
          <SheetContent side="bottom" className="rounded-t-3xl px-4 pb-8">
            <SheetHeader className="pb-4">
              <SheetTitle>
                {editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
              </SheetTitle>
            </SheetHeader>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label>Nome do Fornecedor *</Label>
                <Input
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="Ex: Distribuidora ABC"
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Telefone/WhatsApp
                </Label>
                <Input
                  value={supplierPhone}
                  onChange={(e) => setSupplierPhone(e.target.value)}
                  placeholder="Ex: 11999999999"
                  className="h-12"
                />
                <p className="text-xs text-muted-foreground">
                  Usado para enviar pedidos via WhatsApp
                </p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  E-mail
                </Label>
                <Input
                  type="email"
                  value={supplierEmail}
                  onChange={(e) => setSupplierEmail(e.target.value)}
                  placeholder="Ex: contato@fornecedor.com"
                  className="h-12"
                />
              </div>

              <Button
                onClick={handleSaveSupplier}
                disabled={!supplierName.trim()}
                className="w-full h-12"
              >
                {editingSupplier ? 'Salvar' : 'Criar Fornecedor'}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </AppLayout>
  );
}
