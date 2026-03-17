import { useState, lazy, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const NPSDashboard = lazy(() => import('@/components/reviews/NPSDashboard'));

const CATEGORY_LABELS: Record<string, string> = {
  comida: 'Comida',
  atendimento: 'Atendimento',
  ambiente: 'Ambiente',
  geral: 'Geral',
};

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <AppIcon
          key={s}
          name="Star"
          size={14}
          className={s <= rating ? 'text-amber-400' : 'text-muted-foreground/15'}
        />
      ))}
    </div>
  );
}

export default function Reviews() {
  const { activeUnit } = useUnit();
  const unitId = activeUnit?.id;
  const [filter, setFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'reviews' | 'nps'>('reviews');

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['reviews', unitId, filter],
    queryFn: async () => {
      if (!unitId) return [];
      let query = supabase
        .from('customer_reviews')
        .select('*')
        .eq('unit_id', unitId)
        .order('created_at', { ascending: false })
        .limit(200);

      if (filter !== 'all') {
        query = query.eq('category', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!unitId,
  });

  const avgRating = reviews && reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  const ratingCounts = [5, 4, 3, 2, 1].map(r => ({
    rating: r,
    count: reviews?.filter(rv => rv.rating === r).length ?? 0,
  }));

  const totalReviews = reviews?.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Avaliações</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Acompanhe as avaliações dos clientes</p>
      </div>

      {/* Tabs: Avaliações | NPS */}
      <div className="flex gap-2">
        {[
          { key: 'reviews' as const, label: 'Avaliações', icon: 'Star' },
          { key: 'nps' as const, label: 'NPS', icon: 'TrendingUp' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all',
              activeTab === t.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border/30 text-muted-foreground hover:text-foreground'
            )}
          >
            <AppIcon name={t.icon} size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'nps' ? (
        <Suspense fallback={<div className="text-center py-12 text-muted-foreground text-sm">Carregando...</div>}>
          <NPSDashboard />
        </Suspense>
      ) : (
      <>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-base p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, hsl(38 92% 50%), hsl(32 95% 44%))', boxShadow: '0 4px 12px -2px hsla(38, 92%, 50%, 0.35)' }}>
            <span className="text-2xl font-black text-white">{avgRating}</span>
          </div>
          <div>
            <StarDisplay rating={Math.round(Number(avgRating))} />
            <p className="text-xs text-muted-foreground mt-1">{totalReviews} avaliações</p>
          </div>
        </div>

        <div className="card-base p-5 col-span-1 md:col-span-2">
          <div className="space-y-1.5">
            {ratingCounts.map(({ rating: r, count }) => (
              <div key={r} className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground w-3">{r}</span>
                <AppIcon name="Star" size={11} className="text-amber-400" />
                <div className="flex-1 h-2 rounded-full bg-secondary/60 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all"
                    style={{ width: totalReviews > 0 ? `${(count / totalReviews) * 100}%` : '0%' }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'all', label: 'Todas' },
          { id: 'comida', label: 'Comida' },
          { id: 'atendimento', label: 'Atendimento' },
          { id: 'ambiente', label: 'Ambiente' },
          { id: 'geral', label: 'Geral' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              'px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all',
              filter === f.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border/30 text-muted-foreground hover:text-foreground'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Review list */}
      <div className="space-y-3">
        {isLoading && (
          <div className="text-center py-12 text-muted-foreground text-sm">Carregando...</div>
        )}

        {!isLoading && totalReviews === 0 && (
          <div className="text-center py-16 space-y-3">
            <AppIcon name="Star" size={44} className="mx-auto text-muted-foreground/20" />
            <p className="text-sm font-semibold text-muted-foreground">Nenhuma avaliação ainda</p>
            <p className="text-xs text-muted-foreground/60">As avaliações aparecerão aqui quando os clientes avaliarem pelo tablet.</p>
          </div>
        )}

        {reviews?.map(review => (
          <div key={review.id} className="card-base p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-[11px] font-bold text-primary">
                    {(review.customer_name || '?').slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{review.customer_name || 'Anônimo'}</p>
                  <div className="flex items-center gap-2">
                    <StarDisplay rating={review.rating} />
                    {review.mesa && (
                      <span className="text-[10px] text-muted-foreground bg-secondary/60 px-1.5 py-0.5 rounded">Mesa {review.mesa}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-muted-foreground">
                  {format(new Date(review.created_at), "dd/MM/yy HH:mm")}
                </span>
                {review.category && review.category !== 'geral' && (
                  <p className="text-[10px] text-primary font-semibold mt-0.5">
                    {CATEGORY_LABELS[review.category] || review.category}
                  </p>
                )}
              </div>
            </div>
            {review.comment && (
              <p className="text-sm text-muted-foreground leading-relaxed pl-10">{review.comment}</p>
            )}
          </div>
        ))}
      </div>
      </>
      )}
    </div>
  );
}
