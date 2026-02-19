import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { calculatePointsSummary, calculateEarnedPoints, PointsSummary } from '@/lib/points';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export interface PointsData extends PointsSummary {
  earnedPoints: number;
  spentPoints: number;
  monthlyScore: number;
  monthlyBase: number;
  monthlyBonus: number;
}

async function fetchPointsData(userId: string, unitId: string | null): Promise<PointsData> {
  const now = new Date();
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');

  // Build queries with optional unit_id filter
  let completionsQuery = supabase
    .from('checklist_completions')
    .select('points_awarded, awarded_points')
    .eq('completed_by', userId)
    .limit(10000);
  if (unitId) completionsQuery = completionsQuery.eq('unit_id', unitId);

  let redemptionsQuery = supabase
    .from('reward_redemptions')
    .select('points_spent, status')
    .eq('user_id', userId)
    .limit(10000);
  if (unitId) redemptionsQuery = redemptionsQuery.eq('unit_id', unitId);

  let monthlyCompletionsQuery = supabase
    .from('checklist_completions')
    .select('points_awarded, awarded_points')
    .eq('completed_by', userId)
    .gte('date', monthStart)
    .lte('date', monthEnd)
    .limit(10000);
  if (unitId) monthlyCompletionsQuery = monthlyCompletionsQuery.eq('unit_id', unitId);

  let bonusQuery = supabase
    .from('bonus_points')
    .select('points')
    .eq('user_id', userId)
    .eq('month', monthStart)
    .limit(10000);
  if (unitId) bonusQuery = bonusQuery.eq('unit_id', unitId);

  const [
    { data: completions },
    { data: redemptions },
    { data: monthlyCompletions },
    { data: bonusRows },
  ] = await Promise.all([
    completionsQuery,
    redemptionsQuery,
    monthlyCompletionsQuery,
    bonusQuery,
  ]);

  const summary = calculatePointsSummary(completions || [], redemptions || []);
  const monthlyBase = calculateEarnedPoints(monthlyCompletions || []);
  const monthlyBonus = (bonusRows || []).reduce((sum, b) => sum + b.points, 0);

  return {
    ...summary,
    earnedPoints: summary.earned,
    spentPoints: summary.spent,
    monthlyScore: monthlyBase + monthlyBonus,
    monthlyBase,
    monthlyBonus,
  };
}

export function usePoints() {
  const { user } = useAuth();
  const { activeUnitId } = useUnit();

  const { data: points, isLoading, refetch } = useQuery({
    queryKey: ['points', user?.id, activeUnitId],
    queryFn: () => fetchPointsData(user!.id, activeUnitId),
    enabled: !!user,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
  });

  return {
    earned: points?.earned ?? 0,
    spent: points?.spent ?? 0,
    balance: points?.balance ?? 0,
    earnedPoints: points?.earnedPoints ?? 0,
    spentPoints: points?.spentPoints ?? 0,
    monthlyScore: points?.monthlyScore ?? 0,
    monthlyBase: points?.monthlyBase ?? 0,
    monthlyBonus: points?.monthlyBonus ?? 0,
    isLoading,
    refetch,
  };
}
