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

interface CashRegisterCloseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  register: CashRegister;
  saving: boolean;
  onClose: (finalCash: number, notes?: string) => Promise<boolean>;
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

  useEffect(() => {
    if (open) {
      setLoadingSummary(true);
      fetchSummary().then(s => {
        setSummary(s);
        setLoadingSummary(false);
      });
      setFinalCash('');
      setNotes('');
    }
  }, [open, fetchSummary]);

  const finalCashValue = parseFloat(finalCash.replace(',', '.')) || 0;
  const expectedCash = (register?.initial_cash || 0) + (summary?.total_cash || 0);
  const difference = finalCashValue - expectedCash;

  const handleClose = async () => {
    const success = await onClose(finalCashValue, notes || undefined);
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] flex flex-col">
        <SheetHeader className="pb-3 border-b border-border">
          <SheetTitle className="flex items-center gap-2 text-base">
            <AppIcon name="Lock" size={18} className="text-destructive" />
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
                    difference === 0 ? 'bg-green-500/10' : difference > 0 ? 'bg-amber-500/10' : 'bg-destructive/10'
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
              <AppIcon name="Lock" size={16} className="mr-2" />
            )}
            Fechar Caixa e Enviar para Aprovação
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
