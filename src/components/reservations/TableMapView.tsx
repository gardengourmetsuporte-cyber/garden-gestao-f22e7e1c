import { useState } from 'react';
import { useRestaurantTables, type RestaurantTable } from '@/hooks/useRestaurantTables';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AppIcon } from '@/components/ui/app-icon';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; bgClass: string; iconName: string }> = {
  free: { label: 'Livre', bgClass: 'bg-emerald-500/15 border-emerald-500/30', iconName: 'Check' },
  occupied: { label: 'Ocupada', bgClass: 'bg-destructive/15 border-destructive/30', iconName: 'Users' },
  reserved: { label: 'Reservada', bgClass: 'bg-amber-500/15 border-amber-500/30', iconName: 'Clock' },
  cleaning: { label: 'Limpeza', bgClass: 'bg-blue-500/15 border-blue-500/30', iconName: 'Sparkles' },
};

export function TableMapView() {
  const { tables, isLoading, create, updateTable, remove } = useRestaurantTables();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState({ table_number: '', capacity: 4, zone: 'Salão' });

  const zones = [...new Set(tables.map(t => t.zone))];
  if (zones.length === 0) zones.push('Salão');

  const handleCreate = () => {
    if (!form.table_number.trim()) return;
    create.mutate(form);
    setSheetOpen(false);
    setForm({ table_number: '', capacity: 4, zone: 'Salão' });
  };

  const toggleStatus = (table: RestaurantTable) => {
    const order = ['free', 'occupied', 'reserved', 'cleaning'];
    const next = order[(order.indexOf(table.status) + 1) % order.length];
    updateTable.mutate({
      id: table.id,
      status: next,
      occupied_at: next === 'occupied' ? new Date().toISOString() : null,
    });
  };

  const stats = {
    total: tables.length,
    free: tables.filter(t => t.status === 'free').length,
    occupied: tables.filter(t => t.status === 'occupied').length,
    reserved: tables.filter(t => t.status === 'reserved').length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Mapa de Mesas</h2>
          <p className="text-xs text-muted-foreground">
            {stats.free} livres · {stats.occupied} ocupadas · {stats.reserved} reservadas
          </p>
        </div>
        <Button onClick={() => setSheetOpen(true)} className="rounded-xl gap-2" size="sm">
          <AppIcon name="Plus" size={14} />
          Mesa
        </Button>
      </div>

      {/* Legend */}
      <div className="flex gap-3 flex-wrap">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={cn('w-3 h-3 rounded-sm border', cfg.bgClass)} />
            <span className="text-[10px] text-muted-foreground">{cfg.label}</span>
          </div>
        ))}
      </div>

      {/* Tables grid by zone */}
      {zones.map(zone => {
        const zoneTables = tables.filter(t => t.zone === zone);
        if (zoneTables.length === 0) return null;
        return (
          <div key={zone}>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{zone}</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {zoneTables.map(table => {
                const cfg = STATUS_CONFIG[table.status] || STATUS_CONFIG.free;
                return (
                  <button
                    key={table.id}
                    onClick={() => toggleStatus(table)}
                    className={cn(
                      'relative aspect-square rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all active:scale-95',
                      cfg.bgClass,
                    )}
                  >
                    <span className="text-lg font-bold">{table.table_number}</span>
                    <div className="flex items-center gap-1">
                      <AppIcon name="Users" size={10} className="text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">{table.capacity}</span>
                    </div>
                    <Badge className={`text-[8px] px-1.5 py-0 h-4 ${cfg.bgClass} border-0`}>
                      {cfg.label}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {tables.length === 0 && (
        <Card className="border-border/50">
          <CardContent className="py-12 text-center">
            <AppIcon name="LayoutGrid" size={40} className="mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">Nenhuma mesa cadastrada</p>
            <p className="text-xs text-muted-foreground mt-1">Adicione mesas para visualizar o mapa do salão</p>
          </CardContent>
        </Card>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] rounded-t-2xl">
          <SheetHeader><SheetTitle>Nova Mesa</SheetTitle></SheetHeader>
          <div className="space-y-4 mt-4 pb-8">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Número da Mesa *</label>
              <Input value={form.table_number} onChange={e => setForm(f => ({ ...f, table_number: e.target.value }))} className="rounded-xl" placeholder="Ex: 1, A1, VIP" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Capacidade</label>
                <Input type="number" min={1} value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: Number(e.target.value) }))} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Zona</label>
                <Input value={form.zone} onChange={e => setForm(f => ({ ...f, zone: e.target.value }))} className="rounded-xl" placeholder="Salão" />
              </div>
            </div>
            <Button onClick={handleCreate} disabled={!form.table_number || create.isPending} className="w-full rounded-xl">
              {create.isPending ? 'Criando...' : 'Criar Mesa'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
