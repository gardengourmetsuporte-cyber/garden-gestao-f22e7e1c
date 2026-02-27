import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { TIER_CONFIG, TIER_CONFIG_DARK, type MedalTier } from '@/lib/medals';
import { useTheme } from 'next-themes';
import { AppIcon } from '@/components/ui/app-icon';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function useGetTier() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  return (tier: MedalTier) => {
    const base = TIER_CONFIG[tier];
    if (isDark) { const d = TIER_CONFIG_DARK[tier]; return { ...base, color: d.color, bg: d.bg, border: d.border }; }
    return base;
  };
}

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

const POSITION_MEDALS = ['🥇', '🥈', '🥉'];

function WinnerAvatar({ winner, tier }: { winner: BadgeWinner; tier: ReturnType<ReturnType<typeof useGetTier>> }) {
  return (
    <div
      className="w-10 h-10 rounded-full shrink-0 overflow-hidden"
      style={{ boxShadow: `0 0 0 2px ${tier.color}` }}
    >
      {winner.avatar_url ? (
        <img src={winner.avatar_url} alt={winner.full_name} className="w-full h-full object-cover" />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center text-sm font-bold"
          style={{ background: tier.bg, color: tier.color }}
        >
          {winner.full_name.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}

export function MedalWinners() {
  const { activeUnitId } = useUnit();
  const getTier = useGetTier();

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
    <div className="space-y-6 mt-6">
      {/* Section header */}
      <div className="flex items-center gap-2 px-1">
        <div className="flex items-center justify-center w-7 h-7 rounded-xl bg-warning/15">
          <AppIcon name="Trophy" size={14} className="text-warning" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground leading-tight">Hall da Fama</h3>
          <p className="text-[10px] text-muted-foreground leading-tight">Maiores conquistadores</p>
        </div>
      </div>

      {grouped.map(group => {
        const tier = getTier(group.tier);
        const topThree = group.winners.slice(0, 3);
        const rest = group.winners.slice(3);

        return (
          <div key={group.badgeId} className="space-y-3">
            {/* Category header */}
            <div
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl"
              style={{
                background: `linear-gradient(135deg, ${tier.color}15, ${tier.color}08)`,
                border: `1px solid ${tier.color}30`,
              }}
            >
              <div
                className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${tier.color}20` }}
              >
                <AppIcon name={group.icon} size={14} style={{ color: tier.color }} />
              </div>
              <div className="flex-1">
                <span className="text-xs font-bold" style={{ color: tier.color }}>
                  {group.title}
                </span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[10px] text-muted-foreground">
                    {group.winners.length} premiação{group.winners.length !== 1 ? 'ões' : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Top 3 podium cards */}
            {topThree.length > 0 && (
              <div className="space-y-2">
                {topThree.map((w, i) => (
                  <div
                    key={w.id}
                    className="flex items-center gap-3 p-3 rounded-2xl transition-all"
                    style={{
                      background: i === 0
                        ? `linear-gradient(135deg, ${tier.color}14, ${tier.color}06)`
                        : 'hsl(var(--card))',
                      border: i === 0
                        ? `1px solid ${tier.color}35`
                        : '1px solid hsl(var(--border) / 0.3)',
                      boxShadow: i === 0 ? `0 2px 12px ${tier.color}12` : 'none',
                    }}
                  >
                    {/* Position medal emoji */}
                    <div className="w-7 h-7 flex items-center justify-center shrink-0">
                      <span className="text-lg leading-none">{POSITION_MEDALS[i]}</span>
                    </div>

                    {/* Avatar */}
                    <WinnerAvatar winner={w} tier={tier} />

                    {/* Name & date */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{w.full_name}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">
                        {format(new Date(w.created_at), "MMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>

                    {/* Points */}
                    <div
                      className="px-2.5 py-1 rounded-xl text-[10px] font-extrabold shrink-0"
                      style={{ background: `${tier.color}18`, color: tier.color }}
                    >
                      +{w.points} pts
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Rest of winners (4th place onward) — compact list */}
            {rest.length > 0 && (
              <div
                className="rounded-2xl overflow-hidden"
                style={{ border: '1px solid hsl(var(--border) / 0.3)' }}
              >
                {rest.map((w, i) => (
                  <div
                    key={w.id}
                    className="flex items-center gap-3 px-3 py-2.5"
                    style={{
                      borderTop: i > 0 ? '1px solid hsl(var(--border) / 0.2)' : 'none',
                    }}
                  >
                    {/* Position number */}
                    <span className="text-[10px] font-bold text-muted-foreground/60 w-5 text-center shrink-0">
                      {i + 4}
                    </span>

                    {/* Mini avatar */}
                    <div
                      className="w-7 h-7 rounded-full shrink-0 overflow-hidden"
                      style={{ boxShadow: `0 0 0 1.5px ${tier.color}60` }}
                    >
                      {w.avatar_url ? (
                        <img src={w.avatar_url} alt={w.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center text-[10px] font-bold"
                          style={{ background: tier.bg, color: tier.color }}
                        >
                          {w.full_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <p className="text-[11px] font-medium text-foreground flex-1 truncate">{w.full_name}</p>

                    <p className="text-[10px] text-muted-foreground capitalize shrink-0">
                      {format(new Date(w.created_at), "MMM yyyy", { locale: ptBR })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
