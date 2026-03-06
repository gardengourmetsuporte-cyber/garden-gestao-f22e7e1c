import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { DesktopActionBar } from '@/components/layout/DesktopActionBar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppIcon } from '@/components/ui/app-icon';
import { useDeliveries, type DeliveryStatus } from '@/hooks/useDeliveries';
import { useUnit } from '@/contexts/UnitContext';
import { DeliveryCard } from '@/components/deliveries/DeliveryCard';
import { DeliveryOcrSheet } from '@/components/deliveries/DeliveryOcrSheet';
import { DeliveryMap } from '@/components/deliveries/DeliveryMap';
import { PageLoader } from '@/components/PageLoader';
import { useFabAction } from '@/contexts/FabActionContext';
import { Truck, Clock, CheckCircle2, Package } from 'lucide-react';

const STATUS_CHIPS: { key: DeliveryStatus | 'all'; label: string; icon: string }[] = [
  { key: 'all', label: 'Todas', icon: 'package_2' },
  { key: 'pending', label: 'Pendentes', icon: 'schedule' },
  { key: 'out', label: 'Em rota', icon: 'local_shipping' },
  { key: 'delivered', label: 'Entregues', icon: 'check_circle' },
];

const STAT_CONFIG = [
  { key: 'pending' as const, label: 'Pendentes', icon: Clock, colorClass: 'text-amber-400', bgClass: 'bg-amber-500/10' },
  { key: 'out' as const, label: 'Em rota', icon: Truck, colorClass: 'text-blue-400', bgClass: 'bg-blue-500/10' },
  { key: 'delivered' as const, label: 'Entregues', icon: CheckCircle2, colorClass: 'text-emerald-400', bgClass: 'bg-emerald-500/10' },
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
      <div className="pb-24 lg:pb-12 px-4 pt-3 lg:px-8 lg:max-w-7xl lg:mx-auto">
        <DesktopActionBar label="Nova Entrega" onClick={() => setSheetOpen(true)} />

        {/* Stats + Filters row */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 lg:flex lg:gap-3 lg:shrink-0">
            {STAT_CONFIG.map(({ key, label, icon: Icon, colorClass, bgClass }) => (
              <button
                key={key}
                onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
                className={`rounded-2xl border p-3 text-center transition-all duration-200 ${
                  statusFilter === key
                    ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20'
                    : 'border-border/40 bg-card/60 hover:bg-card/80'
                } lg:min-w-[110px]`}
              >
                <div className={`inline-flex items-center justify-center w-8 h-8 rounded-xl ${bgClass} mb-1.5`}>
                  <Icon className={`w-4 h-4 ${colorClass}`} />
                </div>
                <p className={`text-2xl font-bold tabular-nums ${colorClass}`}>{stats[key]}</p>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mt-0.5">{label}</p>
              </button>
            ))}
          </div>

          {/* Filter chips */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-muted-foreground">Filtrar</span>
              <Badge variant="secondary" className="text-[10px] h-5 px-2 tabular-nums">
                {stats.total} total
              </Badge>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {STATUS_CHIPS.map((chip) => (
                <Button
                  key={chip.key}
                  variant={statusFilter === chip.key ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 text-xs gap-1.5 rounded-full px-3"
                  onClick={() => setStatusFilter(chip.key)}
                >
                  <AppIcon name={chip.icon} size={14} /> {chip.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop: Map + List side by side / Mobile: stacked */}
        <div className="mt-4 flex flex-col lg:grid lg:grid-cols-5 lg:gap-4 lg:items-start gap-4">
          {/* Map */}
          <div className="lg:col-span-2 lg:sticky lg:top-4">
            <DeliveryMap
              deliveries={deliveries}
              onStatusChange={(id, status) => updateStatus({ id, status })}
              onRefresh={invalidate}
            />
          </div>

          {/* List */}
          <div className="lg:col-span-3">
            {groupedByNeighborhood.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-dashed border-border/40 bg-card/30">
                <div className="w-14 h-14 rounded-2xl bg-muted/30 flex items-center justify-center mb-3">
                  <Package className="w-7 h-7 text-muted-foreground/30" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Nenhuma entrega encontrada</p>
                <p className="text-xs text-muted-foreground/60 mt-1 max-w-[200px]">
                  Tire foto de um pedido para começar
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {groupedByNeighborhood.map((group) => (
                  <div key={group.neighborhood} className="rounded-2xl border border-border/40 bg-card/40 overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-card/60 border-b border-border/30">
                      <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                        <AppIcon name="location_on" size={14} className="text-primary" />
                      </div>
                      <span className="font-semibold text-sm flex-1">{group.neighborhood}</span>
                      <Badge variant="secondary" className="text-[10px] h-5 px-2 tabular-nums">
                        {group.deliveries.length}
                      </Badge>
                    </div>
                    <div className="p-2 space-y-2">
                      {group.deliveries.map((delivery) => (
                        <DeliveryCard
                          key={delivery.id}
                          delivery={delivery}
                          onStatusChange={(id, status) => updateStatus({ id, status })}
                        />
                      ))}
                    </div>
                  </div>
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
