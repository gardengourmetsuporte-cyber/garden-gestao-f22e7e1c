import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { TIER_CONFIG, type MedalTier } from '@/lib/medals';
import { AppIcon } from '@/components/ui/app-icon';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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

  // Group by badge_id
  const grouped = Object.entries(BADGE_META).map(([badgeId, meta]) => ({
    ...meta,
    badgeId,
    winners: winners.filter(w => w.badge_id === badgeId),
  })).filter(g => g.winners.length > 0);

  if (!grouped.length) return null;

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center gap-2 px-1">
        <AppIcon name="Users" size={16} className="text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Hall da Fama</h3>
      </div>

      {grouped.map(group => {
        const tier = TIER_CONFIG[group.tier];
        return (
          <div key={group.badgeId} className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <AppIcon name={group.icon} size={14} style={{ color: tier.color }} />
              <span className="text-xs font-bold" style={{ color: tier.color }}>
                {group.title}
              </span>
              <span className="text-[10px] text-muted-foreground">({group.winners.length})</span>
            </div>

            <div className="space-y-1.5">
              {group.winners.map(w => (
                <div
                  key={w.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-secondary/30 border border-border/20"
                >
                  {/* Avatar */}
                  <div
                    className="w-8 h-8 rounded-full shrink-0 overflow-hidden border-2"
                    style={{ borderColor: tier.border }}
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
                      {format(new Date(w.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>

                  {/* Points */}
                  <span
                    className="text-xs font-bold shrink-0"
                    style={{ color: tier.color }}
                  >
                    +{w.points}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
