import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { TIER_CONFIG, type MedalTier } from '@/lib/medals';
import { AppIcon } from '@/components/ui/app-icon';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BadgeWinner {
  id: string;
  user_id: string;
  badge_id: string;
  points: number;
  created_at: string;
  full_name: string;
  avatar_url: string | null;
}

const BADGE_META: Record<string, { title: string; icon: string; tier: MedalTier }> = {
  employee_of_month: { title: 'Funcionário do Mês', icon: 'Crown', tier: 'platinum' },
  inventor: { title: 'Inventor', icon: 'FlaskConical', tier: 'gold' },
};

export function MedalWinners() {
  const { activeUnitId } = useUnit();

  const { data: winners, isLoading } = useQuery({
    queryKey: ['medal-winners', activeUnitId],
    queryFn: async () => {
      let query = supabase
        .from('bonus_points')
        .select('id, user_id, badge_id, points, created_at')
        .in('badge_id', ['employee_of_month', 'inventor'])
        .order('created_at', { ascending: false })
        .limit(100);
      if (activeUnitId) query = query.eq('unit_id', activeUnitId);
      const { data } = await query;
      if (!data?.length) return [];

      const userIds = [...new Set(data.map(d => d.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      return data.map(d => ({
        ...d,
        full_name: profileMap.get(d.user_id)?.full_name || 'Usuário',
        avatar_url: profileMap.get(d.user_id)?.avatar_url || null,
      })) as BadgeWinner[];
    },
    enabled: !!activeUnitId,
  });

  if (isLoading || !winners?.length) return null;

  const grouped = Object.entries(BADGE_META).map(([badgeId, meta]) => ({
    ...meta,
    badgeId,
    winners: winners.filter(w => w.badge_id === badgeId),
  })).filter(g => g.winners.length > 0);

  if (!grouped.length) return null;

  return (
    <div className="space-y-5 mt-6">
      <div className="flex items-center gap-2 px-1">
        <AppIcon name="Trophy" size={16} className="text-warning" />
        <h3 className="text-sm font-semibold text-foreground">Hall da Fama</h3>
      </div>

      {grouped.map(group => {
        const tier = TIER_CONFIG[group.tier];
        return (
          <div key={group.badgeId} className="space-y-3">
            {/* Category header */}
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: `${tier.color}12`, border: `1px solid ${tier.color}25` }}
            >
              <AppIcon name={group.icon} size={16} style={{ color: tier.color }} />
              <span className="text-xs font-bold" style={{ color: tier.color }}>
                {group.title}
              </span>
              <span className="text-[10px] text-muted-foreground ml-auto">{group.winners.length} premiação{group.winners.length > 1 ? 'ões' : ''}</span>
            </div>

            {/* Winners list */}
            <div className="space-y-2 pl-1">
              {group.winners.map((w, i) => (
                <div
                  key={w.id}
                  className="flex items-center gap-3 p-3 rounded-xl transition-all"
                  style={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border) / 0.3)',
                  }}
                >
                  {/* Position */}
                  <span className="text-[10px] font-bold text-muted-foreground w-4 text-center shrink-0">
                    {i + 1}
                  </span>

                  {/* Avatar */}
                  <div
                    className="w-9 h-9 rounded-full shrink-0 overflow-hidden ring-2"
                    style={{ ['--tw-ring-color' as any]: tier.color }}
                  >
                    {w.avatar_url ? (
                      <img src={w.avatar_url} alt={w.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-xs font-bold"
                        style={{ background: tier.bg, color: tier.color }}
                      >
                        {w.full_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Name & date */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{w.full_name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {format(new Date(w.created_at), "MMM yyyy", { locale: ptBR })}
                    </p>
                  </div>

                  {/* Points badge */}
                  <div
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0"
                    style={{ background: `${tier.color}18`, color: tier.color }}
                  >
                    +{w.points} pts
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}