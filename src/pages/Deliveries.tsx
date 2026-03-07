import { useState, useRef, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { DesktopActionBar } from '@/components/layout/DesktopActionBar';
import { AppIcon } from '@/components/ui/app-icon';
import { useDeliveries, type DeliveryStatus, type Delivery } from '@/hooks/useDeliveries';
import { useUnit } from '@/contexts/UnitContext';
import { DeliveryCard } from '@/components/deliveries/DeliveryCard';
import { DeliveryOcrSheet } from '@/components/deliveries/DeliveryOcrSheet';
import { DeliveryMap, type DeliveryMapHandle } from '@/components/deliveries/DeliveryMap';
import { DeliveryLocationPicker } from '@/components/deliveries/DeliveryLocationPicker';
import { PageLoader } from '@/components/PageLoader';
import { useFabAction } from '@/contexts/FabActionContext';
import { cn } from '@/lib/utils';

const FILTERS: { key: DeliveryStatus | 'all'; label: string; icon: string }[] = [
  { key: 'all', label: 'Todas', icon: 'Package' },
  { key: 'pending', label: 'Pendentes', icon: 'schedule' },
  { key: 'out', label: 'Em rota', icon: 'local_shipping' },
  { key: 'delivered', label: 'Entregues', icon: 'check_circle' },
];

export default function Deliveries() {
  const { activeUnit } = useUnit();
  const {
    deliveries, groupedByNeighborhood, isLoading, isProcessing,
    statusFilter, setStatusFilter, stats,
    processImage, uploadPhoto, createDelivery, updateStatus, updateAddress, invalidate,
  } = useDeliveries();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [locationPickerDelivery, setLocationPickerDelivery] = useState<Delivery | null>(null);
  const mapHandleRef = useRef<DeliveryMapHandle>(null);

  const handleCardClick = useCallback((deliveryId: string) => {
    mapHandleRef.current?.focusDelivery(deliveryId);
  }, []);

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

        {/* ── Main Content ── */}
        <div className="flex flex-col lg:grid lg:grid-cols-12 lg:gap-5 gap-4">
          {/* Map — takes most of the viewport */}
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
                  onStatusChange={(id, status) => updateStatus({ id, status })}
                  onCardClick={handleCardClick}
                  onSetLocation={setLocationPickerDelivery}
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
    </AppLayout>
  );
}

/* ── Neighborhood Group ── */
function NeighborhoodGroup({
  neighborhood, deliveries, onStatusChange, onCardClick, onSetLocation,
}: {
  neighborhood: string;
  deliveries: Delivery[];
  onStatusChange: (id: string, status: DeliveryStatus) => void;
  onCardClick?: (deliveryId: string) => void;
  onSetLocation?: (delivery: Delivery) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-card border border-border/40 rounded-2xl overflow-hidden relative">
      {/* Accent bar */}
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
              onStatusChange={onStatusChange}
              onCardClick={onCardClick}
              onSetLocation={onSetLocation}
            />
          ))}
        </div>
      )}
    </div>
  );
}
