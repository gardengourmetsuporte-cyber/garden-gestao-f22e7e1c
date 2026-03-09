import { useState, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
import type { PaymentLine } from '@/hooks/usePOS';

const PAYMENT_METHODS = [
  { key: 'cash', label: 'Dinheiro', icon: 'Banknote' },
  { key: 'debit', label: 'Débito', icon: 'CreditCard' },
  { key: 'credit', label: 'Crédito', icon: 'CreditCard' },
  { key: 'pix', label: 'Pix', icon: 'QrCode' },
  { key: 'meal_voucher', label: 'Vale Refeição', icon: 'Ticket' },
  { key: 'food_voucher', label: 'Vale Alimentação', icon: 'ShoppingBag' },
  { key: 'signed_account', label: 'Conta Assinada', icon: 'BookOpen' },
  { key: 'other', label: 'Outros', icon: 'MoreHorizontal' },
] as const;

const QUICK_CASH = [5, 10, 20, 50, 100, 200];

interface PaymentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  subtotal: number;
  discount: number;
  itemCount: number;
  savingSale: boolean;
  onFinalize: (payments: PaymentLine[], options: { emitInvoice: boolean; notes: string }) => void;
  saleSource?: 'balcao' | 'mesa' | 'delivery';
  customerName?: string;
  tableNumber?: number | null;
}

