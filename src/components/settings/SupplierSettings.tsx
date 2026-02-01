import { useState } from 'react';
import { useSuppliers } from '@/hooks/useSuppliers';
import { Supplier } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Plus, Trash2, Edit2, Truck, Phone, Mail, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

// Utility functions for WhatsApp validation
const formatPhoneForWhatsApp = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (!cleaned.startsWith('55')) {
    return `55${cleaned}`;
  }
  return cleaned;
};

const hasValidWhatsApp = (phone: string | null): boolean => {
  if (!phone) return false;
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10;
};

export function SupplierSettings() {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier } = useSuppliers();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const handleSave = async () => {
    if (!name.trim()) return;

    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, {
          name: name.trim(),
          phone: phone.trim() || null,
          email: email.trim() || null,
        });
        toast.success('Fornecedor atualizado!');
      } else {
        await addSupplier({
          name: name.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
        });
        toast.success('Fornecedor criado!');
      }
      setSheetOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error('Erro ao salvar fornecedor');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSupplier(id);
      toast.success('Fornecedor excluído!');
    } catch (error) {
      toast.error('Erro ao excluir fornecedor');
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setName(supplier.name);
    setPhone(supplier.phone || '');
    setEmail(supplier.email || '');
    setSheetOpen(true);
  };

  const handleAdd = () => {
    resetForm();
    setSheetOpen(true);
  };

  const resetForm = () => {
    setEditingSupplier(null);
    setName('');
    setPhone('');
    setEmail('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Truck className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Fornecedores</h3>
        </div>
        <Button variant="outline" size="sm" onClick={handleAdd} className="gap-2">
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
              <div className="flex items-center gap-2">
                <span className="font-medium">{supplier.name}</span>
                {!hasValidWhatsApp(supplier.phone) && (
                  <span className="text-xs text-amber-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Sem WhatsApp
                  </span>
                )}
              </div>
              {supplier.phone && (
                <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Phone className="w-3 h-3" />
                  {supplier.phone}
                  {hasValidWhatsApp(supplier.phone) && (
                    <span className="text-green-500 ml-1">✓ WhatsApp</span>
                  )}
                </span>
              )}
              {supplier.email && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {supplier.email}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleEdit(supplier)}
                className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(supplier.id)}
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

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
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
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex: 11999999999"
                className="h-12"
              />
              <p className="text-xs text-muted-foreground">
                Formato: DDD + número (usado para enviar pedidos via WhatsApp)
              </p>
              {phone && !hasValidWhatsApp(phone) && (
                <p className="text-xs text-amber-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Número inválido para WhatsApp (mínimo 10 dígitos)
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                E-mail
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: contato@fornecedor.com"
                className="h-12"
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={!name.trim()}
              className="w-full h-12"
            >
              {editingSupplier ? 'Salvar' : 'Criar Fornecedor'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
