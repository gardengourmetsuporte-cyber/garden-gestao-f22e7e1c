import { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useUnit } from '@/contexts/UnitContext';
import { supabase } from '@/integrations/supabase/client';
import { AppIcon } from '@/components/ui/AppIcon';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PageLoader } from '@/components/PageLoader';

interface TabletOrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  notes: string | null;
  tablet_products: { name: string } | null;
}

interface TabletOrder {
  id: string;
  comanda_number: number;
  table_number: number;
  status: string;
  total: number;
  created_at: string;
  customer_name: string | null;
  notes: string | null;
  order_number: number | null;
  tablet_order_items: TabletOrderItem[];
}

interface FichaGroup {
  comanda_number: number;
  table_number: number;
  orders: TabletOrder[];
  total: number;
  orderCount: number;
  allDelivered: boolean;
  latestOrderAt: string;
}

export default function Fichas() {
  const { activeUnit } = useUnit();
  const [orders, setOrders] = useState<TabletOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFicha, setSelectedFicha] = useState<FichaGroup | null>(null);
  const [closingFicha, setClosingFicha] = useState(false);

  const fetchOrders = async () => {
    if (!activeUnit?.id) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('tablet_orders')
      .select('id, comanda_number, table_number, status, total, created_at, customer_name, notes, order_number, tablet_order_items(id, quantity, unit_price, notes, tablet_products(name))')
      .eq('unit_id', activeUnit.id)
      .not('comanda_number', 'is', null)
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching fichas:', error);
      toast.error('Erro ao carregar fichas');
    } else {
      setOrders((data as unknown as TabletOrder[]) || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [activeUnit?.id]);

  // Realtime subscription
  useEffect(() => {
    if (!activeUnit?.id) return;
    const channel = supabase
      .channel('fichas-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tablet_orders',
        filter: `unit_id=eq.${activeUnit.id}`,
      }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeUnit?.id]);

  const fichas = useMemo<FichaGroup[]>(() => {
    const grouped: Record<number, FichaGroup> = {};
    for (const order of orders) {
      const num = order.comanda_number;
      if (!grouped[num]) {
        grouped[num] = {
          comanda_number: num,
          table_number: order.table_number,
          orders: [],
          total: 0,
          orderCount: 0,
          allDelivered: true,
          latestOrderAt: order.created_at,
        };
      }
      grouped[num].orders.push(order);
      grouped[num].total += order.total;
      grouped[num].orderCount += 1;
      if (order.status !== 'delivered' && order.status !== 'cancelled') {
        grouped[num].allDelivered = false;
      }
      if (order.created_at > grouped[num].latestOrderAt) {
        grouped[num].latestOrderAt = order.created_at;
      }
    }
    return Object.values(grouped).sort((a, b) => a.comanda_number - b.comanda_number);
  }, [orders]);

  const activeFichas = fichas.filter(f => !f.allDelivered);
  const totalValue = fichas.reduce((sum, f) => sum + f.total, 0);

  const handleCloseFicha = async (ficha: FichaGroup) => {
    setClosingFicha(true);
    const orderIds = ficha.orders
      .filter(o => o.status !== 'delivered' && o.status !== 'cancelled')
      .map(o => o.id);

    if (orderIds.length === 0) {
      toast.info('Todos os pedidos já foram finalizados');
      setClosingFicha(false);
      return;
    }

    for (const id of orderIds) {
      const { error } = await supabase
        .from('tablet_orders')
        .update({ status: 'delivered' })
        .eq('id', id);
      if (error) {
        toast.error('Erro ao fechar ficha');
        setClosingFicha(false);
        return;
      }
    }

    toast.success(`Ficha #${ficha.comanda_number} fechada com sucesso`);
    setClosingFicha(false);
    setSelectedFicha(null);
    fetchOrders();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-500/15 text-blue-500';
      case 'preparing': return 'bg-amber-500/15 text-amber-500';
      case 'ready': return 'bg-emerald-500/15 text-emerald-500';
      case 'delivered': return 'bg-muted text-muted-foreground';
      case 'cancelled': return 'bg-destructive/15 text-destructive';
      default: return 'bg-amber-500/15 text-amber-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'awaiting_confirmation': return 'Aguardando';
      case 'confirmed': return 'Confirmado';
      case 'preparing': return 'Preparando';
      case 'ready': return 'Pronto';
      case 'delivered': return 'Entregue';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  if (isLoading) {
    return <AppLayout><PageLoader /></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-background pb-24 lg:pb-12">
        <div className="px-4 py-3 lg:px-8 lg:max-w-5xl lg:mx-auto space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                <AppIcon name="receipt_long" size={20} className="text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Fichas</h1>
                <p className="text-[11px] text-muted-foreground">
                  {activeFichas.length} ativa{activeFichas.length !== 1 ? 's' : ''} · R$ {totalValue.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Fichas Grid */}
          {fichas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <AppIcon name="receipt_long" size={28} className="text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Nenhuma ficha ativa hoje</p>
              <p className="text-[11px] text-muted-foreground max-w-xs">
                As fichas aparecem automaticamente quando clientes fazem pedidos via tablet usando QR Code de comanda
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {fichas.map((ficha) => (
                <button
                  key={ficha.comanda_number}
                  onClick={() => setSelectedFicha(ficha)}
                  className={`bg-card rounded-2xl p-4 text-left transition-all active:scale-[0.97] space-y-2 ${
                    ficha.allDelivered ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-2xl font-black ${ficha.allDelivered ? 'text-muted-foreground' : 'text-primary'}`}>
                      #{ficha.comanda_number}
                    </span>
                    <div className={`w-2.5 h-2.5 rounded-full ${ficha.allDelivered ? 'bg-muted-foreground' : 'bg-emerald-500 animate-pulse'}`} />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <AppIcon name="table_restaurant" size={13} />
                      <span>Mesa {ficha.table_number}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <AppIcon name="shopping_bag" size={13} />
                      <span>{ficha.orderCount} pedido{ficha.orderCount !== 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  <div className="pt-1 border-t border-border/30">
                    <span className="text-sm font-bold text-foreground">
                      R$ {ficha.total.toFixed(2)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail Sheet */}
      <Sheet open={!!selectedFicha} onOpenChange={(open) => !open && setSelectedFicha(null)}>
        <SheetContent side="bottom" className="max-h-[85vh] rounded-t-2xl">
          {selectedFicha && (
            <div className="space-y-4 pb-6">
              <SheetHeader className="pb-0">
                <div className="flex items-center justify-between">
                  <SheetTitle className="flex items-center gap-2">
                    <span className="text-primary text-2xl font-black">#{selectedFicha.comanda_number}</span>
                    <span className="text-sm text-muted-foreground font-normal">· Mesa {selectedFicha.table_number}</span>
                  </SheetTitle>
                  <span className="text-lg font-bold text-foreground">
                    R$ {selectedFicha.total.toFixed(2)}
                  </span>
                </div>
              </SheetHeader>

              {/* Orders list */}
              <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                {selectedFicha.orders.map((order) => (
                  <div key={order.id} className="bg-secondary/40 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {order.order_number && (
                          <span className="text-xs font-medium text-muted-foreground">
                            Pedido #{order.order_number}
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(order.created_at), "HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>

                    {/* Items */}
                    <div className="space-y-1">
                      {order.tablet_order_items?.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-xs">
                          <span className="text-foreground">
                            {item.quantity}x {item.tablet_products?.name || 'Item'}
                          </span>
                          <span className="text-muted-foreground">
                            R$ {(item.quantity * item.unit_price).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {order.notes && (
                      <p className="text-[10px] text-muted-foreground italic">📝 {order.notes}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Actions */}
              {!selectedFicha.allDelivered && (
                <button
                  onClick={() => handleCloseFicha(selectedFicha)}
                  disabled={closingFicha}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {closingFicha ? 'Fechando...' : 'Fechar Ficha'}
                </button>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
}
