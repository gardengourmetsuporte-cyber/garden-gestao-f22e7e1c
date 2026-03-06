import { useState, useRef, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { DesktopActionBar } from '@/components/layout/DesktopActionBar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDeliveries, type DeliveryStatus } from '@/hooks/useDeliveries';
import { useUnit } from '@/contexts/UnitContext';
import { DeliveryCard } from '@/components/deliveries/DeliveryCard';
import { DeliveryOcrSheet } from '@/components/deliveries/DeliveryOcrSheet';
import { DeliveryMap, type DeliveryMapHandle } from '@/components/deliveries/DeliveryMap';
import { PageLoader } from '@/components/PageLoader';
import { useFabAction } from '@/contexts/FabActionContext';
import { Truck, Clock, CheckCircle2, Package, MapPin, Filter } from 'lucide-react';

const FILTERS: { key: DeliveryStatus | 'all'; label: string; icon: typeof Package }[] = [
  { key: 'all', label: 'Todas', icon: Package },
  { key: 'pending', label: 'Pendentes', icon: Clock },
  { key: 'out', label: 'Em rota', icon: Truck },
  { key: 'delivered', label: 'Entregues', icon: CheckCircle2 },
];

export default function Deliveries() {
  const { activeUnit } = useUnit();
  const {
    deliveries,
    groupedByNeighborhood,
    isLoading,
    isProcessing,
    statusFilter,
    setStatusFilter,
    stats,
    processImage,
    uploadPhoto,
    createDelivery,
    updateStatus,
    invalidate,
  } = useDeliveries();

  const [sheetOpen, setSheetOpen] = useState(false);
  const mapHandleRef = useRef<DeliveryMapHandle>(null);

  const handleCardClick = useCallback((deliveryId: string) => {
    mapHandleRef.current?.focusDelivery(deliveryId);
  }, []);

  useFabAction(
    { icon: 'add', label: 'Nova Entrega', onClick: () => setSheetOpen(true) },
    []
  );

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

        {/* ── KPI Row ── */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { value: stats.pending, label: 'Pendentes', icon: Clock, gradient: 'from-amber-500/20 to-amber-600/5', text: 'text-amber-400', iconBg: 'bg-amber-500/15' },
            { value: stats.out, label: 'Em rota', icon: Truck, gradient: 'from-blue-500/20 to-blue-600/5', text: 'text-blue-400', iconBg: 'bg-blue-500/15' },
            { value: stats.delivered, label: 'Entregues', icon: CheckCircle2, gradient: 'from-emerald-500/20 to-emerald-600/5', text: 'text-emerald-400', iconBg: 'bg-emerald-500/15' },
          ].map(({ value, label, icon: Icon, gradient, text, iconBg }) => (
            <div
              key={label}
              className={`relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br ${gradient} p-3 lg:p-4`}
            >
              <div className={`w-8 h-8 rounded-xl ${iconBg} flex items-center justify-center mb-2`}>
                <Icon className={`w-4 h-4 ${text}`} />
              </div>
              <p className={`text-2xl lg:text-3xl font-extrabold tabular-nums leading-none ${text}`}>
                {value}
              </p>
              <p className="text-[10px] lg:text-xs text-muted-foreground font-medium mt-1 uppercase tracking-wider">
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        <div className="grid grid-cols-4 gap-2">
          {FILTERS.map(({ key, label, icon: Icon }) => {
            const active = statusFilter === key;
            const count = key === 'all' ? stats.total : stats[key];
            return (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-[11px] font-semibold transition-all duration-200 ${
                  active
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                    : 'bg-card/70 text-muted-foreground border border-border/40 hover:bg-card hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
                <span className={`text-[10px] tabular-nums leading-none ${active ? 'opacity-80' : 'opacity-40'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Main Content: Map + List ── */}
        <div className="flex flex-col lg:grid lg:grid-cols-12 lg:gap-5 gap-4">
          {/* Map Section */}
          <div className="lg:col-span-5 lg:sticky lg:top-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                <MapPin className="w-3.5 h-3.5 text-primary" />
              </div>
              <h2 className="text-sm font-semibold">Mapa de entregas</h2>
              <Badge variant="secondary" className="text-[10px] h-5 px-1.5 tabular-nums ml-auto">
                {stats.total} total
              </Badge>
            </div>
            <DeliveryMap
              ref={mapHandleRef}
              deliveries={deliveries}
              unitName={activeUnit?.name || ''}
              onStatusChange={(id, status) => updateStatus({ id, status })}
              onRefresh={invalidate}
            />
          </div>

          {/* List Section */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                <Filter className="w-3.5 h-3.5 text-primary" />
              </div>
              <h2 className="text-sm font-semibold">Entregas por bairro</h2>
            </div>

            {groupedByNeighborhood.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-border/30 bg-card/20">
                <div className="w-16 h-16 rounded-2xl bg-muted/20 flex items-center justify-center mb-4">
                  <Package className="w-8 h-8 text-muted-foreground/20" />
                </div>
                <p className="text-sm font-semibold text-muted-foreground">Nenhuma entrega</p>
                <p className="text-xs text-muted-foreground/50 mt-1.5 max-w-[220px] leading-relaxed">
                  Tire foto de um pedido para cadastrar automaticamente
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {groupedByNeighborhood.map((group) => (
                  <NeighborhoodGroup
                    key={group.neighborhood}
                    neighborhood={group.neighborhood}
                    deliveries={group.deliveries}
                    onStatusChange={(id, status) => updateStatus({ id, status })}
                    onCardClick={handleCardClick}
                  />
                ))}
              </div>
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
    </AppLayout>
  );
}

/* ── Neighborhood Group ── */
function NeighborhoodGroup({
  neighborhood,
  deliveries,
  onStatusChange,
  onCardClick,
}: {
  neighborhood: string;
  deliveries: import('@/hooks/useDeliveries').Delivery[];
  onStatusChange: (id: string, status: DeliveryStatus) => void;
  onCardClick?: (deliveryId: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-border/30 bg-card/50 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 px-3.5 py-2.5 w-full border-b border-border/20 bg-card/80 hover:bg-card transition-colors"
      >
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <MapPin className="w-4 h-4 text-primary" />
        </div>
        <span className="font-semibold text-[13px] flex-1 truncate text-left">{neighborhood}</span>
        <Badge className="bg-primary/10 text-primary border-0 text-[10px] h-5 px-2 font-bold tabular-nums">
          {deliveries.length}
        </Badge>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="p-2 space-y-1.5">
          {deliveries.map((delivery) => (
            <DeliveryCard
              key={delivery.id}
              delivery={delivery}
              onStatusChange={onStatusChange}
              onCardClick={onCardClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
