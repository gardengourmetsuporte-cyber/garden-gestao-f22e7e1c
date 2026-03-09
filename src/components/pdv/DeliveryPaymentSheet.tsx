import { useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';

const PAYMENT_METHODS = [
  { key: 'cash', label: 'Dinheiro', icon: 'payments' },
  { key: 'pix', label: 'Pix', icon: 'qr_code_2' },
  { key: 'debit', label: 'Débito', icon: 'credit_card' },
  { key: 'credit', label: 'Crédito', icon: 'credit_card' },
  { key: 'meal_voucher', label: 'Vale Refeição', icon: 'restaurant' },
  { key: 'online', label: 'Já pago online', icon: 'check_circle' },
] as const;

const QUICK_CASH = [5, 10, 20, 50, 100, 200];

interface DeliveryPaymentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  customerName: string;
  sending: boolean;
  onConfirm: (paymentMethod: string, changeAmount: number) => void;
}

export function DeliveryPaymentSheet({
  open, onOpenChange, total, customerName, sending, onConfirm,
}: DeliveryPaymentSheetProps) {
  const [method, setMethod] = useState('cash');
  const [cashReceived, setCashReceived] = useState('');

  const cashValue = parseFloat(cashReceived.replace(',', '.')) || 0;
  const change = method === 'cash' ? Math.max(0, cashValue - total) : 0;
  const isCash = method === 'cash';
  const canConfirm = !isCash || cashValue >= total;

  const handleConfirm = () => {
    onConfirm(method, change);
    setCashReceived('');
    setMethod('cash');
  };

  const handleClose = (v: boolean) => {
    if (!v) {
      setCashReceived('');
      setMethod('cash');
    }
    onOpenChange(v);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="max-h-[85dvh] rounded-t-3xl flex flex-col p-0">
        <div className="w-10 h-1 bg-border rounded-full mx-auto mt-3 mb-1 shrink-0" />

        {/* Header */}
        <div className="px-5 py-3 border-b border-border/30 shrink-0">
          <h2 className="text-base font-bold text-foreground">Pagamento da Entrega</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {customerName || 'Cliente'} • Total: <span className="font-bold text-primary">{formatCurrency(total)}</span>
          </p>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* Payment method selector */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Forma de pagamento</p>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map(m => (
                <button
                  key={m.key}
                  onClick={() => { setMethod(m.key); setCashReceived(''); }}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all active:scale-[0.97]',
                    method === m.key
                      ? 'bg-primary/10 border-primary/30 text-primary'
                      : 'bg-card border-border/30 text-muted-foreground hover:border-border/60'
                  )}
                >
                  <AppIcon name={m.icon} size={22} fill={method === m.key ? 1 : 0} />
                  <span className="text-[11px] font-semibold leading-tight">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Cash change calculator */}
          {isCash && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Valor recebido do cliente</p>

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-semibold">R$</span>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={cashReceived}
                  onChange={e => setCashReceived(e.target.value)}
                  className="pl-10 h-12 text-lg font-bold rounded-xl bg-secondary/50 border-border/30"
                  autoFocus
                />
              </div>

              {/* Quick amounts */}
              <div className="flex flex-wrap gap-1.5">
                {QUICK_CASH.map(v => (
                  <button
                    key={v}
                    onClick={() => setCashReceived(String(v))}
                    className={cn(
                      'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95',
                      cashValue === v
                        ? 'bg-primary/15 text-primary border border-primary/30'
                        : 'bg-secondary/60 text-muted-foreground border border-transparent'
                    )}
                  >
                    R$ {v}
                  </button>
                ))}
                <button
                  onClick={() => setCashReceived(String(total))}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95',
                    cashValue === total
                      ? 'bg-primary/15 text-primary border border-primary/30'
                      : 'bg-secondary/60 text-muted-foreground border border-transparent'
                  )}
                >
                  Sem troco
                </button>
              </div>

              {/* Change display */}
              {cashValue > 0 && (
                <div className={cn(
                  'rounded-2xl p-4 border',
                  cashValue >= total
                    ? 'bg-primary/5 border-primary/20'
                    : 'bg-destructive/5 border-destructive/20'
                )}>
                  {cashValue >= total ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <AppIcon name="payments" size={22} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Troco para o entregador</p>
                          <p className="text-2xl font-black text-primary">{formatCurrency(change)}</p>
                        </div>
                      </div>
                      {change === 0 && (
                        <span className="text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary font-semibold">Exato</span>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-destructive font-medium text-center">
                      Faltam {formatCurrency(total - cashValue)}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Non-cash confirmation */}
          {!isCash && (
            <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <AppIcon name={PAYMENT_METHODS.find(m => m.key === method)?.icon || 'check_circle'} size={22} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">
                  {PAYMENT_METHODS.find(m => m.key === method)?.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {method === 'online' ? 'Pagamento já realizado' : 'Entregador levará a maquininha'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-border/20 bg-background/80 backdrop-blur-sm px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button
            className="w-full h-12 rounded-xl text-sm font-bold"
            onClick={handleConfirm}
            disabled={sending || !canConfirm}
          >
            {sending ? (
              <AppIcon name="Loader2" size={18} className="mr-2 animate-spin" />
            ) : (
              <AppIcon name="Send" size={18} className="mr-2" />
            )}
            Enviar Pedido
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
