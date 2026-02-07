import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { calculatePointsSummary, PointsSummary } from '@/lib/points';

export interface PointsData extends PointsSummary {
  earnedPoints: number;
  spentPoints: number;
}

export function usePoints() {
  const { user } = useAuth();
  const [points, setPoints] = useState<PointsData>({
    earned: 0,
    spent: 0,
    balance: 0,
    earnedPoints: 0,
    spentPoints: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchPoints = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Busca completions com pontos
      const { data: completions } = await supabase
        .from('checklist_completions')
        .select('points_awarded, awarded_points')
        .eq('completed_by', user.id);

      // Busca redemptions aprovadas/entregues
      const { data: redemptions } = await supabase
        .from('reward_redemptions')
        .select('points_spent, status')
        .eq('user_id', user.id);

      // Usa função centralizada para cálculo
      const summary = calculatePointsSummary(
        completions || [],
        redemptions || []
      );

      setPoints({
        ...summary,
        earnedPoints: summary.earned,
        spentPoints: summary.spent,
      });
    } catch (error) {
      console.error('Error fetching points:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchPoints();
    }
  }, [user, fetchPoints]);

  return {
    ...points,
    isLoading,
    refetch: fetchPoints,
  };
}
