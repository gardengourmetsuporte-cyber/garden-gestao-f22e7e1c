import { useState } from 'react';
import { useDeliveryZones, DeliveryZone } from '@/hooks/useDeliveryZones';
import { useUnit } from '@/contexts/UnitContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AppIcon } from '@/components/ui/app-icon';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { formatCurrency } from '@/lib/format';

export function DeliveryZonesConfig() {
  const { activeUnitId } = useUnit();
  const { zones, isLoading, upsertZone, deleteZone, bulkAdjustTime } = useDeliveryZones();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<DeliveryZone> | null>(null);

  const openNew = () => {
    const lastMax = zones.length > 0 ? Math.max(...zones.map(z => Number(z.max_distance_km))) : 0;
    setEditing({
      name: `Zona ${zones.length + 1}`,
      min_distance_km: lastMax,
      max_distance_km: lastMax + 5,
      fee: 5,
      delivery_time_minutes: 60,
      is_active: true,
    });
    setSheetOpen(true);
  };

  const openEdit = (zone: DeliveryZone) => {
    setEditing({ ...zone });
    setSheetOpen(true);
  };

  const handleSave = () => {
    if (!editing || !activeUnitId) return;
    upsertZone.mutate({ ...editing, unit_id: activeUnitId } as any, {
      onSuccess: () => { setSheetOpen(false); setEditing(null); },
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <AppIcon name="MapPin" size={14} className="text-primary" />
            Zonas de Entrega
          </h4>
          <p className="text-[10px] text-muted-foreground mt-0.5">Configure raios, taxas e tempos por distância</p>
        </div>
        <Button size="sm" onClick={openNew}>
          <AppIcon name="Plus" size={14} className="mr-1" /> Nova Zona
        </Button>
      </div>

      {/* Global time adjuster */}
      {zones.length > 0 && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl border border-border/20 bg-card/50">
          <AppIcon name="Clock" size={14} className="text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground flex-1">Ajustar tempo geral</span>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="outline"
              className="h-7 w-7"
              disabled={bulkAdjustTime.isPending}
              onClick={() => bulkAdjustTime.mutate(-10)}
            >
              <AppIcon name="Minus" size={14} />
            </Button>
            <span className="text-xs font-medium w-12 text-center text-muted-foreground">±10 min</span>
            <Button
              size="icon"
              variant="outline"
              className="h-7 w-7"
              disabled={bulkAdjustTime.isPending}
              onClick={() => bulkAdjustTime.mutate(10)}
            >
              <AppIcon name="Plus" size={14} />
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground py-4 text-center">Carregando...</p>
      ) : zones.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground border border-dashed border-border/40 rounded-xl">
          <AppIcon name="MapPin" size={28} className="mx-auto mb-2 opacity-30" />
          <p className="text-xs">Nenhuma zona configurada</p>
          <p className="text-[10px] mt-0.5">Sem zonas, a taxa de entrega não será calculada</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {zones.map(zone => (
            <div
              key={zone.id}
              className="flex items-center gap-3 p-3 rounded-xl border border-border/20 bg-card/50"
            >
              <Switch
                checked={zone.is_active}
                onCheckedChange={v => upsertZone.mutate({ ...zone, is_active: v })}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{zone.name || `${zone.min_distance_km}–${zone.max_distance_km} km`}</p>
                <p className="text-xs text-muted-foreground">
                  {zone.min_distance_km}–{zone.max_distance_km} km → <span className="font-semibold text-foreground">{formatCurrency(Number(zone.fee))}</span>
                  <span className="ml-2 text-muted-foreground">• {zone.delivery_time_minutes} min</span>
                </p>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(zone)}>
                  <AppIcon name="Pencil" size={14} />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => {
                  if (confirm('Remover esta zona?')) deleteZone.mutate(zone.id);
                }}>
                  <AppIcon name="Trash2" size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editing?.id ? 'Editar Zona' : 'Nova Zona'}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Nome da zona</Label>
              <Input
                value={editing?.name || ''}
                onChange={e => setEditing(prev => prev ? { ...prev, name: e.target.value } : prev)}
                placeholder="Ex: Centro, Bairros próximos..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>De (km)</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  value={editing?.min_distance_km ?? 0}
                  onChange={e => setEditing(prev => prev ? { ...prev, min_distance_km: parseFloat(e.target.value) || 0 } : prev)}
                />
              </div>
              <div>
                <Label>Até (km)</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  value={editing?.max_distance_km ?? 5}
                  onChange={e => setEditing(prev => prev ? { ...prev, max_distance_km: parseFloat(e.target.value) || 0 } : prev)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Taxa (R$)</Label>
                <Input
                  type="number"
                  step="0.50"
                  min="0"
                  value={editing?.fee ?? 0}
                  onChange={e => setEditing(prev => prev ? { ...prev, fee: parseFloat(e.target.value) || 0 } : prev)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Tempo (min)</Label>
                <Input
                  type="number"
                  step="5"
                  min="10"
                  value={editing?.delivery_time_minutes ?? 60}
                  onChange={e => setEditing(prev => prev ? { ...prev, delivery_time_minutes: parseInt(e.target.value) || 60 } : prev)}
                  placeholder="60"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={editing?.is_active ?? true}
                onCheckedChange={v => setEditing(prev => prev ? { ...prev, is_active: v } : prev)}
              />
              <Label>Zona ativa</Label>
            </div>
            <Button onClick={handleSave} disabled={upsertZone.isPending} className="w-full">
              {upsertZone.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
