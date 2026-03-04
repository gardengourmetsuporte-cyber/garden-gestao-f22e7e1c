import { useState, useEffect, useRef } from 'react';
import { formatCurrency } from '@/lib/format';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Employee, EmployeePayment, MONTHS } from '@/types/employee';
import { format } from 'date-fns';
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
  const [referenceMonth, setReferenceMonth] = useState(new Date().getMonth() + 1);
  const [referenceYear, setReferenceYear] = useState(new Date().getFullYear());
  const [amount, setAmount] = useState('');
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      if (editingPayment) {
        setReferenceMonth(editingPayment.reference_month);
        setReferenceYear(editingPayment.reference_year);
        setAmount(String(editingPayment.amount || ''));
        setReceiptUrl(editingPayment.receipt_url || null);
        setPreviewUrl(editingPayment.receipt_url || null);
      } else {
        setReferenceMonth(new Date().getMonth() + 1);
        setReferenceYear(new Date().getFullYear());
        setAmount(employee?.base_salary ? String(employee.base_salary) : '');
        setReceiptUrl(null);
        setPreviewUrl(null);
      }
    }
  }, [open, editingPayment, employee]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !employee) return;

    // Preview
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

      const { data: urlData } = supabase.storage
        .from('cash-receipts')
        .getPublicUrl(path);

      setReceiptUrl(urlData.publicUrl);
      toast.success('Foto enviada!');
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Erro ao enviar foto');
      setPreviewUrl(receiptUrl);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!employee || !amount) return;
    setIsLoading(true);
    try {
      const parsedAmount = parseFloat(amount) || 0;
      const paymentDate = format(new Date(), 'yyyy-MM-dd');

      const data = {
        employee_id: employee.id,
        type: 'salary' as const,
        reference_month: referenceMonth,
        reference_year: referenceYear,
        payment_date: paymentDate,
        amount: parsedAmount,
        net_salary: parsedAmount,
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

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[85vh] rounded-t-2xl overflow-y-auto">
        <SheetHeader className="pb-2">
          <SheetTitle className="flex items-center gap-2">
            <AppIcon name="FileText" size={20} className="text-primary" />
            {editingPayment ? 'Editar Holerite' : 'Novo Holerite'}
          </SheetTitle>
          {employee && (
            <p className="text-sm text-muted-foreground">{employee.full_name}</p>
          )}
        </SheetHeader>

        <div className="space-y-5 pb-6 pt-2">
          {/* Mês / Ano */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Mês</Label>
              <Select value={String(referenceMonth)} onValueChange={(v) => setReferenceMonth(parseInt(v))}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month, i) => (
                    <SelectItem key={i} value={String(i + 1)}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Ano</Label>
              <Select value={String(referenceYear)} onValueChange={(v) => setReferenceYear(parseInt(v))}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Valor Final */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Valor Líquido (R$)</Label>
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

          {/* Foto do Holerite */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Foto do Holerite</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoUpload}
            />

            {previewUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-border/40">
                <img
                  src={previewUrl}
                  alt="Holerite"
                  className="w-full max-h-64 object-contain bg-black/20"
                />
                <div className="absolute bottom-2 right-2 flex gap-2">
                  <Button
                    variant="glass"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <AppIcon name="Camera" size={14} className="mr-1" />
                    Trocar
                  </Button>
                  <Button
                    variant="glass"
                    size="sm"
                    onClick={() => { setPreviewUrl(null); setReceiptUrl(null); }}
                  >
                    <AppIcon name="Trash2" size={14} />
                  </Button>
                </div>
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <AppIcon name="progress_activity" size={24} className="animate-spin text-white" />
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full h-32 rounded-xl border-2 border-dashed border-primary/20 hover:border-primary/40 bg-primary/5 hover:bg-primary/10 transition-all flex flex-col items-center justify-center gap-2 text-muted-foreground"
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
            <Button
              className="flex-1"
              size="lg"
              onClick={handleSave}
              disabled={isLoading || !employee || !amount}
            >
              {isLoading ? (
                <><AppIcon name="progress_activity" size={16} className="mr-2 animate-spin" />Salvando...</>
              ) : (
                <>{editingPayment ? 'Salvar' : 'Criar Holerite'}</>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
