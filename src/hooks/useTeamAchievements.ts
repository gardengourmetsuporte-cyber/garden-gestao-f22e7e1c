import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { calculateMedals, type Medal } from '@/lib/medals';
import { calculateEarnedPoints } from '@/lib/points';
import { startOfMonth, format } from 'date-fns';

export interface TeamMember {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  earnedPoints: number;
  totalCompletions: number;
  totalRedemptions: number;
  bonusPoints: number;
  medals: Medal[];
  unlockedMedals: number;
}

export function useTeamAchievements() {
  const { user } = useAuth();
  const { activeUnitId } = useUnit();
  const currentMonth = format(startOfMonth(new Date()), 'yyyy-MM-dd');

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['team-achievements', activeUnitId, currentMonth],
    queryFn: async () => {
      if (!activeUnitId) return [];

      const [{ data: profiles }, { data: completions }, { data: redemptions }, { data: bonusRows }, { data: badgeRows }] = await Promise.all([
        supabase.from('profiles').select('user_id, full_name, avatar_url'),
        supabase.from('checklist_completions').select('completed_by, points_awarded, awarded_points, completed_at, item_id').eq('unit_id', activeUnitId),
        supabase.from('reward_redemptions').select('user_id, points_spent, status').eq('unit_id', activeUnitId),
        supabase.from('bonus_points').select('user_id, points').eq('unit_id', activeUnitId).eq('month', currentMonth),
        supabase.from('bonus_points').select('user_id, badge_id').eq('unit_id', activeUnitId).eq('badge_id', 'employee_of_month'),
      ]);

      const completionsByUser = new Map<string, Array<{ points_awarded: number; awarded_points?: boolean; completed_at: string; item_id: string }>>();
      completions?.forEach(c => {
        const list = completionsByUser.get(c.completed_by) || [];
        list.push(c);
        completionsByUser.set(c.completed_by, list);
      });

      const redemptionsByUser = new Map<string, number>();
      redemptions?.filter(r => r.status === 'approved' || r.status === 'delivered').forEach(r => {
        redemptionsByUser.set(r.user_id, (redemptionsByUser.get(r.user_id) || 0) + 1);
      });

      const bonusByUser = new Map<string, number>();
      bonusRows?.forEach(b => {
        bonusByUser.set(b.user_id, (bonusByUser.get(b.user_id) || 0) + b.points);
      });

      const badgeUserIds = new Set((badgeRows || []).map(b => b.user_id));

      const result: TeamMember[] = (profiles || [])
        .map(p => {
          const userComps = completionsByUser.get(p.user_id) || [];
          const earnedPoints = calculateEarnedPoints(userComps);
          const totalCompletions = userComps.filter(c => c.awarded_points !== false).length;
          const totalRedemptions = redemptionsByUser.get(p.user_id) || 0;
          const bonusPoints = bonusByUser.get(p.user_id) || 0;

          const completionsByDay = new Map<string, Set<string>>();
          userComps.forEach(c => {
            const day = c.completed_at.slice(0, 10);
            if (!completionsByDay.has(day)) completionsByDay.set(day, new Set());
            completionsByDay.get(day)!.add(c.item_id);
          });
          const hasPerfectDay = Array.from(completionsByDay.values()).some(s => s.size >= 10);

          const medals = calculateMedals({
            completions: userComps.map(c => ({ completed_at: c.completed_at, item_id: c.item_id })),
            hasEmployeeOfMonth: badgeUserIds.has(p.user_id),
            hasPerfectDay,
          });

          return {
            user_id: p.user_id,
            full_name: p.full_name,
            avatar_url: p.avatar_url,
            earnedPoints,
            totalCompletions,
            totalRedemptions,
            bonusPoints,
            medals,
            unlockedMedals: medals.filter(m => m.unlocked).length,
          };
        })
        .filter(m => m.totalCompletions > 0 || m.bonusPoints > 0)
        .sort((a, b) => b.earnedPoints - a.earnedPoints);

      return result;
    },
    enabled: !!user && !!activeUnitId,
  });

  return { members, isLoading };
}