export function PaymentSheet({
  open, onOpenChange, total, subtotal, discount, itemCount, savingSale, onFinalize,
}: PaymentSheetProps) {
  const [payments, setPayments] = useState<PaymentLine[]>([]);
  const [payMethod, setPayMethod] = useState('pix');
  const [payAmount, setPayAmount] = useState('');
  const [emitInvoice, setEmitInvoice] = useState(false);
  const [notes, setNotes] = useState('');

  const paymentTotal = payments.reduce((s, p) => s + p.amount, 0);
  const remaining = Math.max(0, total - paymentTotal);
  const change = Math.max(0, paymentTotal - total);

  // Payment summary grouped by method
  const paymentSummary = useMemo(() => {
    const map: Record<string, number> = {};
    payments.forEach(p => {
      map[p.method] = (map[p.method] || 0) + p.amount;
    });
    return map;
  }, [payments]);

  const addPayment = (overrideAmount?: number) => {
    const amt = overrideAmount ?? (parseFloat(payAmount) || remaining);
    if (amt <= 0) return;
    setPayments(prev => [...prev, { method: payMethod, amount: amt, change_amount: 0 }]);
    setPayAmount('');
  };

  const removePayment = (idx: number) => {
    setPayments(prev => prev.filter((_, i) => i !== idx));
  };

  const addFullRemaining = () => {
    if (remaining <= 0) return;
    setPayments(prev => [...prev, { method: payMethod, amount: remaining, change_amount: 0 }]);
    setPayAmount('');
  };

  const handleFinalize = () => {
    let effectivePayments = [...payments];
    let effectiveTotal = paymentTotal;

    // Auto-add remaining to selected method
    if (effectiveTotal < total) {
      const autoAmount = total - effectiveTotal;
      effectivePayments.push({ method: payMethod, amount: autoAmount, change_amount: 0 });
      effectiveTotal += autoAmount;
    }

    // Adjust last payment for change
    const effectiveChange = Math.max(0, effectiveTotal - total);
    if (effectiveChange > 0 && effectivePayments.length > 0) {
      const last = effectivePayments.length - 1;
      effectivePayments[last] = { ...effectivePayments[last], change_amount: effectiveChange };
    }

    onFinalize(effectivePayments, { emitInvoice, notes });
  };

  const reset = () => {
    setPayments([]);
    setPayAmount('');
    setPayMethod('pix');
    setEmitInvoice(false);
    setNotes('');
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const getMethodLabel = (key: string) => PAYMENT_METHODS.find(m => m.key === key)?.label || key;
  const getMethodIcon = (key: string) => PAYMENT_METHODS.find(m => m.key === key)?.icon || 'CreditCard';

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="max-h-[92vh] rounded-t-2xl flex flex-col p-0">
        {/* Header with total */}
        <div className="px-5 pt-5 pb-3 border-b border-border">
          <SheetTitle className="text-base font-bold text-foreground">Recebimento</SheetTitle>
          <div className="flex items-baseline justify-between mt-2">
            <div>
              <p className="text-xs text-muted-foreground">{itemCount} itens</p>
              {discount > 0 && (
                <p className="text-xs text-muted-foreground line-through">{formatCurrency(subtotal)}</p>
              )}
            </div>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(total)}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Remaining / Change display */}
          {remaining > 0 ? (
            <div className="text-center py-3 bg-secondary/60 rounded-xl">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Falta receber</p>
              <p className="text-3xl font-bold text-foreground mt-0.5">{formatCurrency(remaining)}</p>
            </div>
          ) : (
            <div className="text-center py-3 bg-primary/10 rounded-xl">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                {change > 0 ? 'Troco' : 'Pago'}
              </p>
              <p className="text-3xl font-bold text-primary mt-0.5">
                {change > 0 ? formatCurrency(change) : '✓'}
              </p>
            </div>
          )}

          {/* Payments added */}
          {payments.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pagamentos</p>
              {payments.map((p, i) => (
                <div key={i} className="flex items-center gap-2 bg-secondary/40 rounded-xl px-3 py-2.5">
                  <AppIcon name={getMethodIcon(p.method)} size={16} className="text-muted-foreground shrink-0" />
                  <span className="text-sm flex-1">{getMethodLabel(p.method)}</span>
                  <span className="text-sm font-bold">{formatCurrency(p.amount)}</span>
                  <button onClick={() => removePayment(i)} className="text-destructive ml-1">
                    <AppIcon name="X" size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Method selector */}
          {remaining > 0 && (
            <>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Forma de pagamento</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {PAYMENT_METHODS.map(m => (
                    <button
                      key={m.key}
                      onClick={() => setPayMethod(m.key)}
                      className={cn(
                        'flex flex-col items-center gap-0.5 p-2.5 rounded-xl border transition-all',
                        payMethod === m.key
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border/50 text-muted-foreground hover:border-border'
                      )}
                    >
                      <AppIcon name={m.icon} size={18} />
                      <span className="text-[9px] font-medium leading-tight text-center">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount input + add */}
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder={`Valor (${formatCurrency(remaining)})`}
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  className="flex-1 h-11"
                  inputMode="decimal"
                  onKeyDown={e => e.key === 'Enter' && addPayment()}
                />
                <Button onClick={() => addPayment()} variant="outline" className="h-11 px-3">
                  <AppIcon name="Plus" size={14} className="mr-1" />
                  Add
                </Button>
              </div>

              {/* Pay full remaining button */}
              <Button
                variant="secondary"
                className="w-full h-10"
                onClick={addFullRemaining}
              >
                <AppIcon name={getMethodIcon(payMethod)} size={14} className="mr-1.5" />
                {getMethodLabel(payMethod)} — {formatCurrency(remaining)}
              </Button>

              {/* Quick cash buttons */}
              {payMethod === 'cash' && (
                <div className="flex gap-1.5 flex-wrap">
                  {[remaining, ...QUICK_CASH].filter((v, i, arr) => v >= remaining * 0.5 || v >= 10).filter((v, i, arr) => arr.indexOf(v) === i).sort((a, b) => a - b).slice(0, 6).map(v => (
                    <button
                      key={v}
                      onClick={() => addPayment(v)}
                      className="px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-xs font-medium transition-colors"
                    >
                      {formatCurrency(v)}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Options section */}
          <div className="space-y-3 pt-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Opções</p>

            {/* Invoice toggle */}
            <div className="flex items-center justify-between bg-secondary/40 rounded-xl px-3 py-3">
              <div className="flex items-center gap-2">
                <AppIcon name="FileText" size={16} className="text-muted-foreground" />
                <Label htmlFor="emit-invoice" className="text-sm cursor-pointer">Emitir nota fiscal</Label>
              </div>
              <Switch id="emit-invoice" checked={emitInvoice} onCheckedChange={setEmitInvoice} />
            </div>

            {/* Notes */}
            <Textarea
              placeholder="Observações da venda (opcional)"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="min-h-[60px] text-sm"
              rows={2}
            />
          </div>

          {/* Summary before finalize */}
          {payments.length > 0 && (
            <div className="bg-secondary/30 rounded-xl px-3 py-3 space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Resumo</p>
              {Object.entries(paymentSummary).map(([method, amount]) => (
                <div key={method} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{getMethodLabel(method)}</span>
                  <span className="font-medium">{formatCurrency(amount)}</span>
                </div>
              ))}
              {change > 0 && (
                <div className="flex justify-between text-sm pt-1 border-t border-border/50">
                  <span className="text-muted-foreground">Troco</span>
                  <span className="font-bold text-primary">{formatCurrency(change)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sticky finalize button */}
        <div className="px-5 py-4 border-t border-border bg-card">
          <Button
            className="w-full h-12 text-base font-bold"
            size="lg"
            disabled={savingSale}
            onClick={handleFinalize}
          >
            {savingSale ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Finalizando...
              </>
            ) : (
              <>
                <AppIcon name="Check" size={18} className="mr-2" />
                Finalizar — {formatCurrency(total)}
              </>
            )}
          </Button>

          {!emitInvoice && (
            <p className="text-[10px] text-center text-muted-foreground mt-1.5">Venda sem emissão de nota fiscal</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
