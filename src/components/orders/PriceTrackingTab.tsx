import { useState, useMemo } from 'react';
import { usePriceTracking, PriceFilter, PriceTrackingItem } from '@/hooks/usePriceTracking';
import { AppIcon } from '@/components/ui/app-icon';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import { PriceDetailSheet } from './PriceDetailSheet';


export function PriceTrackingTab() {
  const { data: items = [], isLoading } = usePriceTracking();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<PriceFilter>('all');
  const [selectedItem, setSelectedItem] = useState<PriceTrackingItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const counts = useMemo(() => {
    let up = 0, down = 0, stable = 0;
    items.forEach(i => {
      if (i.variation_pct === null || i.variation_pct === 0) stable++;
      else if (i.variation_pct > 0) up++;
      else down++;
    });
    return { total: items.length, up, down, stable };
  }, [items]);

  const filtered = useMemo(() => {
    let list = items;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(i => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
    }
    if (filter === 'up') list = list.filter(i => i.variation_pct !== null && i.variation_pct > 0);
    if (filter === 'down') list = list.filter(i => i.variation_pct !== null && i.variation_pct < 0);
    return list;
  }, [items, search, filter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Monitorados', value: counts.total, icon: 'BarChart3', gradient: 'linear-gradient(135deg, #6366F1, #8B5CF6)' },
          { label: 'Em alta', value: counts.up, icon: 'TrendingUp', gradient: 'linear-gradient(135deg, #EF4444, #F97316)' },
          { label: 'Em queda', value: counts.down, icon: 'TrendingDown', gradient: 'linear-gradient(135deg, #22C55E, #10B981)' },
          { label: 'Estáveis', value: counts.stable, icon: 'Minus', gradient: 'linear-gradient(135deg, #64748B, #94A3B8)' },
        ].map(card => (
          <div key={card.label} className="bg-secondary/50 rounded-2xl p-3 flex flex-col items-center gap-1.5">
            <div className="w-9 h-9 rounded-full flex items-center justify-center shadow-lg" style={{ background: card.gradient }}>
              <AppIcon name={card.icon} size={16} className="text-white" />
            </div>
            <span className="text-lg font-bold text-foreground">{card.value}</span>
            <span className="text-[10px] text-muted-foreground leading-tight text-center">{card.label}</span>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <Input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Buscar item..."
        className="h-11"
      />

      <div className="flex gap-2">
        {([
          { key: 'all' as const, label: 'Todos' },
          { key: 'up' as const, label: '↑ Altas' },
          { key: 'down' as const, label: '↓ Quedas' },
        ]).map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-semibold transition-colors',
              filter === f.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Item List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="BarChart3"
          title="Nenhum item encontrado"
          subtitle="Itens com preço registrado aparecerão aqui"
        />
      ) : (
        <div className="space-y-2">
          {filtered.map(item => {
            const isUp = item.variation_pct !== null && item.variation_pct > 0;
            const isDown = item.variation_pct !== null && item.variation_pct < 0;
            const isStable = item.variation_pct === null || item.variation_pct === 0;
            const trendIcon = isUp ? 'trending_up' : isDown ? 'trending_down' : 'remove';
            const trendGradient = isUp
              ? 'linear-gradient(135deg, #EF4444, #F97316)'
              : isDown
                ? 'linear-gradient(135deg, #22C55E, #10B981)'
                : 'linear-gradient(135deg, #64748B, #94A3B8)';

            return (
              <button
                key={item.id}
                onClick={() => { setSelectedItem(item); setDetailOpen(true); }}
                className="w-full bg-card/80 rounded-2xl p-3.5 flex items-center gap-3 text-left active:scale-[0.98] transition-all touch-manipulation"
              >
                {/* Trend Icon */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg shrink-0"
                  style={{ background: trendGradient }}
                >
                  <AppIcon name={trendIcon} size={18} className="text-white" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-foreground truncate">{item.name}</p>
                    {item.variation_pct !== null && Math.abs(item.variation_pct) > 10 && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-destructive/15 text-destructive font-bold shrink-0">!</span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                    {item.supplier_name || 'Sem fornecedor'} · {item.category || 'Sem categoria'}
                  </p>
                </div>

                {/* Price + Variation */}
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-foreground">R$ {item.current_price.toFixed(2)}</p>
                  {item.variation_pct !== null ? (
                    <span className={cn(
                      'text-[11px] font-bold',
                      isUp ? 'text-destructive' : isDown ? 'text-success' : 'text-muted-foreground'
                    )}>
                      {isUp ? '+' : ''}{item.variation_pct.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">Novo</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <PriceDetailSheet item={selectedItem} open={detailOpen} onOpenChange={setDetailOpen} />
    </div>
  );
}
