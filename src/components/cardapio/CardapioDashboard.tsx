import { useMemo, useState } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
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
      {/* Revenue highlight card */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/20 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
              <AppIcon name="TrendingUp" size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Faturamento Hoje</p>
              <p className="text-2xl font-black text-foreground">{formatPrice(todayStats.revenue)}</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('pedidos')}
            className="text-xs font-semibold text-primary flex items-center gap-1"
          >
            Ver pedidos <AppIcon name="ChevronRight" size={14} />
          </button>
        </div>
      </div>

      {/* Order stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Pedidos Hoje', value: todayStats.total, icon: 'ShoppingBag', color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Enviados PDV', value: todayStats.sent, icon: 'CheckCircle', color: 'text-success', bg: 'bg-success/10' },
          { label: 'Pendentes', value: todayStats.pending, icon: 'Clock', color: 'text-warning', bg: 'bg-warning/10' },
          { label: 'Erros', value: todayStats.errors, icon: 'AlertTriangle', color: 'text-destructive', bg: 'bg-destructive/10' },
        ].map(stat => (
          <button
            key={stat.label}
            onClick={() => onNavigate('pedidos')}
            className="rounded-2xl bg-card border border-border/30 p-4 text-left active:scale-[0.97] transition-transform"
          >
            <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center mb-2', stat.bg)}>
              <AppIcon name={stat.icon} size={16} className={stat.color} />
            </div>
            <p className="text-xl font-black text-foreground">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground font-medium">{stat.label}</p>
          </button>
        ))}
      </div>

      {/* Delivery Time Widget */}
      <DeliveryTimeWidget unitId={unitId} onNavigate={onNavigate} />

      {/* Warnings: Deactivated products */}
      {deactivatedProducts.length > 0 && (
        <div className="rounded-2xl bg-warning/5 border border-warning/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AppIcon name="Warning" size={16} className="text-warning" />
            <p className="text-xs font-bold text-warning">
              {deactivatedProducts.length} produto{deactivatedProducts.length > 1 ? 's' : ''} desativado{deactivatedProducts.length > 1 ? 's' : ''}
            </p>
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
        <div className="rounded-2xl bg-muted/50 border border-border/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AppIcon name="ImageOff" size={16} className="text-muted-foreground" />
            <p className="text-xs font-bold text-foreground">
              {noImageProducts.length} produto{noImageProducts.length > 1 ? 's' : ''} sem foto
            </p>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Produtos com foto vendem até 30% mais. Adicione imagens para melhorar suas vendas.
          </p>
          <button
            onClick={() => onNavigate('produtos')}
            className="mt-2 text-xs font-semibold text-primary flex items-center gap-1"
          >
            Adicionar fotos <AppIcon name="ChevronRight" size={14} />
          </button>
        </div>
      )}

      {/* Quick stats summary */}
      <div className="rounded-2xl bg-card border border-border/30 p-4">
        <p className="text-xs font-bold text-foreground mb-3">Resumo do Cardápio</p>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-lg font-black text-foreground">{products.filter(p => p.is_active).length}</p>
            <p className="text-[10px] text-muted-foreground">Ativos</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-black text-foreground">{groups.length}</p>
            <p className="text-[10px] text-muted-foreground">Grupos</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-black text-foreground">{products.filter(p => p.is_highlighted).length}</p>
            <p className="text-[10px] text-muted-foreground">Destaques</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeliveryTimeWidget({ unitId, onNavigate }: { unitId?: string; onNavigate: (tab: string) => void }) {
  const { zones, isLoading, bulkAdjustTime } = useDeliveryZones();

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

      {/* Zone time summary */}
      <div className="grid grid-cols-2 gap-1.5">
        {activeZones.slice(0, 4).map(zone => (
          <div key={zone.id} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-secondary/50">
            <span className="text-[10px] text-muted-foreground truncate">
              Até {zone.max_distance_km} km
            </span>
            <span className="text-[10px] font-bold text-foreground ml-1">{zone.delivery_time_minutes} min</span>
          </div>
        ))}
      </div>

      {activeZones.length > 4 && (
        <button
          onClick={() => onNavigate('configuracoes')}
          className="text-[10px] text-primary font-medium w-full text-center"
        >
          +{activeZones.length - 4} zonas • Ver todas
        </button>
      )}
    </div>
  );
}
