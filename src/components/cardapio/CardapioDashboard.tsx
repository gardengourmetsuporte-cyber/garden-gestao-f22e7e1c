import { useMemo, useState } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDeliveryZones } from '@/hooks/useDeliveryZones';
import { formatCurrency } from '@/lib/format';
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


  // Order stats
  const todayStats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayOrders = orders.filter(o => o.created_at.slice(0, 10) === today);
    const revenue = todayOrders
      .filter(o => o.status === 'sent_to_pdv' || o.status === 'confirmed')
      .reduce((s, o) => s + (o.total || 0), 0);
    return {
      total: todayOrders.length,
      sent: todayOrders.filter(o => o.status === 'sent_to_pdv').length,
      errors: todayOrders.filter(o => o.status === 'error').length,
      pending: todayOrders.filter(o => o.status === 'confirmed' || o.status === 'awaiting_confirmation').length,
      revenue,
    };
  }, [orders]);

  // Deactivated products
  const deactivatedProducts = useMemo(() => {
    return products.filter(p => !p.is_active);
  }, [products]);

  // Products without images
  const noImageProducts = useMemo(() => {
    return products.filter(p => p.is_active && !p.image_url);
  }, [products]);

  const formatPrice = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  if (menuLoading || storeLoading) {
    return (
      <div className="px-4 py-4 lg:px-6 space-y-4">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 lg:px-6 space-y-4 pb-28">
      {/* Revenue highlight card — matches finance-hero-card from main dashboard */}
      <div className="finance-hero-card w-full text-left animate-spring-in spring-stagger-2">
        <div className="finance-hero-inner p-5 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white/[0.08] flex items-center justify-center border border-white/[0.06]">
                <AppIcon name="TrendingUp" size={16} style={{ color: 'var(--gp-icon)' }} />
              </div>
              <span className="text-[11px] font-semibold tracking-[0.08em] uppercase" style={{ color: 'var(--gp-label)' }}>
                Faturamento Hoje
              </span>
            </div>
            <button
              onClick={() => onNavigate('pedidos')}
              className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/[0.08] transition-colors"
              aria-label="Ver pedidos"
            >
              <AppIcon name="ArrowRight" size={15} style={{ color: 'var(--gp-icon)' }} />
            </button>
          </div>

          <p
            className="text-[2.25rem] font-black tracking-[-0.03em] leading-none animate-number-reveal"
            style={{ color: 'var(--gp-value)' }}
          >
            {formatPrice(todayStats.revenue)}
          </p>

          {/* Stat chips */}
          <div className="flex gap-2.5 mt-5">
            <div className="finance-hero-chip">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center">
                  <AppIcon name="CheckCircle" size={11} style={{ color: 'var(--gp-positive)' }} />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--gp-sublabel)' }}>
                  Enviados
                </span>
              </div>
              <span className="text-[15px] font-bold tabular-nums" style={{ color: 'var(--gp-positive)' }}>
                {todayStats.sent}
              </span>
            </div>
            <div className="finance-hero-chip">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-amber-500/15 flex items-center justify-center">
                  <AppIcon name="Clock" size={11} style={{ color: 'var(--gp-negative)' }} />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--gp-sublabel)' }}>
                  Pendentes
                </span>
              </div>
              <span className="text-[15px] font-bold tabular-nums" style={{ color: 'var(--gp-negative)' }}>
                {todayStats.pending}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Order stats grid — matches card-stat-holo from main dashboard */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Pedidos Hoje', value: todayStats.total, icon: 'ShoppingBag', variant: 'primary' as const },
          { label: 'Enviados PDV', value: todayStats.sent, icon: 'CheckCircle', variant: 'success' as const },
          { label: 'Pendentes', value: todayStats.pending, icon: 'Clock', variant: 'warning' as const },
          { label: 'Erros', value: todayStats.errors, icon: 'AlertTriangle', variant: 'destructive' as const },
        ].map(stat => {
          const isActive = stat.value > 0;
          const variantStyles: Record<string, string> = {
            primary: 'bg-primary/15 text-primary',
            success: 'bg-success/15 text-success',
            warning: 'bg-warning/15 text-warning',
            destructive: 'bg-destructive/15 text-destructive',
          };
          const ringStyles: Record<string, string> = {
            primary: 'ring-primary/20',
            success: 'ring-success/20',
            warning: 'ring-warning/20',
            destructive: 'ring-destructive/20',
          };
          return (
            <button
              key={stat.label}
              onClick={() => onNavigate('pedidos')}
              className={cn(
                "card-stat-holo text-left transition-all duration-200 active:scale-[0.97]",
                isActive && "ring-1 ring-inset",
                isActive && ringStyles[stat.variant],
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn("stat-holo-icon", isActive ? variantStyles[stat.variant] : "bg-secondary text-secondary-foreground")}>
                  <AppIcon name={stat.icon} size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider truncate">{stat.label}</p>
                  <p className="text-2xl font-extrabold font-display" style={{ letterSpacing: '-0.03em' }}>
                    {stat.value}
                  </p>
                </div>
                <AppIcon name="ChevronRight" size={14} className="text-muted-foreground/50" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Delivery Time Widget */}
      <DeliveryTimeWidget unitId={unitId} onNavigate={onNavigate} />

      {/* Warnings: Deactivated products */}
      {deactivatedProducts.length > 0 && (
        <div className="card-stat-holo ring-1 ring-inset ring-warning/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="stat-holo-icon bg-warning/15 text-warning">
              <AppIcon name="Warning" size={20} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Produtos Desativados</p>
              <p className="text-lg font-extrabold font-display" style={{ letterSpacing: '-0.03em' }}>
                {deactivatedProducts.length}
              </p>
            </div>
            <AppIcon name="ChevronRight" size={14} className="text-muted-foreground/50" />
          </div>
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {deactivatedProducts.slice(0, 8).map(p => {
              const group = groups.find(g => g.id === p.group_id);
              return (
                <div key={p.id} className="flex items-center justify-between text-xs py-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-warning shrink-0" />
                    <span className="text-foreground truncate">{p.name}</span>
                  </div>
                  <span className="text-muted-foreground text-[10px] shrink-0 ml-2">
                    {group?.name || '—'}
                  </span>
                </div>
              );
            })}
            {deactivatedProducts.length > 8 && (
              <p className="text-[10px] text-muted-foreground text-center pt-1">
                +{deactivatedProducts.length - 8} mais
              </p>
            )}
          </div>
          <button
            onClick={() => onNavigate('produtos')}
            className="mt-3 text-xs font-semibold text-warning flex items-center gap-1"
          >
            Gerenciar produtos <AppIcon name="ChevronRight" size={14} />
          </button>
        </div>
      )}

      {/* Products without images */}
      {noImageProducts.length > 0 && (
        <button
          onClick={() => onNavigate('produtos')}
          className="w-full card-stat-holo text-left transition-all duration-200 active:scale-[0.97]"
        >
          <div className="flex items-center gap-3">
            <div className="stat-holo-icon bg-secondary text-secondary-foreground">
              <AppIcon name="ImageOff" size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Sem Foto</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-extrabold font-display" style={{ letterSpacing: '-0.03em' }}>
                  {noImageProducts.length}
                </p>
                <span className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                  produto{noImageProducts.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            <AppIcon name="ChevronRight" size={14} className="text-muted-foreground/50" />
          </div>
        </button>
      )}

      {/* Quick stats summary */}
      <div className="card-stat-holo">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Resumo do Cardápio</p>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-lg font-extrabold font-display" style={{ letterSpacing: '-0.03em' }}>{products.filter(p => p.is_active).length}</p>
            <p className="text-[10px] text-muted-foreground">Ativos</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-extrabold font-display" style={{ letterSpacing: '-0.03em' }}>{groups.length}</p>
            <p className="text-[10px] text-muted-foreground">Grupos</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-extrabold font-display" style={{ letterSpacing: '-0.03em' }}>{products.filter(p => p.is_highlighted).length}</p>
            <p className="text-[10px] text-muted-foreground">Destaques</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeliveryTimeWidget({ unitId, onNavigate }: { unitId?: string; onNavigate: (tab: string) => void }) {
  const { zones, isLoading, bulkAdjustTime } = useDeliveryZones();
  const queryClient = useQueryClient();

  const activeZones = zones.filter(z => z.is_active);
  const minTime = activeZones.length > 0 ? Math.min(...activeZones.map(z => z.delivery_time_minutes)) : 0;
  const maxTime = activeZones.length > 0 ? Math.max(...activeZones.map(z => z.delivery_time_minutes)) : 0;
  const timeRange = minTime === maxTime ? `${minTime} min` : `${minTime}–${maxTime} min`;

  if (isLoading) {
    return <Skeleton className="h-32 rounded-2xl" />;
  }

  if (activeZones.length === 0) {
    return (
      <button
        onClick={() => onNavigate('configuracoes')}
        className="w-full rounded-2xl bg-card border border-border/30 p-4 text-left active:scale-[0.97] transition-transform"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-warning/15 flex items-center justify-center">
            <AppIcon name="Clock" size={18} className="text-warning" />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">Tempo de Entrega</p>
            <p className="text-sm text-muted-foreground">Nenhuma zona configurada</p>
          </div>
        </div>
      </button>
    );
  }

  const handleZoneAdjust = async (zoneId: string, delta: number) => {
    const zone = activeZones.find(z => z.id === zoneId);
    if (!zone || (zone.delivery_time_minutes + delta < 5)) return;
    const { error } = await supabase
      .from('delivery_zones')
      .update({ delivery_time_minutes: zone.delivery_time_minutes + delta, updated_at: new Date().toISOString() })
      .eq('id', zoneId);
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['delivery-zones'] });
    }
  };

  return (
    <div className="rounded-2xl bg-card border border-border/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
            <AppIcon name="Clock" size={18} className="text-primary" />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">Tempo de Entrega</p>
            <p className="text-lg font-black text-foreground leading-tight">{timeRange}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 rounded-xl"
            disabled={bulkAdjustTime.isPending || minTime <= 10}
            onClick={() => bulkAdjustTime.mutate(-10)}
          >
            <AppIcon name="Minus" size={14} />
          </Button>
          <span className="text-[10px] text-muted-foreground w-10 text-center font-medium">10 min</span>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 rounded-xl"
            disabled={bulkAdjustTime.isPending}
            onClick={() => bulkAdjustTime.mutate(10)}
          >
            <AppIcon name="Plus" size={14} />
          </Button>
        </div>
      </div>

      {/* All zones with individual controls */}
      <div className="space-y-1.5">
        {activeZones.map(zone => (
          <div key={zone.id} className="flex items-center justify-between px-2.5 py-2 rounded-lg bg-secondary/50">
            <span className="text-[10px] text-muted-foreground truncate flex-1">
              {zone.name || `Até ${zone.max_distance_km} km`}
            </span>
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={() => handleZoneAdjust(zone.id, -5)}
                disabled={zone.delivery_time_minutes <= 5}
                className="w-6 h-6 rounded-md bg-secondary hover:bg-secondary/80 flex items-center justify-center disabled:opacity-30 transition-colors"
              >
                <AppIcon name="Minus" size={10} />
              </button>
              <span className="text-[11px] font-bold text-foreground w-12 text-center">{zone.delivery_time_minutes} min</span>
              <button
                onClick={() => handleZoneAdjust(zone.id, 5)}
                className="w-6 h-6 rounded-md bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors"
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
