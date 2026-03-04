import { useState, useEffect, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Employee, EmployeePayment } from '@/types/employee';
import { AppIcon } from '@/components/ui/app-icon';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PayslipSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  editingPayment?: EmployeePayment | null;
  onSave: (data: any) => Promise<void>;
  onUpdate?: (data: any) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export function PayslipSheet({ open, onOpenChange, employee, editingPayment, onSave, onUpdate, onDelete }: PayslipSheetProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [payslipType, setPayslipType] = useState<'salary' | 'vale'>('salary');
  const [paymentDate, setPaymentDate] = useState('');
  const [amount, setAmount] = useState('');
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      if (editingPayment) {
        setPayslipType(editingPayment.type === 'vale' ? 'vale' : 'salary');
        setPaymentDate(editingPayment.payment_date || '');
        setAmount(String(editingPayment.amount || ''));
        setReceiptUrl(editingPayment.receipt_url || null);
        setPreviewUrl(editingPayment.receipt_url || null);
      } else {
        setPayslipType('salary');
        // Default day 5 for salary
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        setPaymentDate(`${y}-${m}-05`);
        setAmount(employee?.base_salary ? String(employee.base_salary) : '');
        setReceiptUrl(null);
        setPreviewUrl(null);
      }
    }
  }, [open, editingPayment, employee]);

  // Update default date when type changes
  const handleTypeChange = (type: 'salary' | 'vale') => {
    setPayslipType(type);
    if (!editingPayment) {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const day = type === 'vale' ? '20' : '05';
      setPaymentDate(`${y}-${m}-${day}`);
      setAmount(type === 'vale' ? '' : (employee?.base_salary ? String(employee.base_salary) : ''));
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !employee) return;

    const reader = new FileReader();
    reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `payslips/${employee.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('cash-receipts')
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('cash-receipts').getPublicUrl(path);
      setReceiptUrl(urlData.publicUrl);
      toast.success('Foto enviada!');
    } catch {
      toast.error('Erro ao enviar foto');
      setPreviewUrl(receiptUrl);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!employee || !amount || !paymentDate) return;
    setIsLoading(true);
    try {
      const now = new Date(paymentDate + 'T12:00:00');
      const data = {
        employee_id: employee.id,
        type: payslipType as any,
        reference_month: now.getMonth() + 1,
        reference_year: now.getFullYear(),
        payment_date: paymentDate,
        amount: parseFloat(amount) || 0,
        net_salary: payslipType === 'salary' ? (parseFloat(amount) || 0) : undefined,
        receipt_url: receiptUrl,
        is_paid: false,
      };
      if (editingPayment && onUpdate) {
        await onUpdate({ id: editingPayment.id, ...data });
      } else {
        await onSave(data);
      }
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!editingPayment || !onDelete) return;
    setIsLoading(true);
    await onDelete(editingPayment.id);
    setIsLoading(false);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-2xl overflow-y-auto">
        <SheetHeader className="pb-2">
          <SheetTitle className="flex items-center gap-2">
            <AppIcon name="FileText" size={20} className="text-primary" />
            {editingPayment ? 'Editar Lançamento' : 'Novo Lançamento'}
          </SheetTitle>
          {employee && <p className="text-sm text-muted-foreground">{employee.full_name}</p>}
        </SheetHeader>

        <div className="space-y-5 pb-6 pt-2">
          {/* Tipo */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleTypeChange('salary')}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                payslipType === 'salary'
                  ? 'bg-primary/10 border-primary/30 text-primary font-semibold'
                  : 'bg-card border-border hover:border-primary/20 text-muted-foreground'
              }`}
            >
              <AppIcon name="Banknote" size={18} />
              <span className="text-sm">Salário (dia 5)</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('vale')}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                payslipType === 'vale'
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 font-semibold'
                  : 'bg-card border-border hover:border-primary/20 text-muted-foreground'
              }`}
            >
              <AppIcon name="HandCoins" size={18} />
              <span className="text-sm">Vale (dia 20)</span>
            </button>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Data do Pagamento</Label>
            <Input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="h-12"
            />
          </div>

          {/* Valor */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Valor (R$)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              className="h-14 text-xl font-bold text-center"
            />
          </div>

          {/* Foto */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Foto do Holerite</Label>
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />

            {previewUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-border/40">
                <img src={previewUrl} alt="Holerite" className="w-full max-h-56 object-contain bg-muted/30" />
                <div className="absolute bottom-2 right-2 flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    <AppIcon name="Camera" size={14} className="mr-1" /> Trocar
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => { setPreviewUrl(null); setReceiptUrl(null); }}>
                    <AppIcon name="Trash2" size={14} />
                  </Button>
                </div>
                {uploading && (
                  <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                    <AppIcon name="progress_activity" size={24} className="animate-spin text-primary" />
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full h-28 rounded-xl border-2 border-dashed border-primary/20 hover:border-primary/40 bg-primary/5 hover:bg-primary/10 transition-all flex flex-col items-center justify-center gap-2 text-muted-foreground"
              >
                {uploading ? (
                  <AppIcon name="progress_activity" size={28} className="animate-spin" />
                ) : (
                  <>
                    <AppIcon name="Camera" size={28} className="text-primary/60" />
                    <span className="text-sm">Tirar foto ou anexar</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {editingPayment && onDelete && (
              <Button variant="destructive" size="lg" onClick={handleDelete} disabled={isLoading}>
                <AppIcon name="Trash2" size={16} />
              </Button>
            )}
            <Button className="flex-1" size="lg" onClick={handleSave} disabled={isLoading || !employee || !amount || !paymentDate}>
              {isLoading ? (
                <><AppIcon name="progress_activity" size={16} className="mr-2 animate-spin" />Salvando...</>
              ) : (
                editingPayment ? 'Salvar' : (payslipType === 'vale' ? 'Criar Vale' : 'Criar Holerite')
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
