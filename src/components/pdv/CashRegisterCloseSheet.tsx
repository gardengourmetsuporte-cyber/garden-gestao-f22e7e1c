import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AppIcon } from '@/components/ui/app-icon';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { CashRegister, CashRegisterSummary } from '@/hooks/useCashRegister';

interface ExpenseItem {
  description: string;
  amount: number;
}

interface CashRegisterCloseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  register: CashRegister;
  saving: boolean;
  onClose: (finalCash: number, notes?: string, expenses?: ExpenseItem[]) => Promise<boolean>;
  fetchSummary: () => Promise<CashRegisterSummary>;
}

const PAYMENT_LINES: { key: keyof CashRegisterSummary; label: string; icon: string }[] = [
  { key: 'total_cash', label: 'Dinheiro', icon: 'Banknote' },
  { key: 'total_debit', label: 'Débito', icon: 'CreditCard' },
  { key: 'total_credit', label: 'Crédito', icon: 'CreditCard' },
  { key: 'total_pix', label: 'Pix', icon: 'QrCode' },
  { key: 'total_meal_voucher', label: 'Vale Refeição', icon: 'Utensils' },
  { key: 'total_delivery', label: 'Delivery', icon: 'Truck' },
  { key: 'total_signed_account', label: 'Conta Assinada', icon: 'FileSignature' },
];

