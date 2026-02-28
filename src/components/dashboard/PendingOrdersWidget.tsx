import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppIcon } from '@/components/ui/app-icon';
import { useOrders } from '@/hooks/useOrders';
import { startOfWeek, endOfWeek, isWithinInterval, parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export function PendingOrdersWidget() {
  const navigate = useNavigate();
  const { orders, updateOrderStatus } = useOrders();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const pendingThisWeek = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    return orders.filter(o => {
      if (o.status !== 'draft' && o.status !== 'sent') return false;
      const created = parseISO(o.created_at);
      return isWithinInterval(created, { start: weekStart, end: weekEnd }) || created < weekStart;
    });
  }, [orders]);

  const handleSend = async (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSendingId(orderId);
    try {
      await updateOrderStatus(orderId, 'sent');
      toast.success('Pedido enviado!', {
        action: {
          label: 'Ver pedidos',
          onClick: () => navigate('/orders'),
        },
        cancel: {
          label: 'Desfazer',
          onClick: async () => {
            await updateOrderStatus(orderId, 'draft');
            toast.info('Pedido voltou para rascunho');
          },
        },
      });
    } catch {
      toast.error('Erro ao enviar pedido');
    } finally {
      setSendingId(null);
    }
  };

  const handleMarkReceived = async (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSendingId(orderId);
    try {
      await updateOrderStatus(orderId, 'received');
      toast.success('Pedido marcado como recebido!', {
        action: {
          label: 'Ver pedidos',
          onClick: () => navigate('/orders'),
        },
        cancel: {
          label: 'Desfazer',
          onClick: async () => {
            await updateOrderStatus(orderId, 'sent');
            toast.info('Pedido voltou para enviado');
          },
        },
      });
    } catch {
      toast.error('Erro ao atualizar pedido');
    } finally {
      setSendingId(null);
    }
  };

  if (pendingThisWeek.length === 0) return null;

  return (
    <div className="card-command-info rounded-2xl animate-spring-in overflow-hidden">
      {/* Header */}
      <button
        onClick={() => navigate('/orders')}
        className="w-full text-left p-4 pb-3 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <AppIcon name="ShoppingCart" size={16} className="text-primary" />
          </div>
          <div>
            <span className="text-[11px] font-bold tracking-[0.1em] uppercase text-muted-foreground">
              Pedidos pendentes
            </span>
            <span className="text-[10px] font-semibold ml-2 px-2 py-0.5 rounded-full bg-primary/15 text-primary">
              {pendingThisWeek.length}
            </span>
          </div>
        </div>
        <AppIcon name="ChevronRight" size={16} className="text-muted-foreground" />
      </button>

      {/* Orders list */}
      <div className="px-4 pb-4 space-y-2">
        {pendingThisWeek.slice(0, 6).map(order => {
          const isExpanded = expandedId === order.id;
          const isSending = sendingId === order.id;
          const statusConfig = order.status === 'sent'
            ? { label: 'Enviado', cls: 'bg-success/10 text-success', icon: 'Send' }
            : { label: 'Rascunho', cls: 'bg-muted text-muted-foreground', icon: 'FileEdit' };

          const totalItems = order.order_items?.length || 0;

          return (
            <div key={order.id} className="rounded-xl border border-border/50 overflow-hidden transition-all duration-200">
              {/* Order row — tappable */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : order.id)}
                className="w-full flex items-center justify-between py-2.5 px-3 bg-secondary/50 hover:bg-primary/5 active:scale-[0.98] transition-all duration-200 text-left"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <AppIcon name="Package" size={14} className="text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {order.supplier?.name || 'Fornecedor'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {totalItems} ite{totalItems !== 1 ? 'ns' : 'm'} · {format(parseISO(order.created_at), "dd MMM", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", statusConfig.cls)}>
                    {statusConfig.label}
                  </span>
                  <AppIcon
                    name="ChevronDown"
                    size={14}
                    className={cn("text-muted-foreground transition-transform duration-300", isExpanded && "rotate-180")}
                  />
                </div>
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="px-3 py-3 bg-card border-t border-border/30 space-y-3 animate-fade-in">
                  {/* Item list */}
                  {order.order_items && order.order_items.length > 0 && (
                    <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
                      {order.order_items.map((oi: any) => (
                        <div key={oi.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-secondary/30">
                          <span className="text-xs text-foreground truncate flex-1 min-w-0">
                            {oi.item?.name || 'Item'}
                          </span>
                          <span className="text-xs font-semibold text-muted-foreground shrink-0 ml-2">
                            {oi.quantity} {oi.item?.unit_type || 'un'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {order.status === 'draft' && (
                      <Button
                        size="sm"
                        onClick={(e) => handleSend(order.id, e)}
                        disabled={isSending}
                        className="flex-1 h-9 rounded-xl text-xs font-bold gap-1.5"
                      >
                        <AppIcon name="Send" size={14} />
                        {isSending ? 'Enviando...' : 'Enviar pedido'}
                      </Button>
                    )}
                    {order.status === 'sent' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => handleMarkReceived(order.id, e)}
                        disabled={isSending}
                        className="flex-1 h-9 rounded-xl text-xs font-bold gap-1.5"
                      >
                        <AppIcon name="PackageCheck" size={14} />
                        {isSending ? 'Atualizando...' : 'Marcar recebido'}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => { e.stopPropagation(); navigate('/orders'); }}
                      className="h-9 rounded-xl text-xs px-3"
                    >
                      <AppIcon name="ExternalLink" size={14} />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {pendingThisWeek.length > 6 && (
          <button
            onClick={() => navigate('/orders')}
            className="text-[11px] text-primary font-semibold text-center w-full py-2 hover:underline"
          >
            Ver todos os {pendingThisWeek.length} pedidos →
          </button>
        )}
      </div>
    </div>
  );
}
