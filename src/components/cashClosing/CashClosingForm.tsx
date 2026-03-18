import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCashClosing } from '@/hooks/useCashClosing';
import { PAYMENT_METHODS } from '@/types/cashClosing';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { AppIcon } from '@/components/ui/app-icon';

const DRAFT_KEY = 'cash_closing_draft';

interface DraftData {
  selectedDate: string;
  initialCash: number;
  cashCounted: number;
  debitAmount: number;
  creditAmount: number;
  pixAmount: number;
  mealVoucherAmount: number;
  deliveryAmount: number;
  signedAccountAmount: number;
  cashDifference: number;
  notes: string;
  expenses: ExpenseItem[];
  savedAt: number;
}

function loadDraft(): DraftData | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const draft: DraftData = JSON.parse(raw);
    // Expire drafts older than 24h
    if (Date.now() - draft.savedAt > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(DRAFT_KEY);
      return null;
    }
    return draft;
  } catch { return null; }
}

function saveDraft(data: Omit<DraftData, 'savedAt'>) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...data, savedAt: Date.now() }));
  } catch {}
}

export function clearCashClosingDraft() {
  localStorage.removeItem(DRAFT_KEY);
}

interface Props {
  onSuccess: () => void;
}

interface ExpenseItem {
  description: string;
  amount: number;
}

function DateInline({ selectedDate, onSelect, todayDate, minAllowedDate }: {
  selectedDate: Date; onSelect: (d: Date) => void; todayDate: Date; minAllowedDate: Date;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 font-medium">
          <AppIcon name="Calendar" size={16} />
          {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={8}
        className="w-auto p-2 z-[120]"
      >
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(d) => {
            if (d) {
              onSelect(d);
              setOpen(false);
            }
          }}
          locale={ptBR}
          disabled={(date) => date > todayDate || date < minAllowedDate}
          className="p-3 pointer-events-auto"
        />
        <p className="text-xs text-muted-foreground px-3 pb-2">Disponível até 7 dias anteriores.</p>
      </PopoverContent>
    </Popover>
  );
}