export function CashRegisterCloseSheet({ open, onOpenChange, register, saving, onClose, fetchSummary }: CashRegisterCloseSheetProps) {
  const [summary, setSummary] = useState<CashRegisterSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [finalCash, setFinalCash] = useState('');
  const [notes, setNotes] = useState('');
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [newExpDesc, setNewExpDesc] = useState('');
  const [newExpAmount, setNewExpAmount] = useState('');

  useEffect(() => {
    if (open) {
      setLoadingSummary(true);
      fetchSummary().then(s => {
        setSummary(s);
        setLoadingSummary(false);
      });
      setFinalCash('');
      setNotes('');
      setExpenses([]);
      setNewExpDesc('');
      setNewExpAmount('');
    }
  }, [open, fetchSummary]);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const finalCashValue = parseFloat(finalCash.replace(',', '.')) || 0;
  const expectedCash = (register?.initial_cash || 0) + (summary?.total_cash || 0) - totalExpenses;
  const difference = finalCashValue - expectedCash;

  const addExpense = () => {
    const amount = parseFloat(newExpAmount.replace(',', '.')) || 0;
    if (!newExpDesc.trim() || amount <= 0) return;
    setExpenses(prev => [...prev, { description: newExpDesc.trim(), amount }]);
    setNewExpDesc('');
    setNewExpAmount('');
  };

  const removeExpense = (index: number) => {
    setExpenses(prev => prev.filter((_, i) => i !== index));
  };

  const handleClose = async () => {
    const success = await onClose(finalCashValue, notes || undefined, expenses.length > 0 ? expenses : undefined);
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] flex flex-col">
        <SheetHeader className="pb-3 border-b border-border">
          <SheetTitle className="flex items-center gap-2 text-base">
            <AppIcon name="LockKeyhole" size={18} className="text-destructive" />
            Fechar Caixa
          </SheetTitle>
          <p className="text-xs text-muted-foreground">
            Aberto em {format(new Date(register.opened_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {loadingSummary ? (
            <div className="flex items-center justify-center py-8">
              <AppIcon name="Loader2" size={20} className="animate-spin text-muted-foreground" />
            </div>
          ) : summary ? (
            <>
              {/* Summary header */}
              <div className="bg-secondary/50 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total de vendas</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(summary.total_sales)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Vendas</p>
                  <p className="text-2xl font-bold text-foreground">{summary.sales_count}</p>
                </div>
              </div>

              {/* Payment breakdown */}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Resumo por forma de pagamento</p>
                {PAYMENT_LINES.map(line => {
                  const value = summary[line.key] as number;
                  if (value === 0) return null;
                  return (
                    <div key={line.key} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-secondary/30">
                      <div className="flex items-center gap-2">
                        <AppIcon name={line.icon} size={14} className="text-muted-foreground" />
                        <span className="text-sm">{line.label}</span>
                      </div>
                      <span className="text-sm font-medium">{formatCurrency(value)}</span>
                    </div>
                  );
                })}

                {/* Initial cash */}
                <div className="flex items-center justify-between py-1.5 px-2 rounded-lg border-t border-border mt-2 pt-3">
                  <div className="flex items-center gap-2">
                    <AppIcon name="Wallet" size={14} className="text-muted-foreground" />
                    <span className="text-sm">Troco inicial</span>
                  </div>
                  <span className="text-sm font-medium">{formatCurrency(register.initial_cash)}</span>
                </div>

                {/* Expected cash */}
                <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-primary/5">
                  <div className="flex items-center gap-2">
                    <AppIcon name="Calculator" size={14} className="text-primary" />
                    <span className="text-sm font-medium text-primary">Esperado em caixa</span>
                  </div>
                  <span className="text-sm font-bold text-primary">{formatCurrency(expectedCash)}</span>
                </div>
              </div>

              {/* Expenses section */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <AppIcon name="Receipt" size={14} className="text-muted-foreground" />
                  Gastos do Dia (opcional)
                </p>

                {expenses.map((expense, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-secondary/30 rounded-lg">
                    <span className="flex-1 text-sm truncate">{expense.description}</span>
                    <span className="text-sm font-medium text-destructive shrink-0">
                      - {formatCurrency(expense.amount)}
                    </span>
                    <button
                      onClick={() => removeExpense(index)}
                      className="p-1 rounded hover:bg-destructive/10 transition-colors shrink-0"
                    >
                      <AppIcon name="Trash2" size={13} className="text-destructive" />
                    </button>
                  </div>
                ))}

                <div className="flex gap-2">
                  <Input
                    placeholder="Ex: Geladeira"
                    value={newExpDesc}
                    onChange={e => setNewExpDesc(e.target.value)}
                    className="flex-1 h-9 text-sm"
                  />
                  <div className="relative w-24">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">R$</span>
                    <Input
                      type="text"
                      inputMode="decimal"
                      className="pl-7 text-right h-9 text-sm"
                      value={newExpAmount}
                      onChange={e => setNewExpAmount(e.target.value)}
                      placeholder="0,00"
                    />
                  </div>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={addExpense}
                    disabled={!newExpDesc.trim() || !(parseFloat(newExpAmount.replace(',', '.')) > 0)}
                  >
                    <AppIcon name="Plus" size={14} />
                  </Button>
                </div>

                {expenses.length > 0 && (
                  <div className="flex justify-between text-sm border-t border-border pt-2">
                    <span className="text-muted-foreground">Total de gastos:</span>
                    <span className="font-medium text-destructive">- {formatCurrency(totalExpenses)}</span>
                  </div>
                )}
              </div>

              {/* Final cash input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Dinheiro em caixa (R$)</label>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={finalCash}
                  onChange={e => setFinalCash(e.target.value)}
                  className="text-lg h-12 font-mono"
                />

                {finalCash && (
                  <div className={cn(
                    'rounded-lg p-3 flex items-center justify-between',
                    difference === 0 ? 'bg-success/10' : difference > 0 ? 'bg-amber-500/10' : 'bg-destructive/10'
                  )}>
                    <span className="text-xs font-medium">
                      {difference === 0 ? 'Caixa bateu!' : difference > 0 ? 'Sobra' : 'Falta'}
                    </span>
                    <span className={cn(
                      'text-sm font-bold',
                      difference === 0 ? 'text-green-600' : difference > 0 ? 'text-amber-600' : 'text-destructive'
                    )}>
                      {difference > 0 ? '+' : ''}{formatCurrency(difference)}
                    </span>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Observações (opcional)</label>
                <Textarea
                  placeholder="Alguma observação sobre o fechamento..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  className="text-sm"
                />
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-border">
          <Button
            onClick={handleClose}
            disabled={saving || loadingSummary}
            className="w-full h-11"
            variant="destructive"
          >
            {saving ? (
              <AppIcon name="Loader2" size={16} className="mr-2 animate-spin" />
            ) : (
              <AppIcon name="LockKeyhole" size={16} className="mr-2" />
            )}
            Fechar Caixa e Enviar para Aprovação
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
