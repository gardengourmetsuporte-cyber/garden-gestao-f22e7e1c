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
import { cn } from '@/lib/utils';

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

const SOURCE_CONFIG: Record<string, { icon: string; label: string }> = {
  mesa: { icon: 'UtensilsCrossed', label: 'Mesas' },
  delivery: { icon: 'Truck', label: 'Delivery' },
  ifood: { icon: 'Truck', label: 'iFood' },
  balcao: { icon: 'Store', label: 'Balcão' },
  whatsapp: { icon: 'MessageCircle', label: 'WhatsApp' },
  pedido: { icon: 'ShoppingBag', label: 'Pedido' },
};

type ViewMode = 'list' | 'blocks';

function getSourceKey(sale: Sale): string {
  const s = sale.source?.toLowerCase() || 'outros';
  if (s.includes('ifood')) return 'ifood';
  if (s.includes('delivery') || s.includes('rappi') || s.includes('uber')) return 'delivery';
  if (s.includes('mesa') || s.includes('table') || sale.table_number) return 'mesa';
  if (s.includes('whatsapp')) return 'whatsapp';
  if (s.includes('balcao') || s.includes('balcão')) return 'balcao';
  if (s.includes('pedido')) return 'pedido';
  return s;
}

export function SalesHistorySheet({ open, onOpenChange }: SalesHistorySheetProps) {
  const { activeUnitId } = useUnit();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('blocks');
  const [filterSource, setFilterSource] = useState<string | null>(null);

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
      .order('created_at', { ascending: true });

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

  const paymentSummary = sales.filter(s => s.status === 'paid').reduce((acc, sale) => {
    sale.payments.forEach(p => {
      acc[p.method] = (acc[p.method] || 0) + p.amount;
    });
    return acc;
  }, {} as Record<string, number>);

  // Assign sequential numbers (ascending order)
  const numberedSales = sales.map((sale, idx) => ({
    ...sale,
    sequentialNumber: idx + 1,
  }));

  // For display, reverse so newest is first
  const displaySales = [...numberedSales].reverse();

  // Group by source
  const grouped = displaySales.reduce((acc, sale) => {
    const key = getSourceKey(sale);
    if (!acc[key]) acc[key] = [];
    acc[key].push(sale);
    return acc;
  }, {} as Record<string, (Sale & { sequentialNumber: number })[]>);

  const sourceKeys = Object.keys(grouped);

  const filteredGrouped = filterSource
    ? { [filterSource]: grouped[filterSource] || [] }
    : grouped;

  const filteredSales = filterSource
    ? displaySales.filter(s => getSourceKey(s) === filterSource)
    : displaySales;

  const STATUS_BADGE = {
    paid: { label: 'Pago', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
    cancelled: { label: 'Cancelado', className: 'bg-destructive/15 text-destructive border-destructive/30' },
  } as Record<string, { label: string; className: string }>;

  const renderSaleBlock = (sale: Sale & { sequentialNumber: number }) => {
    const isExpanded = expandedId === sale.id;
    const statusCfg = STATUS_BADGE[sale.status] || { label: sale.status, className: 'bg-secondary text-muted-foreground' };
    const sourceKey = getSourceKey(sale);
    const sourceCfg = SOURCE_CONFIG[sourceKey] || { icon: 'ShoppingBag', label: sourceKey };

    return (
      <button
        key={sale.id}
        onClick={() => setExpandedId(isExpanded ? null : sale.id)}
        className="bg-card border border-border/50 rounded-xl p-3 text-left hover:border-primary/30 transition-all active:scale-[0.97] relative overflow-hidden w-full"
      >
        {/* Sequential number badge */}
        <div className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <span className="text-xs font-bold text-primary">{sale.sequentialNumber}</span>
        </div>

        {/* Status + source */}
        <div className="flex items-center gap-1.5 mb-1.5 pr-8">
          <Badge variant="outline" className={cn('text-[9px] px-1.5 py-0.5 border', statusCfg.className)}>
            {statusCfg.label}
          </Badge>
          <Badge variant="outline" className="text-[9px] px-1.5 py-0.5">
            {sourceCfg.label}
          </Badge>
        </div>

        {/* Customer / table */}
        {(sale.customer_name || sale.table_number) && (
          <p className="text-[11px] text-muted-foreground truncate mb-1">
            {sale.customer_name && `• ${sale.customer_name}`}
            {sale.table_number && ` • Mesa ${sale.table_number}`}
          </p>
        )}

        {/* Time */}
        <p className="text-[10px] text-muted-foreground mb-2">
          {sale.paid_at ? format(new Date(sale.paid_at), 'HH:mm', { locale: ptBR }) : format(new Date(sale.created_at), 'HH:mm', { locale: ptBR })}
        </p>

        {/* Price */}
        <div className="flex items-center justify-between mt-auto">
          <span className="text-sm font-bold text-primary">{formatCurrency(sale.total)}</span>
          <AppIcon name={isExpanded ? 'ChevronUp' : 'ChevronDown'} size={14} className="text-muted-foreground" />
        </div>

        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-border/50 space-y-2" onClick={e => e.stopPropagation()}>
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
            {sale.notes && <div className="text-xs text-muted-foreground italic">Obs: {sale.notes}</div>}
            {sale.discount > 0 && <div className="text-xs text-muted-foreground">Desconto: -{formatCurrency(sale.discount)}</div>}
          </div>
        )}
      </button>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[92vh] rounded-t-2xl flex flex-col p-0">
        <div className="px-5 pt-5 pb-3 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base font-bold">Vendas de Hoje</SheetTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className={cn('h-8 w-8', viewMode === 'blocks' && 'bg-secondary')}
                onClick={() => setViewMode('blocks')}
              >
                <AppIcon name="LayoutGrid" size={16} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn('h-8 w-8', viewMode === 'list' && 'bg-secondary')}
                onClick={() => setViewMode('list')}
              >
                <AppIcon name="List" size={16} />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchSales} disabled={loading}>
                <AppIcon name="RefreshCw" size={14} className={loading ? 'animate-spin' : ''} />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4">
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
            <div className="flex flex-wrap gap-2">
              {Object.entries(paymentSummary).map(([method, amount]) => (
                <Badge key={method} variant="secondary" className="text-[10px] font-medium">
                  {PAYMENT_LABELS[method] || method}: {formatCurrency(amount)}
                </Badge>
              ))}
            </div>
          )}

          {/* Source filter chips */}
          {sourceKeys.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setFilterSource(null)}
                className={cn(
                  'shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all',
                  !filterSource ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                )}
              >
                Todos ({sales.length})
              </button>
              {sourceKeys.map(key => {
                const cfg = SOURCE_CONFIG[key] || { icon: 'ShoppingBag', label: key };
                return (
                  <button
                    key={key}
                    onClick={() => setFilterSource(filterSource === key ? null : key)}
                    className={cn(
                      'shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all flex items-center gap-1.5',
                      filterSource === key ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                    )}
                  >
                    <AppIcon name={cfg.icon} size={12} />
                    {cfg.label} ({grouped[key].length})
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading ? (
            <div className="text-center text-muted-foreground py-8 text-sm">Carregando...</div>
          ) : sales.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 text-sm">Nenhuma venda registrada hoje</div>
          ) : viewMode === 'blocks' ? (
            <div className="space-y-5">
              {Object.entries(filteredGrouped).map(([sourceKey, sourceSales]) => {
                const cfg = SOURCE_CONFIG[sourceKey] || { icon: 'ShoppingBag', label: sourceKey };
                return (
                  <div key={sourceKey}>
                    <div className="flex items-center gap-2 mb-2.5">
                      <AppIcon name={cfg.icon} size={14} className="text-muted-foreground" />
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{cfg.label}</span>
                      <span className="text-[10px] text-muted-foreground/60">({sourceSales.length})</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {sourceSales.map(sale => renderSaleBlock(sale))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(filteredGrouped).map(([sourceKey, sourceSales]) => {
                const cfg = SOURCE_CONFIG[sourceKey] || { icon: 'ShoppingBag', label: sourceKey };
                return (
                  <div key={sourceKey}>
                    <div className="flex items-center gap-2 mb-2">
                      <AppIcon name={cfg.icon} size={14} className="text-muted-foreground" />
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{cfg.label}</span>
                    </div>
                    <div className="space-y-1.5">
                      {sourceSales.map(sale => renderSaleBlock(sale))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
