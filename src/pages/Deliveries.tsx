import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, Truck, MapPin, ChevronDown, Package, Clock, CheckCircle2 } from 'lucide-react';
import { useDeliveries, type DeliveryStatus } from '@/hooks/useDeliveries';
import { DeliveryCard } from '@/components/deliveries/DeliveryCard';
import { DeliveryOcrSheet } from '@/components/deliveries/DeliveryOcrSheet';
import { PageLoader } from '@/components/PageLoader';

const STATUS_TABS: { key: DeliveryStatus | 'all'; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: 'Todas', icon: <Package className="w-3.5 h-3.5" /> },
  { key: 'pending', label: 'Pendentes', icon: <Clock className="w-3.5 h-3.5" /> },
  { key: 'out', label: 'Em rota', icon: <Truck className="w-3.5 h-3.5" /> },
  { key: 'delivered', label: 'Entregues', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
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
      <div className="space-y-4 pb-24">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="card-base p-3 text-center">
            <p className="text-2xl font-bold" style={{ color: 'hsl(var(--neon-amber))' }}>{stats.pending}</p>
            <p className="text-[10px] text-muted-foreground">Pendentes</p>
          </div>
          <div className="card-base p-3 text-center">
            <p className="text-2xl font-bold" style={{ color: 'hsl(var(--color-transfer))' }}>{stats.out}</p>
            <p className="text-[10px] text-muted-foreground">Em rota</p>
          </div>
          <div className="card-base p-3 text-center">
            <p className="text-2xl font-bold" style={{ color: 'hsl(var(--color-income))' }}>{stats.delivered}</p>
            <p className="text-[10px] text-muted-foreground">Entregues</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {STATUS_TABS.map((tab) => (
            <Button
              key={tab.key}
              variant={statusFilter === tab.key ? 'default' : 'outline'}
              size="sm"
              className="h-8 text-xs gap-1 shrink-0"
              onClick={() => setStatusFilter(tab.key)}
            >
              {tab.icon} {tab.label}
            </Button>
          ))}
        </div>

        {/* Grouped deliveries */}
        {groupedByNeighborhood.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MapPin className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Nenhuma entrega encontrada</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Tire foto de um pedido para começar</p>
          </div>
        ) : (
          groupedByNeighborhood.map((group) => (
            <Collapsible key={group.neighborhood} defaultOpen>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-sm">{group.neighborhood}</span>
                    <Badge variant="secondary" className="text-[10px] h-5">
                      {group.deliveries.length}
                    </Badge>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform [[data-state=open]_&]:rotate-180" />
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

      {/* FAB */}
      <Button
        className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-lg shadow-primary/30"
        onClick={() => setSheetOpen(true)}
        disabled={isCreating}
      >
        <Plus className="w-6 h-6" />
      </Button>

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