export function CashClosingForm({ onSuccess }: Props) {
  const { profile, isAdmin } = useAuth();
  const { uploadReceipt, createClosing, checkChecklistCompleted } = useCashClosing();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  
  const now = new Date();
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const minAllowedDate = subDays(todayDate, 7);
  const currentHour = now.getHours();
  const defaultDate = currentHour < 6 ? subDays(todayDate, 1) : todayDate;

  const draft = useRef(loadDraft()).current;
  
  const [selectedDate, setSelectedDate] = useState<Date>(
    draft ? new Date(draft.selectedDate + 'T12:00:00') : defaultDate
  );
  const operationalDate = format(selectedDate, 'yyyy-MM-dd');
  
  const [initialCash, setInitialCash] = useState(draft?.initialCash ?? 0);
  const [cashCounted, setCashCounted] = useState(draft?.cashCounted ?? 0);
  const [debitAmount, setDebitAmount] = useState(draft?.debitAmount ?? 0);
  const [creditAmount, setCreditAmount] = useState(draft?.creditAmount ?? 0);
  const [pixAmount, setPixAmount] = useState(draft?.pixAmount ?? 0);
  const [mealVoucherAmount, setMealVoucherAmount] = useState(draft?.mealVoucherAmount ?? 0);
  const [deliveryAmount, setDeliveryAmount] = useState(draft?.deliveryAmount ?? 0);
  const [signedAccountAmount, setSignedAccountAmount] = useState(draft?.signedAccountAmount ?? 0);
  const [cashDifference, setCashDifference] = useState(draft?.cashDifference ?? 0);
  const [notes, setNotes] = useState(draft?.notes ?? '');
  
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checklistStatus, setChecklistStatus] = useState<'checking' | 'completed' | 'incomplete' | null>(null);
  const [expenses, setExpenses] = useState<ExpenseItem[]>(draft?.expenses ?? []);
  const [newExpense, setNewExpense] = useState<ExpenseItem>({ description: '', amount: 0 });

  // Show toast if draft was restored
  const draftNotified = useRef(false);
  useEffect(() => {
    if (draft && !draftNotified.current) {
      draftNotified.current = true;
      toast.info('Rascunho restaurado', { description: 'Seu fechamento anterior foi recuperado.' });
    }
  }, [draft]);

  // Auto-save draft debounced to avoid jank during typing
  const draftTimerRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      saveDraft({
        selectedDate: operationalDate,
        initialCash,
        cashCounted,
        debitAmount,
        creditAmount,
        pixAmount,
        mealVoucherAmount,
        deliveryAmount,
        signedAccountAmount,
        cashDifference,
        notes,
        expenses,
      });
    }, 500);
    return () => { if (draftTimerRef.current) clearTimeout(draftTimerRef.current); };
  }, [operationalDate, initialCash, cashCounted, debitAmount, creditAmount, pixAmount, mealVoucherAmount, deliveryAmount, signedAccountAmount, cashDifference, notes, expenses]);

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Cálculos conforme regra do restaurante:
  // Dinheiro vendido = Dinheiro contado + Gastos - Caixa inicial
  const cashSold = cashCounted + totalExpenses - initialCash;
  // Total esperado no caixa = Caixa inicial + Dinheiro vendido - Gastos (= cashCounted)
  const expectedCashInDrawer = initialCash + cashSold - totalExpenses;
  // Total de vendas = todos os meios
  const totalPayments = cashSold + debitAmount + creditAmount + pixAmount + mealVoucherAmount + deliveryAmount + signedAccountAmount;

  const paymentValues: Record<string, { value: number; setter: (v: number) => void }> = {
    cash_amount: { value: cashCounted, setter: setCashCounted },
    debit_amount: { value: debitAmount, setter: setDebitAmount },
    credit_amount: { value: creditAmount, setter: setCreditAmount },
    pix_amount: { value: pixAmount, setter: setPixAmount },
    meal_voucher_amount: { value: mealVoucherAmount, setter: setMealVoucherAmount },
    delivery_amount: { value: deliveryAmount, setter: setDeliveryAmount },
    signed_account_amount: { value: signedAccountAmount, setter: setSignedAccountAmount },
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleValueChange = (key: string, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value) || 0;
    paymentValues[key]?.setter(numValue);
  };

  const addExpense = () => {
    if (!newExpense.description.trim()) {
      toast.error('Informe a descrição do gasto');
      return;
    }
    if (newExpense.amount <= 0) {
      toast.error('Informe o valor do gasto');
      return;
    }
    setExpenses(prev => [...prev, { ...newExpense }]);
    setNewExpense({ description: '', amount: 0 });
  };

  const removeExpense = (index: number) => {
    setExpenses(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Checklist check removed — allow submission regardless of checklist status
    setChecklistStatus('completed');

    if (totalPayments <= 0) {
      toast.error('Informe pelo menos um valor de pagamento');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload receipt if provided
      let receiptUrl = '';
      if (receiptFile) {
        const uploadedUrl = await uploadReceipt(receiptFile);
        if (uploadedUrl) {
          receiptUrl = uploadedUrl;
        }
      }

      // Create closing
      const success = await createClosing({
        date: operationalDate,
        unit_name: 'Principal',
        initial_cash: initialCash,
        cash_amount: cashSold, // Salvar o dinheiro vendido (calculado)
        debit_amount: debitAmount,
        credit_amount: creditAmount,
        pix_amount: pixAmount,
        meal_voucher_amount: mealVoucherAmount,
        delivery_amount: deliveryAmount,
        signed_account_amount: signedAccountAmount,
        cash_difference: cashDifference,
        receipt_url: receiptUrl,
        notes: notes,
        expenses: expenses,
      });

      if (success) {
        clearCashClosingDraft();
        onSuccess();
      } else {
        toast.error('Não foi possível salvar o fechamento. Seus dados estão preservados, tente novamente.');
      }
    } catch (err) {
      console.error('Cash closing submit error:', err);
      toast.error('Erro inesperado ao enviar. Seus dados estão preservados, tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getIcon = (iconName: string) => iconName;

  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  return (
    <div className="space-y-4 pb-6">
      {/* Header: Date + Responsible */}
      <div className="flex items-center justify-between bg-secondary/40 rounded-2xl p-3">
        <DateInline
          selectedDate={selectedDate}
          onSelect={setSelectedDate}
          todayDate={todayDate}
          minAllowedDate={minAllowedDate}
        />
        <span className="text-xs text-muted-foreground truncate ml-2">
          {profile?.full_name || 'Usuário'}
        </span>
      </div>

      {/* 💰 Caixa — Inicial + Contado side-by-side */}
      <div className="rounded-2xl bg-card p-4 space-y-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, hsl(142 71% 45%), hsl(160 84% 39%))' }}>
            <AppIcon name="payments" size={15} fill={1} className="text-white" />
          </div>
          Caixa
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground">Valor inicial</Label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">R$</span>
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                className="pl-8 text-right h-11 text-base font-medium"
                value={initialCash || ''}
                onChange={(e) => setInitialCash(parseFloat(e.target.value) || 0)}
                placeholder="0,00"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground">Valor contado</Label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">R$</span>
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                className="pl-8 text-right h-11 text-base font-medium"
                value={cashCounted || ''}
                onChange={(e) => setCashCounted(parseFloat(e.target.value) || 0)}
                placeholder="0,00"
              />
            </div>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground/70 leading-tight">
          Inicial = dinheiro no início do turno · Contado = notas + moedas no fim
        </p>
      </div>

      {/* 💳 Outros Meios de Pagamento */}
      <div className="rounded-2xl bg-card p-4 space-y-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
            <AppIcon name="credit_card" size={15} fill={1} className="text-white" />
          </div>
          Meios de Pagamento
        </h3>
        <div className="space-y-2">
          {PAYMENT_METHODS.filter(m => m.key !== 'cash_amount').map(method => {
            const { value } = paymentValues[method.key] || { value: 0 };
            if (!paymentValues[method.key]) return null;
            return (
              <div key={method.key} className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${method.color}18` }}
                >
                  <AppIcon name={method.icon} size={16} style={{ color: method.color }} />
                </div>
                <span className="flex-1 text-sm text-foreground">{method.label}</span>
                <div className="relative w-28">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">R$</span>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    className="pl-8 text-right h-10 text-sm"
                    value={value || ''}
                    onChange={(e) => handleValueChange(method.key, e.target.value)}
                    placeholder="0,00"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 🧾 Gastos do Dia */}
      <div className="rounded-2xl bg-card p-4 space-y-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #EF4444, #F97316)' }}>
            <AppIcon name="receipt_long" size={15} fill={1} className="text-white" />
          </div>
          Gastos do Dia
          <span className="text-[10px] text-muted-foreground font-normal ml-auto">opcional</span>
        </h3>

        {expenses.map((expense, index) => (
          <div key={index} className="flex items-center gap-2 p-2 bg-secondary/40 rounded-xl">
            <span className="flex-1 text-sm truncate">{expense.description}</span>
            <span className="font-medium text-destructive text-sm">- R$ {fmt(expense.amount)}</span>
            <button
              onClick={() => removeExpense(index)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <AppIcon name="close" size={14} />
            </button>
          </div>
        ))}

        <div className="flex gap-2">
          <Input
            placeholder="Ex: Geladeira"
            value={newExpense.description}
            onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
            className="flex-1 h-10"
          />
          <div className="relative w-24">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">R$</span>
            <Input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              className="pl-7 text-right h-10 text-sm"
              value={newExpense.amount || ''}
              onChange={(e) => setNewExpense(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
              placeholder="0,00"
            />
          </div>
          <Button variant="secondary" size="icon" onClick={addExpense} className="shrink-0 h-10 w-10 rounded-xl">
            <AppIcon name="add" size={18} />
          </Button>
        </div>

        {expenses.length > 0 && (
          <div className="flex justify-between text-sm pt-2 border-t border-border/30">
            <span className="text-muted-foreground">Total gastos</span>
            <span className="font-semibold text-destructive">- R$ {fmt(totalExpenses)}</span>
          </div>
        )}
      </div>

      {/* 📊 Resumo */}
      <div className="rounded-2xl p-4 space-y-3" style={{ background: 'linear-gradient(135deg, hsl(142 71% 45% / 0.08), hsl(160 84% 39% / 0.06))' }}>
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, hsl(142 71% 45%), hsl(160 84% 39%))' }}>
            <AppIcon name="bar_chart" size={15} fill={1} className="text-white" />
          </div>
          Resumo
        </h3>

        {/* Dinheiro vendido highlight */}
        <div className="bg-card/60 rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground block">Dinheiro vendido</span>
              <span className="text-[10px] text-muted-foreground/60">
                {fmt(cashCounted)} + {fmt(totalExpenses)} − {fmt(initialCash)}
              </span>
            </div>
            <span className="text-lg font-black text-success">R$ {fmt(cashSold)}</span>
          </div>
        </div>

        {/* Payment breakdown — compact */}
        <div className="space-y-1.5 px-1">
          {[
            { label: 'Débito', value: debitAmount },
            { label: 'Crédito', value: creditAmount },
            { label: 'Pix', value: pixAmount },
            { label: 'Vale Alimentação', value: mealVoucherAmount },
            { label: 'Delivery', value: deliveryAmount },
            { label: 'Conta Assinada', value: signedAccountAmount },
          ].filter(r => r.value > 0).map(row => (
            <div key={row.label} className="flex justify-between text-sm">
              <span className="text-muted-foreground">+ {row.label}</span>
              <span className="text-foreground">R$ {fmt(row.value)}</span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="border-t border-success/20 pt-3 flex items-center justify-between">
          <span className="font-bold text-base">Total em Vendas</span>
          <span className="text-xl font-black text-primary">R$ {fmt(totalPayments)}</span>
        </div>

        {/* Expected */}
        <div className="flex items-center justify-between text-sm px-1">
          <span className="text-muted-foreground">Esperado no caixa</span>
          <span className="font-semibold text-foreground">R$ {fmt(expectedCashInDrawer)}</span>
        </div>
      </div>

      {/* Diferença de Caixa */}
      <div className="rounded-2xl bg-card p-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-warning/10">
            <AppIcon name="swap_vert" size={16} className="text-warning" />
          </div>
          <span className="flex-1 text-sm text-foreground">Diferença de caixa</span>
          <div className="relative w-28">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">R$</span>
            <Input
              type="number"
              inputMode="decimal"
              step="0.01"
              className="pl-8 text-right h-10 text-sm"
              value={cashDifference || ''}
              onChange={(e) => setCashDifference(parseFloat(e.target.value) || 0)}
              placeholder="0,00"
            />
          </div>
        </div>
        {cashDifference !== 0 && (
          <p className="text-[11px] text-warning mt-2 flex items-center gap-1 ml-10">
            <AppIcon name="info" size={12} />
            {cashDifference > 0 ? 'Sobra' : 'Falta'} será registrada
          </p>
        )}
      </div>

      {/* 📎 Comprovante */}
      <div className="rounded-2xl bg-card p-4 space-y-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #64748B, #94A3B8)' }}>
            <AppIcon name="upload_file" size={15} fill={1} className="text-white" />
          </div>
          Comprovante PDV
          <span className="text-[10px] text-muted-foreground font-normal ml-auto">opcional</span>
        </h3>

        <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileChange} />
        <input ref={galleryInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileChange} />

        {receiptPreview ? (
          <div className="relative">
            <img src={receiptPreview} alt="Comprovante" className="w-full h-40 object-cover rounded-xl" />
            <div className="absolute bottom-2 right-2 flex gap-2">
              <Button variant="secondary" size="sm" className="h-8 rounded-lg gap-1.5 text-xs" onClick={() => fileInputRef.current?.click()}>
                <AppIcon name="photo_camera" size={14} /> Trocar
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-1.5 p-4 rounded-xl bg-secondary/40 hover:bg-secondary/60 transition-colors"
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center bg-primary/10">
                <AppIcon name="photo_camera" size={18} className="text-primary" />
              </div>
              <span className="text-xs font-medium text-foreground">Câmera</span>
            </button>
            <button
              onClick={() => galleryInputRef.current?.click()}
              className="flex flex-col items-center gap-1.5 p-4 rounded-xl bg-secondary/40 hover:bg-secondary/60 transition-colors"
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center bg-primary/10">
                <AppIcon name="photo_library" size={18} className="text-primary" />
              </div>
              <span className="text-xs font-medium text-foreground">Galeria</span>
            </button>
          </div>
        )}
      </div>

      {/* Observações */}
      <div className="rounded-2xl bg-card p-4 space-y-2">
        <Label className="text-sm font-medium">Observações <span className="text-muted-foreground font-normal text-[10px]">opcional</span></Label>
        <Textarea
          placeholder="Alguma observação sobre o fechamento..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="rounded-xl"
        />
      </div>

      {/* Submit */}
      <Button
        className="w-full h-14 text-base font-bold rounded-2xl gap-2"
        onClick={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <AppIcon name="progress_activity" size={20} className="animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <AppIcon name="check_circle" size={20} fill={1} />
            Enviar Fechamento
          </>
        )}
      </Button>
    </div>
  );
}