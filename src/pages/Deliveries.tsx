import { useState, lazy, Suspense } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { DesktopActionBar } from '@/components/layout/DesktopActionBar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AppIcon } from '@/components/ui/app-icon';
import { useDeliveries, type DeliveryStatus } from '@/hooks/useDeliveries';
import { DeliveryCard } from '@/components/deliveries/DeliveryCard';
import { DeliveryOcrSheet } from '@/components/deliveries/DeliveryOcrSheet';
import { PageLoader } from '@/components/PageLoader';
import { useFabAction } from '@/contexts/FabActionContext';

const DeliveryMap = lazy(() => import('@/components/deliveries/DeliveryMap').then(m => ({ default: m.DeliveryMap })));

const STATUS_TABS: { key: DeliveryStatus | 'all'; label: string; icon: string }[] = [
  { key: 'all', label: 'Todas', icon: 'package_2' },
  { key: 'pending', label: 'Pendentes', icon: 'schedule' },
  { key: 'out', label: 'Em rota', icon: 'local_shipping' },
  { key: 'delivered', label: 'Entregues', icon: 'check_circle' },
];

export default function Deliveries() {
  const {
    groupedByNeighborhood,
    isLoading,
    isProcessing,
    isCreating,
    statusFilter,
    setStatusFilter,
    stats,
    processImage,
    uploadPhoto,
    createDelivery,
    updateStatus,
  } = useDeliveries();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  // Register FAB action
  useFabAction(
    { icon: 'add', label: 'Nova Entrega', onClick: () => setSheetOpen(true) },
    []
  );

  const handleConfirm = async (ocrResult: any, file: File) => {
    try {
      let photoUrl: string | null = null;
      try {
        photoUrl = await uploadPhoto(file);
      } catch { /* photo upload optional */ }
      await createDelivery({ ocrResult, photoUrl });
    } catch { /* error handled in hook */ }
  };

  if (isLoading) return <AppLayout><PageLoader /></AppLayout>;

  return (
    <AppLayout>
      <div className="space-y-4 pb-24 lg:pb-12 px-4 pt-3 lg:px-8 lg:max-w-6xl lg:mx-auto">
        <DesktopActionBar label="Nova Entrega" onClick={() => setSheetOpen(true)} />
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-border/60 bg-card p-3 text-center">
            <p className="text-2xl font-bold" style={{ color: 'hsl(var(--neon-amber))' }}>{stats.pending}</p>
            <p className="text-[10px] text-muted-foreground">Pendentes</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card p-3 text-center">
            <p className="text-2xl font-bold" style={{ color: 'hsl(var(--color-transfer))' }}>{stats.out}</p>
            <p className="text-[10px] text-muted-foreground">Em rota</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card p-3 text-center">
            <p className="text-2xl font-bold" style={{ color: 'hsl(var(--color-income))' }}>{stats.delivered}</p>
            <p className="text-[10px] text-muted-foreground">Entregues</p>
          </div>
        </div>

        {/* Filter tabs + view toggle */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar flex-1">
            {STATUS_TABS.map((tab) => (
              <Button
                key={tab.key}
                variant={statusFilter === tab.key ? 'default' : 'outline'}
                size="sm"
                className="h-8 text-xs gap-1.5 shrink-0 rounded-full"
                onClick={() => setStatusFilter(tab.key)}
              >
                <AppIcon name={tab.icon} size={14} /> {tab.label}
              </Button>
            ))}
          </div>
          <div className="flex gap-1 shrink-0">
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => setViewMode('list')}
            >
              <AppIcon name="view_list" size={16} />
            </Button>
            <Button
              variant={viewMode === 'map' ? 'default' : 'outline'}
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => setViewMode('map')}
            >
              <AppIcon name="map" size={16} />
            </Button>
          </div>
        </div>

        {/* Map or List view */}
        {viewMode === 'map' ? (
          <Suspense fallback={<PageLoader />}>
            <DeliveryMap
              deliveries={filteredDeliveries}
              onStatusChange={(id, status) => updateStatus({ id, status })}
            />
          </Suspense>
        ) : groupedByNeighborhood.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AppIcon name="location_on" size={48} className="text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Nenhuma entrega encontrada</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Tire foto de um pedido para começar</p>
          </div>
        ) : (
          groupedByNeighborhood.map((group) => (
            <Collapsible key={group.neighborhood} defaultOpen>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/50 hover:bg-secondary/80 transition-colors">
                  <div className="flex items-center gap-2">
                    <AppIcon name="location_on" size={16} className="text-primary" />
                    <span className="font-semibold text-sm">{group.neighborhood}</span>
                    <Badge variant="secondary" className="text-[10px] h-5">
                      {group.deliveries.length}
                    </Badge>
                  </div>
                  <AppIcon name="expand_more" size={16} className="text-muted-foreground transition-transform [[data-state=open]_&]:rotate-180" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-2 mt-2 pl-1">
                  {group.deliveries.map((delivery) => (
                    <DeliveryCard
                      key={delivery.id}
                      delivery={delivery}
                      onStatusChange={(id, status) => updateStatus({ id, status })}
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))
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