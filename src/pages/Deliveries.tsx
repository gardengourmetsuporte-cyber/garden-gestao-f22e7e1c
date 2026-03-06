import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { DesktopActionBar } from '@/components/layout/DesktopActionBar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppIcon } from '@/components/ui/app-icon';
import { useDeliveries, type DeliveryStatus } from '@/hooks/useDeliveries';
import { DeliveryCard } from '@/components/deliveries/DeliveryCard';
import { DeliveryOcrSheet } from '@/components/deliveries/DeliveryOcrSheet';
import { DeliveryMap } from '@/components/deliveries/DeliveryMap';
import { PageLoader } from '@/components/PageLoader';
import { useFabAction } from '@/contexts/FabActionContext';

const STATUS_CHIPS: { key: DeliveryStatus | 'all'; label: string; icon: string }[] = [
  { key: 'all', label: 'Todas', icon: 'package_2' },
  { key: 'pending', label: 'Pendentes', icon: 'schedule' },
  { key: 'out', label: 'Em rota', icon: 'local_shipping' },
  { key: 'delivered', label: 'Entregues', icon: 'check_circle' },
];

export default function Deliveries() {
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
      <div className="space-y-3 pb-24 lg:pb-12 px-4 pt-3 lg:px-8 lg:max-w-6xl lg:mx-auto">
        <DesktopActionBar label="Nova Entrega" onClick={() => setSheetOpen(true)} />

        {/* ── Compact stats row ── */}
        <div className="flex items-center gap-3 px-1">
          <StatPill value={stats.pending} label="Pendentes" color="var(--neon-amber)" />
          <StatPill value={stats.out} label="Em rota" color="var(--color-transfer)" />
          <StatPill value={stats.delivered} label="Entregues" color="var(--color-income)" />
          <span className="ml-auto text-xs text-muted-foreground font-medium">{stats.total} total</span>
        </div>

        {/* ── Filter chips ── */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {STATUS_CHIPS.map((chip) => (
            <Button
              key={chip.key}
              variant={statusFilter === chip.key ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-[11px] gap-1 shrink-0 rounded-full px-3"
              onClick={() => setStatusFilter(chip.key)}
            >
              <AppIcon name={chip.icon} size={13} /> {chip.label}
            </Button>
          ))}
        </div>

        {/* ── Map (always visible, compact) ── */}
        <DeliveryMap
          deliveries={deliveries}
          onStatusChange={(id, status) => updateStatus({ id, status })}
          onRefresh={invalidate}
        />

        {/* ── Delivery list by neighborhood ── */}
        {groupedByNeighborhood.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <AppIcon name="location_on" size={40} className="text-muted-foreground/20 mb-2" />
            <p className="text-sm font-medium text-muted-foreground">Nenhuma entrega encontrada</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Tire foto de um pedido para começar</p>
          </div>
        ) : (
          <div className="space-y-2">
            {groupedByNeighborhood.map((group) => (
              <div key={group.neighborhood}>
                {/* Neighborhood header */}
                <div className="flex items-center gap-2 px-1 py-1.5">
                  <AppIcon name="location_on" size={14} className="text-primary" />
                  <span className="font-semibold text-xs">{group.neighborhood}</span>
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5 min-w-0">
                    {group.deliveries.length}
                  </Badge>
                </div>
                {/* Cards */}
                <div className="space-y-1.5">
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

/* ── Inline stat pill ── */
function StatPill({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-lg font-bold leading-none" style={{ color: `hsl(${color})` }}>
        {value}
      </span>
      <span className="text-[10px] text-muted-foreground leading-tight">{label}</span>
    </div>
  );
}
