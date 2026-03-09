import { useState, useRef, useCallback, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { DesktopActionBar } from '@/components/layout/DesktopActionBar';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { useDeliveries, type DeliveryStatus, type Delivery } from '@/hooks/useDeliveries';
import { useUnit } from '@/contexts/UnitContext';
import { DeliveryCard } from '@/components/deliveries/DeliveryCard';
import { DeliveryOcrSheet } from '@/components/deliveries/DeliveryOcrSheet';
import { DeliveryMap, type DeliveryMapHandle } from '@/components/deliveries/DeliveryMap';
import { DeliveryLocationPicker } from '@/components/deliveries/DeliveryLocationPicker';
import { DeliveryEditSheet } from '@/components/deliveries/DeliveryEditSheet';
import { PageLoader } from '@/components/PageLoader';
import { useFabAction } from '@/contexts/FabActionContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const FILTERS: { key: DeliveryStatus | 'all'; label: string; icon: string }[] = [
  { key: 'all', label: 'Todas', icon: 'Package' },
  { key: 'pending', label: 'Pendentes', icon: 'schedule' },
  { key: 'out', label: 'Em rota', icon: 'local_shipping' },
  { key: 'delivered', label: 'Entregues', icon: 'check_circle' },
];

export default function Deliveries() {
  const { activeUnit, activeUnitId } = useUnit();
  const {
    deliveries, allDeliveries, groupedByNeighborhood, isLoading, isProcessing,
    statusFilter, setStatusFilter, stats,
    processImage, uploadPhoto, createDelivery, updateStatus, updateAddress, deleteDelivery, invalidate,
  } = useDeliveries();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [locationPickerDelivery, setLocationPickerDelivery] = useState<Delivery | null>(null);
  const [editDelivery, setEditDelivery] = useState<Delivery | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [dispatchMode, setDispatchMode] = useState(false);
  const mapHandleRef = useRef<DeliveryMapHandle>(null);

  // Pending digital menu orders that need delivery
  const { data: pendingMenuOrders = [] } = useQuery({
    queryKey: ['delivery-pending-orders', activeUnitId],
    queryFn: async () => {
      if (!activeUnitId) return [];
      // Get tablet orders with delivery source that are confirmed but not yet in deliveries
      const { data: tabletOrders } = await supabase
        .from('tablet_orders')
        .select('id, customer_name, total, status, source, created_at, table_number, tablet_order_items(id, quantity, notes, tablet_products(name))')
        .eq('unit_id', activeUnitId)
        .eq('source', 'delivery')
        .in('status', ['confirmed', 'preparing'])
        .order('created_at', { ascending: false })
        .limit(50);

      // Get delivery hub orders that are ready/dispatched
      const { data: hubOrders } = await supabase
        .from('delivery_hub_orders')
        .select('id, customer_name, customer_address, total, status, platform, platform_display_id, created_at, delivery_hub_order_items(id, name, quantity)')
        .eq('unit_id', activeUnitId)
        .in('status', ['ready', 'dispatched'])
        .order('created_at', { ascending: false })
        .limit(50);

      return [
        ...(tabletOrders || []).map((o: any) => ({
          type: 'menu' as const,
          id: o.id,
          customer_name: o.customer_name || `Mesa ${o.table_number}`,
          total: o.total || 0,
          status: o.status,
          source: 'Cardápio Digital',
          items: (o.tablet_order_items || []).map((i: any) => `${i.quantity}x ${i.tablet_products?.name || '?'}`).join(', '),
          created_at: o.created_at,
        })),
        ...(hubOrders || []).map((o: any) => ({
          type: 'hub' as const,
          id: o.id,
          customer_name: o.customer_name || '—',
          customer_address: o.customer_address,
          total: o.total || 0,
          status: o.status,
          source: o.platform === 'ifood' ? 'iFood' : o.platform === 'rappi' ? 'Rappi' : o.platform,
          displayId: o.platform_display_id,
          items: (o.delivery_hub_order_items || []).map((i: any) => `${i.quantity}x ${i.name}`).join(', '),
          created_at: o.created_at,
        })),
      ];
    },
    enabled: !!activeUnitId,
    refetchInterval: 30000,
  });

  const handleCardClick = useCallback((deliveryId: string) => {
    if (dispatchMode) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        if (next.has(deliveryId)) next.delete(deliveryId);
        else next.add(deliveryId);
        return next;
      });
    } else {
      mapHandleRef.current?.focusDelivery(deliveryId);
    }
  }, [dispatchMode]);

  const handleDispatchSelected = async () => {
    if (selectedIds.size === 0) return;
    try {
      for (const id of selectedIds) {
        await updateStatus({ id, status: 'out' });
      }
      toast.success(`${selectedIds.size} entrega(s) despachada(s)!`);
      setSelectedIds(new Set());
      setDispatchMode(false);
    } catch {
      toast.error('Erro ao despachar entregas');
    }
  };

  const handleArchive = async (delivery: Delivery) => {
    try {
      await deleteDelivery(delivery.id);
    } catch {}
  };

  const handleImportOrder = async (order: typeof pendingMenuOrders[0]) => {
    try {
      const address = order.type === 'hub' ? (order as any).customer_address || '' : '';
      await createDelivery({
        ocrResult: {
          order_number: order.type === 'hub' ? ((order as any).displayId || order.id.slice(0, 8)) : order.id.slice(0, 8),
          customer_name: order.customer_name,
          full_address: address,
          neighborhood: '',
          city: '',
          reference: '',
          items_summary: order.items,
          total: order.total,
        },
        photoUrl: null,
      });
      toast.success(`Pedido ${order.source} importado!`);
    } catch {}
  };

  useFabAction({ icon: 'add', label: 'Nova Entrega', onClick: () => setSheetOpen(true) }, []);

  const handleConfirm = async (ocrResult: any, file: File) => {
    try {
      let photoUrl: string | null = null;
      try { photoUrl = await uploadPhoto(file); } catch {}
      await createDelivery({ ocrResult, photoUrl });
    } catch {}
  };

  if (isLoading) return <AppLayout><PageLoader /></AppLayout>;

  return (
    <AppLayout>
      <div className="pb-28 lg:pb-12 px-4 pt-2 lg:px-8 lg:max-w-7xl lg:mx-auto space-y-4">
        <DesktopActionBar label="Nova Entrega" onClick={() => setSheetOpen(true)} />

        {/* ── Stats + Filters as Cards ── */}
        <div className="grid grid-cols-4 gap-2">
          {FILTERS.map(({ key, label, icon }) => {
            const active = statusFilter === key;
            const count = key === 'all' ? stats.total : stats[key];
            const colors: Record<string, string> = {
              all: 'text-foreground',
              pending: 'text-amber-500',
              out: 'text-primary',
              delivered: 'text-success',
            };
            return (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={cn(
                  "flex flex-col items-center gap-1 p-3 rounded-2xl transition-all",
                  active
                    ? "bg-primary/15 ring-1 ring-primary/30"
                    : "bg-card/60 border border-border/20 hover:bg-card/80"
                )}
              >
                <AppIcon name={icon} size={20} fill={active ? 1 : 0} className={colors[key]} />
                <span className={cn("text-2xl font-black tabular-nums leading-none", colors[key])}>{count}</span>
                <span className="text-[10px] text-muted-foreground font-medium truncate w-full text-center">{label}</span>
              </button>
            );
          })}
        </div>

        {/* Pending orders from digital menu / iFood */}
        {pendingMenuOrders.length > 0 && (
          <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center">
                  <AppIcon name="ShoppingBag" size={16} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Pedidos aguardando entrega</p>
                  <p className="text-[10px] text-muted-foreground">{pendingMenuOrders.length} pedido(s) do cardápio digital e hubs</p>
                </div>
              </div>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {pendingMenuOrders.map(order => (
                <div key={order.id} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-card/80 border border-border/20">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/15 text-primary">{order.source}</span>
                      <span className="text-xs font-semibold text-foreground truncate">{order.customer_name}</span>
                    </div>
                    {order.items && (
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">{order.items}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-primary tabular-nums">
                      R$ {order.total.toFixed(2)}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[10px] px-2 rounded-lg font-semibold"
                      onClick={() => handleImportOrder(order)}
                    >
                      <AppIcon name="Plus" size={14} className="mr-1" />
                      Importar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dispatch mode bar */}
        {dispatchMode && (
          <div className="flex items-center justify-between p-3 rounded-2xl bg-primary/10 border border-primary/30">
            <div className="flex items-center gap-2">
              <AppIcon name="Truck" size={18} className="text-primary" />
              <span className="text-xs font-bold text-foreground">
                {selectedIds.size > 0 ? `${selectedIds.size} selecionada(s)` : 'Toque nas entregas para selecionar'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" className="h-8 text-xs rounded-lg" onClick={() => { setDispatchMode(false); setSelectedIds(new Set()); }}>
                Cancelar
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs rounded-lg font-bold"
                disabled={selectedIds.size === 0}
                onClick={handleDispatchSelected}
              >
                <AppIcon name="Send" size={14} className="mr-1" />
                Despachar
              </Button>
            </div>
          </div>
        )}

        {/* Dispatch button when not in dispatch mode */}
        {!dispatchMode && stats.pending > 0 && (
          <Button
            variant="outline"
            className="w-full h-10 rounded-xl text-xs font-semibold gap-2"
            onClick={() => setDispatchMode(true)}
          >
            <AppIcon name="Truck" size={16} className="text-primary" />
            Selecionar para despachar ({stats.pending} pendente{stats.pending > 1 ? 's' : ''})
          </Button>
        )}

        {/* ── Main Content ── */}
        <div className="flex flex-col lg:grid lg:grid-cols-12 lg:gap-5 gap-4">
          {/* Map */}
          <div className="lg:col-span-5 lg:sticky lg:top-4">
            <div className="rounded-2xl overflow-hidden border border-border/20" style={{ height: 'calc(55vh - 40px)', minHeight: 320 }}>
              <DeliveryMap
                ref={mapHandleRef}
                deliveries={deliveries}
                unitName={activeUnit?.name || ''}
                onStatusChange={(id, status) => updateStatus({ id, status })}
                onRefresh={invalidate}
              />
            </div>
          </div>

          {/* List */}
          <div className="lg:col-span-7 space-y-2.5">
            {groupedByNeighborhood.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-dashed border-border/20 bg-card/20">
                <div className="w-14 h-14 rounded-2xl bg-muted/15 flex items-center justify-center mb-3">
                  <AppIcon name="local_shipping" size={28} className="text-muted-foreground/30" />
                </div>
                <p className="text-sm font-semibold text-muted-foreground">Nenhuma entrega</p>
                <p className="text-xs text-muted-foreground/50 mt-1 max-w-[200px]">
                  Tire foto de um pedido para cadastrar
                </p>
              </div>
            ) : (
              groupedByNeighborhood.map((group) => (
                <NeighborhoodGroup
                  key={group.neighborhood}
                  neighborhood={group.neighborhood}
                  deliveries={group.deliveries}
                  selectedIds={selectedIds}
                  dispatchMode={dispatchMode}
                  onStatusChange={(id, status) => updateStatus({ id, status })}
                  onCardClick={handleCardClick}
                  onSetLocation={setLocationPickerDelivery}
                  onEdit={setEditDelivery}
                  onArchive={handleArchive}
                  onSelect={(id) => {
                    setSelectedIds(prev => {
                      const next = new Set(prev);
                      if (next.has(id)) next.delete(id);
                      else next.add(id);
                      return next;
                    });
                  }}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <DeliveryOcrSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onConfirm={handleConfirm}
        processImage={processImage}
        isProcessing={isProcessing}
      />

      <DeliveryLocationPicker
        open={!!locationPickerDelivery}
        onOpenChange={(open) => { if (!open) setLocationPickerDelivery(null); }}
        delivery={locationPickerDelivery}
        onConfirm={(id, lat, lng) => updateAddress({ id, lat, lng })}
      />

      <DeliveryEditSheet
        open={!!editDelivery}
        onOpenChange={(open) => { if (!open) setEditDelivery(null); }}
        delivery={editDelivery}
        onSaved={invalidate}
      />
    </AppLayout>
  );
}

/* ── Neighborhood Group ── */
function NeighborhoodGroup({
  neighborhood, deliveries, selectedIds, dispatchMode, onStatusChange, onCardClick, onSetLocation, onEdit, onArchive, onSelect,
}: {
  neighborhood: string;
  deliveries: Delivery[];
  selectedIds: Set<string>;
  dispatchMode: boolean;
  onStatusChange: (id: string, status: DeliveryStatus) => void;
  onCardClick?: (deliveryId: string) => void;
  onSetLocation?: (delivery: Delivery) => void;
  onEdit?: (delivery: Delivery) => void;
  onArchive?: (delivery: Delivery) => void;
  onSelect?: (deliveryId: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-card border border-border/40 rounded-2xl overflow-hidden relative">
      <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-primary" />

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 pl-5 pr-4 py-3.5 text-left hover:bg-secondary/30 transition-colors"
      >
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
          <AppIcon name="location_on" size={20} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground truncate">{neighborhood}</p>
          <p className="text-[11px] text-muted-foreground">{deliveries.length} entrega{deliveries.length !== 1 ? 's' : ''}</p>
        </div>
        <AppIcon
          name="expand_more"
          size={18}
          className={cn("text-muted-foreground transition-transform duration-200", open && "rotate-180")}
        />
      </button>
      {open && (
        <div className="px-4 pb-3 space-y-1.5">
          {deliveries.map((delivery) => (
            <DeliveryCard
              key={delivery.id}
              delivery={delivery}
              selected={selectedIds.has(delivery.id)}
              onStatusChange={onStatusChange}
              onCardClick={dispatchMode ? undefined : onCardClick}
              onSetLocation={onSetLocation}
              onEdit={onEdit}
              onArchive={onArchive}
              onSelect={dispatchMode ? onSelect : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
