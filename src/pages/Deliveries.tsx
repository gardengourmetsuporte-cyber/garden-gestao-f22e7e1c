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
      <div className="space-y-4 pb-24 lg:pb-12 px-4 pt-3 lg:px-8 lg:max-w-6xl lg:mx-auto">
        <DesktopActionBar label="Nova Entrega" onClick={() => setSheetOpen(true)} />

        {/* Resumo */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-sm p-3 text-center">
            <p className="text-xl font-bold" style={{ color: 'hsl(var(--neon-amber))' }}>{stats.pending}</p>
            <p className="text-[11px] text-muted-foreground">Pendentes</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-sm p-3 text-center">
            <p className="text-xl font-bold" style={{ color: 'hsl(var(--color-transfer))' }}>{stats.out}</p>
            <p className="text-[11px] text-muted-foreground">Em rota</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-sm p-3 text-center">
            <p className="text-xl font-bold" style={{ color: 'hsl(var(--color-income))' }}>{stats.delivered}</p>
            <p className="text-[11px] text-muted-foreground">Entregues</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="rounded-2xl border border-border/60 bg-card/50 p-2">
          <div className="flex items-center justify-between gap-2 px-1 pb-1">
            <p className="text-xs font-medium text-muted-foreground">Filtrar entregas</p>
            <span className="text-xs text-muted-foreground">{stats.total} total</span>
          </div>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {STATUS_CHIPS.map((chip) => (
              <Button
                key={chip.key}
                variant={statusFilter === chip.key ? 'default' : 'outline'}
                size="sm"
                className="h-8 text-xs gap-1.5 shrink-0 rounded-full px-3"
                onClick={() => setStatusFilter(chip.key)}
              >
                <AppIcon name={chip.icon} size={14} /> {chip.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Mapa */}
        <section className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <AppIcon name="map" size={16} className="text-primary" />
            <h2 className="text-sm font-semibold">Rota no mapa</h2>
          </div>
          <DeliveryMap
            deliveries={deliveries}
            onStatusChange={(id, status) => updateStatus({ id, status })}
            onRefresh={invalidate}
          />
        </section>

        {/* Lista */}
        {groupedByNeighborhood.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center rounded-2xl border border-border/60 bg-card/40">
            <AppIcon name="location_on" size={40} className="text-muted-foreground/20 mb-2" />
            <p className="text-sm font-medium text-muted-foreground">Nenhuma entrega encontrada</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Tire foto de um pedido para começar</p>
          </div>
        ) : (
          <section className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <AppIcon name="view_list" size={16} className="text-primary" />
              <h2 className="text-sm font-semibold">Entregas por bairro</h2>
            </div>
            <div className="space-y-3">
              {groupedByNeighborhood.map((group) => (
                <div key={group.neighborhood} className="rounded-2xl border border-border/60 bg-card/30 p-2">
                  <div className="flex items-center gap-2 px-1 py-1.5">
                    <AppIcon name="location_on" size={14} className="text-primary" />
                    <span className="font-semibold text-sm">{group.neighborhood}</span>
                    <Badge variant="secondary" className="text-[10px] h-5 px-2">
                      {group.deliveries.length}
                    </Badge>
                  </div>
                  <div className="space-y-2">
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
          </section>
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

