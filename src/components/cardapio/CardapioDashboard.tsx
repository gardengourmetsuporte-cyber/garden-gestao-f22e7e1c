import { useMemo } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDeliveryZones } from '@/hooks/useDeliveryZones';
import { formatCurrency } from '@/lib/format';
import { Button } from '@/components/ui/button';
import type { MenuGroup, MenuProduct } from '@/hooks/useMenuAdmin';
import type { TabletOrderAdmin } from '@/hooks/useTabletAdmin';

interface Props {
  onNavigate: (tab: string) => void;
  unitId?: string;
  menuLoading: boolean;
  products: MenuProduct[];
  groups: MenuGroup[];
  orders: TabletOrderAdmin[];
}

export function CardapioDashboard({ onNavigate, unitId, menuLoading, products, groups, orders }: Props) {
  const queryClient = useQueryClient();
  const { data: storeInfo, isLoading: storeLoading } = useQuery({
    queryKey: ['store-info', unitId],
    queryFn: async () => {
      if (!unitId) return null;
      const { data } = await supabase
        .from('units')
        .select('store_info')
        .eq('id', unitId)
        .maybeSingle();
      return (data?.store_info as any) || {};
    },
    enabled: !!unitId,
  });

  const todayStats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayOrders = orders.filter(o => o.created_at.slice(0, 10) === today);
    const revenue = todayOrders
      .filter(o => o.status === 'sent_to_pdv' || o.status === 'confirmed')
      .reduce((s, o) => s + (o.total || 0), 0);
    return {
      total: todayOrders.length,
      sent: todayOrders.filter(o => o.status === 'sent_to_pdv').length,
      pending: todayOrders.filter(o => o.status === 'confirmed' || o.status === 'awaiting_confirmation').length,
      errors: todayOrders.filter(o => o.status === 'error').length,
      revenue,
    };
  }, [orders]);

  const deactivatedCount = useMemo(() => products.filter(p => !p.is_active).length, [products]);
  const noImageCount = useMemo(() => products.filter(p => p.is_active && !p.image_url).length, [products]);

  if (menuLoading || storeLoading) {
    return (
      <div className="px-4 py-4 lg:px-6 space-y-3">
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 lg:px-6 space-y-4 pb-28">
      {/* Revenue card */}
      <button
        onClick={() => onNavigate('pedidos')}
        className="w-full text-left bg-card rounded-2xl p-5 active:scale-[0.98] transition-all"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center">
            <AppIcon name="TrendingUp" size={16} className="text-primary" />
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Faturamento hoje
          </span>
          <AppIcon name="ChevronRight" size={14} className="text-muted-foreground/40 ml-auto" />
        </div>
        <p className="text-3xl font-extrabold text-foreground" style={{ letterSpacing: '-0.03em' }}>
          {formatCurrency(todayStats.revenue)}
        </p>
        <div className="flex gap-4 mt-3">
          <div>
            <p className="text-lg font-extrabold text-foreground">{todayStats.sent}</p>
            <p className="text-[10px] text-muted-foreground font-medium">Enviados</p>
          </div>
          <div>
            <p className="text-lg font-extrabold text-foreground">{todayStats.pending}</p>
            <p className="text-[10px] text-muted-foreground font-medium">Pendentes</p>
          </div>
        </div>
      </button>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Pedidos Hoje', value: todayStats.total, icon: 'ShoppingBag' },
          { label: 'Enviados PDV', value: todayStats.sent, icon: 'CheckCircle2' },
          { label: 'Pendentes', value: todayStats.pending, icon: 'Clock' },
          { label: 'Erros', value: todayStats.errors, icon: 'AlertTriangle' },
        ].map(stat => (
          <button
            key={stat.label}
            onClick={() => onNavigate('pedidos')}
            className="bg-secondary/50 rounded-xl p-3 text-left active:scale-[0.97] transition-all"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
                <AppIcon name={stat.icon} size={16} className="text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{stat.label}</p>
                <p className="text-xl font-extrabold text-foreground" style={{ letterSpacing: '-0.03em' }}>
                  {stat.value}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Delivery Time */}
      <DeliveryTimeWidget unitId={unitId} onNavigate={onNavigate} />

      {/* Alerts */}
      {(deactivatedCount > 0 || noImageCount > 0) && (
        <div className="space-y-2">
          {deactivatedCount > 0 && (
            <button
              onClick={() => onNavigate('produtos')}
              className="w-full flex items-center gap-3 bg-secondary/50 rounded-xl p-3 text-left active:scale-[0.97] transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
                <AppIcon name="EyeOff" size={16} className="text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Desativados</p>
                <p className="text-xl font-extrabold text-foreground" style={{ letterSpacing: '-0.03em' }}>{deactivatedCount}</p>
              </div>
              <AppIcon name="ChevronRight" size={14} className="text-muted-foreground/40" />
            </button>
          )}
          {noImageCount > 0 && (
            <button
              onClick={() => onNavigate('produtos')}
              className="w-full flex items-center gap-3 bg-secondary/50 rounded-xl p-3 text-left active:scale-[0.97] transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
                <AppIcon name="ImageOff" size={16} className="text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Sem Foto</p>
                <p className="text-xl font-extrabold text-foreground" style={{ letterSpacing: '-0.03em' }}>{noImageCount}</p>
              </div>
              <AppIcon name="ChevronRight" size={14} className="text-muted-foreground/40" />
            </button>
          )}
        </div>
      )}

      {/* Menu Summary */}
      <div className="bg-secondary/50 rounded-xl p-4">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Resumo do Cardápio</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Ativos', value: products.filter(p => p.is_active).length },
            { label: 'Grupos', value: groups.length },
            { label: 'Destaques', value: products.filter(p => p.is_highlighted).length },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-lg font-extrabold text-foreground" style={{ letterSpacing: '-0.03em' }}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Delivery Time Widget ─── */
function DeliveryTimeWidget({ unitId, onNavigate }: { unitId?: string; onNavigate: (tab: string) => void }) {
  const { zones, isLoading, bulkAdjustTime } = useDeliveryZones();
  const queryClient = useQueryClient();

  const activeZones = zones.filter(z => z.is_active);
  const minTime = activeZones.length > 0 ? Math.min(...activeZones.map(z => z.delivery_time_minutes)) : 0;
  const maxTime = activeZones.length > 0 ? Math.max(...activeZones.map(z => z.delivery_time_minutes)) : 0;
  const timeRange = minTime === maxTime ? `${minTime} min` : `${minTime}–${maxTime} min`;

  if (isLoading) return <Skeleton className="h-20 rounded-xl" />;
  if (activeZones.length === 0) return null;

  const handleZoneAdjust = async (zoneId: string, delta: number) => {
    const zone = activeZones.find(z => z.id === zoneId);
    if (!zone || (zone.delivery_time_minutes + delta < 5)) return;
    const { error } = await supabase
      .from('delivery_zones')
      .update({ delivery_time_minutes: zone.delivery_time_minutes + delta, updated_at: new Date().toISOString() })
      .eq('id', zoneId);
    if (!error) queryClient.invalidateQueries({ queryKey: ['delivery-zones'] });
  };

  return (
    <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
            <AppIcon name="Clock" size={16} className="text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Tempo de Entrega</p>
            <p className="text-lg font-extrabold text-foreground leading-tight">{timeRange}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-xl"
            disabled={bulkAdjustTime.isPending || minTime <= 10}
            onClick={() => bulkAdjustTime.mutate(-10)}
          >
            <AppIcon name="Minus" size={14} />
          </Button>
          <span className="text-[10px] text-muted-foreground w-10 text-center font-medium">±10</span>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-xl"
            disabled={bulkAdjustTime.isPending}
            onClick={() => bulkAdjustTime.mutate(10)}
          >
            <AppIcon name="Plus" size={14} />
          </Button>
        </div>
      </div>

      <div className="space-y-1.5">
        {activeZones.map(zone => (
          <div key={zone.id} className="flex items-center justify-between px-2.5 py-2 rounded-lg bg-background/50">
            <span className="text-[10px] text-muted-foreground truncate flex-1">
              {zone.name || `Até ${zone.max_distance_km} km`}
            </span>
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={() => handleZoneAdjust(zone.id, -5)}
                disabled={zone.delivery_time_minutes <= 5}
                className="w-6 h-6 rounded-md bg-secondary hover:bg-secondary/80 flex items-center justify-center disabled:opacity-30"
              >
                <AppIcon name="Minus" size={10} />
              </button>
              <span className="text-[11px] font-bold text-foreground w-12 text-center">{zone.delivery_time_minutes} min</span>
              <button
                onClick={() => handleZoneAdjust(zone.id, 5)}
                className="w-6 h-6 rounded-md bg-secondary hover:bg-secondary/80 flex items-center justify-center"
              >
                <AppIcon name="Plus" size={10} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
