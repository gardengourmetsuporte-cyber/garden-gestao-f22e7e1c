import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useGameScore(unitId?: string) {
  const saveScore = useCallback(async (gameType: 'snake' | 'memory', score: number, metadata?: Record<string, any>) => {
    if (!unitId || score <= 0) return false;

    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Find customer linked to this user's email
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('unit_id', unitId)
        .eq('email', user.email)
        .maybeSingle();

      if (!customer) return false;

      // Save score
      await supabase.from('game_scores').insert({
        unit_id: unitId,
        customer_id: customer.id,
        game_type: gameType,
        score,
        metadata: metadata || {},
      });

      return true;
    } catch {
      return false;
    }
  }, [unitId]);

  return { saveScore };
}
