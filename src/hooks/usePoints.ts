import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { calculatePointsSummary, PointsSummary } from '@/lib/points';

export interface PointsData extends PointsSummary {
  earnedPoints: number;
  spentPoints: number;
}

async function fetchPointsData(userId: string): Promise<PointsData> {
  const [{ data: completions }, { data: redemptions }] = await Promise.all([
    supabase
      .from('checklist_completions')
      .select('points_awarded, awarded_points')
      .eq('completed_by', userId),
    supabase
      .from('reward_redemptions')
      .select('points_spent, status')
      .eq('user_id', userId),
  ]);

  const summary = calculatePointsSummary(completions || [], redemptions || []);

  return {
    ...summary,
    earnedPoints: summary.earned,
    spentPoints: summary.spent,
  };
}

export function usePoints() {
  const { user } = useAuth();

  const { data: points, isLoading } = useQuery({
    queryKey: ['points', user?.id],
    queryFn: () => fetchPointsData(user!.id),
    enabled: !!user,
  });

  return {
    earned: points?.earned ?? 0,
    spent: points?.spent ?? 0,
    balance: points?.balance ?? 0,
    earnedPoints: points?.earnedPoints ?? 0,
    spentPoints: points?.spentPoints ?? 0,
    isLoading,
    refetch: () => {}, // React Query handles this via invalidation
  };
}
