import { useState } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SignaturePad } from '@/components/ui/signature-pad';
import { useMaterialDeliveries, MATERIAL_CATEGORIES } from '@/hooks/useMaterialDeliveries';
import { useEmployees } from '@/hooks/useEmployees';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface MaterialDeliveriesProps {
  employeeId?: string;
  compact?: boolean;
  onRegisterRef?: (fn: () => void) => void;
}

export function MaterialDeliveries({ employeeId, compact = false }: MaterialDeliveriesProps) {
  const { deliveries, isLoading, addDelivery, deleteDelivery } = useMaterialDeliveries(employeeId);
  const { employees } = useEmployees();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);

  // Form state
  const [selectedEmployee, setSelectedEmployee] = useState(employeeId || '');
  const [category, setCategory] = useState('uniforme');
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [signatureData, setSignatureData] = useState<string | null>(null);

  const resetForm = () => {
    if (!employeeId) setSelectedEmployee('');
    setCategory('uniforme');
    setItemName('');
    setQuantity(1);
    setNotes('');
    setSignatureData(null);
  };

  const handleSubmit = async () => {
    if (!selectedEmployee || !itemName.trim()) return;
    await addDelivery.mutateAsync({
      employee_id: selectedEmployee,
      category,
      item_name: itemName.trim(),
      quantity,
      notes: notes.trim() || undefined,
      signature_data_url: signatureData || undefined,
    });
    resetForm();
    setSheetOpen(false);
  };

  const getCategoryInfo = (cat: string) => {
    return MATERIAL_CATEGORIES.find(c => c.value === cat) || MATERIAL_CATEGORIES[4];
  };

  const activeEmployees = employees.filter(e => e.is_active);

  return (
    <div className="space-y-3">
      {/* Header */}
      {!compact && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground">Entregas de Materiais</h2>
            <p className="text-xs text-muted-foreground">Uniformes, EPIs, equipamentos</p>
          </div>
          <Button size="sm" className="gap-1.5 rounded-xl" onClick={() => setSheetOpen(true)}>
            <AppIcon name="Plus" size={14} />
            Registrar
          </Button>
        </div>
      )}

      {compact && (
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Entregas</p>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1 rounded-lg" onClick={() => setSheetOpen(true)}>
            <AppIcon name="Plus" size={12} />
            Nova
          </Button>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <AppIcon name="Loader2" size={20} className="animate-spin text-muted-foreground" />
        </div>
      ) : deliveries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-secondary/50 flex items-center justify-center mb-2">
            <AppIcon name="Package" size={20} className="text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Nenhuma entrega registrada</p>
          <p className="text-xs text-muted-foreground/70 mt-0.5">Registre uniformes, EPIs e equipamentos</p>
        </div>
      ) : (
        <div className="space-y-2">
          {deliveries.map((d) => {
            const catInfo = getCategoryInfo(d.category);
            return (
              <div
                key={d.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border/30 hover:border-border/50 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <AppIcon name={catInfo.icon} size={16} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground truncate">{d.item_name}</p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground shrink-0">
                      {catInfo.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {!employeeId && d.employee && (
                      <span className="text-xs text-muted-foreground">{d.employee.full_name}</span>
                    )}
                    <span className="text-[10px] text-muted-foreground/70">
                      Qtd: {d.quantity} · {format(new Date(d.delivered_at), "dd MMM yyyy", { locale: ptBR })}
                    </span>
                  </div>
                  {d.notes && <p className="text-[11px] text-muted-foreground mt-1">{d.notes}</p>}
                  {d.signature_url && (
                    <button
                      onClick={() => setSignaturePreview(d.signature_url)}
                      className="flex items-center gap-1 text-[10px] text-primary mt-1 hover:underline"
                    >
                      <AppIcon name="PenTool" size={10} />
                      Ver assinatura
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setDeleteId(d.id)}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors shrink-0"
                >
                  <AppIcon name="Trash2" size={14} className="text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* New Delivery Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[96dvh] overflow-y-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle className="text-base">Registrar Entrega</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4 pb-6">
            {!employeeId && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Funcionário</label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeEmployees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Categoria</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MATERIAL_CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>
                      <span className="flex items-center gap-2">
                        <AppIcon name={c.icon} size={14} />
                        {c.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Item</label>
              <Input
                value={itemName}
                onChange={e => setItemName(e.target.value)}
                placeholder="Ex: Camiseta polo P, Luva térmica..."
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Quantidade</label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-9 h-9 p-0 rounded-xl"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <AppIcon name="Minus" size={14} />
                </Button>
                <span className="text-lg font-bold w-10 text-center">{quantity}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-9 h-9 p-0 rounded-xl"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <AppIcon name="Plus" size={14} />
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Observações</label>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Opcional"
                rows={2}
                className="rounded-xl resize-none"
              />
            </div>

            {/* Signature */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <AppIcon name="PenTool" size={12} />
                Assinatura do funcionário
              </label>
              {signatureData ? (
                <div className="space-y-2">
                  <div className="rounded-xl border border-primary/30 bg-primary/5 p-2">
                    <img src={signatureData} alt="Assinatura" className="w-full h-24 object-contain" />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5 rounded-xl"
                    onClick={() => setSignatureData(null)}
                  >
                    <AppIcon name="RefreshCw" size={14} />
                    Refazer assinatura
                  </Button>
                </div>
              ) : (
                <SignaturePad
                  onSave={setSignatureData}
                  onClear={() => setSignatureData(null)}
                  height={160}
                />
              )}
            </div>

            <Button
              className="w-full rounded-xl gap-2"
              disabled={!selectedEmployee || !itemName.trim() || addDelivery.isPending}
              onClick={handleSubmit}
            >
              {addDelivery.isPending ? (
                <AppIcon name="Loader2" size={16} className="animate-spin" />
              ) : (
                <AppIcon name="Check" size={16} />
              )}
              Registrar Entrega
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Signature Preview */}
      <Sheet open={!!signaturePreview} onOpenChange={() => setSignaturePreview(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle className="text-base">Assinatura</SheetTitle>
          </SheetHeader>
          {signaturePreview && (
            <div className="p-4">
              <img src={signaturePreview} alt="Assinatura" className="w-full max-h-60 object-contain rounded-xl border border-border/30" />
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir registro?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) deleteDelivery.mutate(deleteId);
                setDeleteId(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
