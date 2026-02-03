import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PointsData {
  earnedPoints: number;
  spentPoints: number;
  balance: number;
}

export function usePoints() {
  const { user } = useAuth();
  const [points, setPoints] = useState<PointsData>({
    earnedPoints: 0,
    spentPoints: 0,
    balance: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPoints();
    }
  }, [user]);

  async function fetchPoints() {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Count completed tasks that awarded points (1 task = 1 point)
      const { count: earnedPoints } = await supabase
        .from('checklist_completions')
        .select('*', { count: 'exact', head: true })
        .eq('completed_by', user.id)
        .eq('awarded_points', true);

      // Sum points spent on approved/delivered redemptions
      const { data: redemptions } = await supabase
        .from('reward_redemptions')
        .select('points_spent')
        .eq('user_id', user.id)
        .in('status', ['approved', 'delivered']);

      const spentPoints = redemptions?.reduce((sum, r) => sum + r.points_spent, 0) || 0;
      const balance = (earnedPoints || 0) - spentPoints;

      setPoints({
        earnedPoints: earnedPoints || 0,
        spentPoints,
        balance,
      });
    } catch (error) {
      console.error('Error fetching points:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return {
    ...points,
    isLoading,
    refetch: fetchPoints,
  };
}
