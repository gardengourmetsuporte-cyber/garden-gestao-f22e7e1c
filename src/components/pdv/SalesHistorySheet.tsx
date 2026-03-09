import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppIcon } from '@/components/ui/app-icon';
import { formatCurrency } from '@/lib/format';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Sale {
  id: string;
  sale_number: number;
  total: number;
  subtotal: number;
  discount: number;
  status: string;
  source: string;
  customer_name: string | null;
  customer_document: string | null;
  table_number: number | null;
  paid_at: string | null;
  created_at: string;
  notes: string | null;
  items: { product_name: string; quantity: number; unit_price: number }[];
  payments: { method: string; amount: number }[];
}

interface SalesHistorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Dinheiro',
  debit: 'Débito',
  credit: 'Crédito',
  pix: 'Pix',
  meal_voucher: 'Vale Refeição',
  food_voucher: 'Vale Alimentação',
  signed_account: 'Conta Assinada',
  other: 'Outros',
};

export function SalesHistorySheet({ open, onOpenChange }: SalesHistorySheetProps) {
  const { activeUnitId } = useUnit();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (open && activeUnitId) {
      fetchSales();
    }
  }, [open, activeUnitId]);

  const fetchSales = async () => {
    if (!activeUnitId) return;
    setLoading(true);

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const { data, error } = await supabase
      .from('pos_sales')
      .select(`
        id, sale_number, total, subtotal, discount, status, source,
        customer_name, customer_document, table_number, paid_at, created_at, notes,
        pos_sale_items(product_name, quantity, unit_price),
        pos_sale_payments(method, amount)
      `)
      .eq('unit_id', activeUnitId)
      .gte('created_at', startOfDay.toISOString())
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSales(data.map(s => ({
        ...s,
        items: s.pos_sale_items || [],
        payments: s.pos_sale_payments || [],
      })));
    }
    setLoading(false);
  };

  const totalSales = sales.filter(s => s.status === 'paid').length;
  const totalRevenue = sales.filter(s => s.status === 'paid').reduce((sum, s) => sum + s.total, 0);

  // Group payments by method
  const paymentSummary = sales.filter(s => s.status === 'paid').reduce((acc, sale) => {
    sale.payments.forEach(p => {
      acc[p.method] = (acc[p.method] || 0) + p.amount;
    });
    return acc;
  }, {} as Record<string, number>);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[92vh] rounded-t-2xl flex flex-col p-0">
        <div className="px-5 pt-5 pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base font-bold">Vendas de Hoje</SheetTitle>
            <Button variant="ghost" size="sm" onClick={fetchSales} disabled={loading}>
              <AppIcon name="RefreshCw" size={14} className={loading ? 'animate-spin' : ''} />
            </Button>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Vendas</p>
              <p className="text-xl font-bold">{totalSales}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</p>
              <p className="text-xl font-bold text-primary">{formatCurrency(totalRevenue)}</p>
            </div>
          </div>
          {Object.keys(paymentSummary).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {Object.entries(paymentSummary).map(([method, amount]) => (
                <Badge key={method} variant="secondary" className="text-[10px] font-medium">
                  {PAYMENT_LABELS[method] || method}: {formatCurrency(amount)}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
          {loading ? (
            <div className="text-center text-muted-foreground py-8 text-sm">Carregando...</div>
          ) : sales.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 text-sm">
              Nenhuma venda registrada hoje
            </div>
          ) : (
            sales.map(sale => {
              const isExpanded = expandedId === sale.id;
              return (
                <button
                  key={sale.id}
                  onClick={() => setExpandedId(isExpanded ? null : sale.id)}
                  className="w-full bg-card border border-border/50 rounded-xl p-3 text-left hover:border-primary/30 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">#{sale.sale_number}</span>
                      <Badge variant={sale.status === 'paid' ? 'default' : sale.status === 'cancelled' ? 'destructive' : 'secondary'} className="text-[9px]">
                        {sale.status === 'paid' ? 'Pago' : sale.status === 'cancelled' ? 'Cancelado' : sale.status}
                      </Badge>
                      {sale.source !== 'balcao' && (
                        <Badge variant="outline" className="text-[9px]">{sale.source}</Badge>
                      )}
                    </div>
                    <span className="text-sm font-bold text-primary">{formatCurrency(sale.total)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      {sale.paid_at && (
                        <span>{format(new Date(sale.paid_at), 'HH:mm', { locale: ptBR })}</span>
                      )}
                      {sale.customer_name && (
                        <span>• {sale.customer_name}</span>
                      )}
                      {sale.table_number && (
                        <span>• Mesa {sale.table_number}</span>
                      )}
                    </div>
                    <AppIcon name={isExpanded ? 'ChevronUp' : 'ChevronDown'} size={14} className="text-muted-foreground" />
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-border/50 space-y-2" onClick={e => e.stopPropagation()}>
                      {/* Items */}
                      {sale.items.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Itens</p>
                          {sale.items.map((item, i) => (
                            <div key={i} className="flex justify-between text-xs">
                              <span>{item.quantity}x {item.product_name}</span>
                              <span className="text-muted-foreground">{formatCurrency(item.quantity * item.unit_price)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Payments */}
                      {sale.payments.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pagamentos</p>
                          {sale.payments.map((pay, i) => (
                            <div key={i} className="flex justify-between text-xs">
                              <span>{PAYMENT_LABELS[pay.method] || pay.method}</span>
                              <span className="font-medium">{formatCurrency(pay.amount)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Notes */}
                      {sale.notes && (
                        <div className="text-xs text-muted-foreground italic">
                          Obs: {sale.notes}
                        </div>
                      )}

                      {/* Discount */}
                      {sale.discount > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Desconto: -{formatCurrency(sale.discount)}
                        </div>
                      )}
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
