import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { formatCurrency } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import { AppIcon } from '@/components/ui/app-icon';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  customerId: string;
  customerName: string;
  customerPhone?: string | null;
}

export function CustomerOrderHistory({ customerId, customerName, customerPhone }: Props) {
  const { activeUnit } = useUnit();
  const unitId = activeUnit?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['customer-order-history', customerId, unitId],
    queryFn: async () => {
      const orders: Array<{ id: string; date: string; total: number; source: string; items: string }> = [];

      // POS sales by customer_name
      const { data: posSales } = await supabase
        .from('pos_sales')
        .select('id, created_at, total, source, customer_name')
        .eq('unit_id', unitId!)
        .eq('status', 'paid')
        .or(`customer_name.ilike.%${customerName}%${customerPhone ? `,customer_phone.eq.${customerPhone}` : ''}`)
        .order('created_at', { ascending: false })
        .limit(50);

      posSales?.forEach(s => {
        orders.push({
          id: s.id,
          date: s.created_at,
          total: Number(s.total || 0),
          source: s.source || 'counter',
          items: '',
        });
      });

      // Tablet orders
      if (customerPhone) {
        const { data: tabletOrders } = await supabase
          .from('tablet_orders')
          .select('id, created_at, total, status')
          .eq('unit_id', unitId!)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(50);

        // Filter not already included
        const existingIds = new Set(orders.map(o => o.id));
        tabletOrders?.forEach(t => {
          if (!existingIds.has(t.id)) {
            orders.push({
              id: t.id,
              date: t.created_at,
              total: Number(t.total || 0),
              source: 'tablet',
              items: '',
            });
          }
        });
      }

      orders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const totalSpent = orders.reduce((s, o) => s + o.total, 0);

      return { orders: orders.slice(0, 30), totalSpent, totalOrders: orders.length };
    },
    enabled: !!unitId && !!customerName,
  });

  const SOURCE_LABELS: Record<string, string> = {
    counter: 'Balcão', delivery: 'Delivery', tablet: 'Tablet', whatsapp: 'WhatsApp',
  };

  if (isLoading) return <p className="text-xs text-muted-foreground py-4">Carregando histórico...</p>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Histórico de Pedidos</h3>
        {data && (
          <span className="text-xs text-muted-foreground">
            {data.totalOrders} pedidos · {formatCurrency(data.totalSpent)}
          </span>
        )}
      </div>

      {(!data || data.orders.length === 0) ? (
        <p className="text-xs text-muted-foreground py-4 text-center">Nenhum pedido encontrado</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {data.orders.map(o => (
            <div key={o.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
              <div className="flex items-center gap-2">
                <AppIcon name="ShoppingBag" size={14} className="text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium">
                    {format(new Date(o.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                  <Badge variant="outline" className="text-[10px] mt-0.5">
                    {SOURCE_LABELS[o.source] || o.source}
                  </Badge>
                </div>
              </div>
              <span className="text-xs font-bold">{formatCurrency(o.total)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
