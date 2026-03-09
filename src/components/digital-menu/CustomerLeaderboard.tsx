import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppIcon } from '@/components/ui/app-icon';

interface CustomerRank {
  id: string;
  name: string;
  loyalty_points: number;
}

interface Props {
  unitId: string;
  /** Compact mode for widget embedding */
  compact?: boolean;
}

const MEDAL_COLORS = [
  'hsl(45 100% 50%)',   // gold
  'hsl(0 0% 75%)',      // silver
  'hsl(30 60% 50%)',    // bronze
];

export function CustomerLeaderboard({ unitId, compact = false }: Props) {
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customer-leaderboard', unitId],
    queryFn: async () => {
      const { data } = await supabase
        .from('customers')
        .select('id, name, loyalty_points')
        .eq('unit_id', unitId)
        .gt('loyalty_points', 0)
        .is('deleted_at', null)
        .order('loyalty_points', { ascending: false })
        .limit(compact ? 5 : 30);
      return (data || []) as CustomerRank[];
    },
    enabled: !!unitId,
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-14 rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="text-center py-8">
        <span className="text-3xl block mb-2">🪙</span>
        <p className="text-sm font-semibold text-foreground">Nenhum cliente no ranking</p>
        <p className="text-xs text-muted-foreground mt-1">Faça pedidos para aparecer aqui!</p>
      </div>
    );
  }

  const getInitials = (name: string) =>
    name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

  const maxPoints = customers[0]?.loyalty_points || 1;

  return (
    <div className="space-y-2">
      {customers.map((c, i) => {
        const isTop3 = i < 3;
        const medalColor = MEDAL_COLORS[i];
        const barWidth = (c.loyalty_points / maxPoints) * 100;

        return (
          <div
            key={c.id}
            className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
              isTop3
                ? 'bg-card border-border/40 shadow-sm'
                : 'bg-card/50 border-border/20'
            }`}
          >
            {/* Position */}
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{
              backgroundColor: isTop3 ? `${medalColor}20` : 'hsl(var(--secondary))',
            }}>
              {isTop3 ? (
                <AppIcon name="EmojiEvents" size={18} style={{ color: medalColor }} />
              ) : (
                <span className="text-xs font-bold text-muted-foreground">#{i + 1}</span>
              )}
            </div>

            {/* Avatar */}
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{
              backgroundColor: isTop3 ? `${medalColor}15` : 'hsl(var(--secondary))',
              border: isTop3 ? `2px solid ${medalColor}40` : '2px solid hsl(var(--border) / 0.3)',
            }}>
              <span className="text-[11px] font-bold" style={{
                color: isTop3 ? medalColor : 'hsl(var(--muted-foreground))',
              }}>
                {getInitials(c.name)}
              </span>
            </div>

            {/* Name + bar */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm truncate ${isTop3 ? 'font-bold text-foreground' : 'font-semibold text-foreground/80'}`}>
                {c.name}
              </p>
              {!compact && (
                <div className="mt-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: isTop3 ? medalColor : 'hsl(var(--primary) / 0.4)',
                    }}
                  />
                </div>
              )}
            </div>

            {/* Points */}
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-sm">🪙</span>
              <span className={`text-sm tabular-nums ${isTop3 ? 'font-extrabold' : 'font-bold text-muted-foreground'}`} style={{
                color: isTop3 ? medalColor : undefined,
              }}>
                {c.loyalty_points.toLocaleString('pt-BR')}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
