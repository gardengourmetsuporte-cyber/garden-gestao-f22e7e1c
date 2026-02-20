import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GamificationPrize {
  id: string;
  unit_id: string;
  name: string;
  type: string;
  probability: number;
  estimated_cost: number;
  is_active: boolean;
  icon: string;
  color: string;
  sort_order: number;
}

export interface GamificationSettings {
  id: string;
  unit_id: string;
  is_enabled: boolean;
  max_daily_cost: number;
  points_per_play: number;
  cooldown_minutes: number;
}

export interface GamificationPlay {
  id: string;
  unit_id: string;
  order_id: string;
  customer_name: string | null;
  prize_id: string | null;
  prize_name: string;
  played_at: string;
}

/** Pick a prize using weighted random selection */
export function weightedRandom(prizes: GamificationPrize[]): GamificationPrize {
  const total = prizes.reduce((sum, p) => sum + p.probability, 0);
  let rand = Math.random() * total;
  for (const prize of prizes) {
    rand -= prize.probability;
    if (rand <= 0) return prize;
  }
  return prizes[prizes.length - 1];
}

export function useGamification(unitId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: prizes = [], isLoading: prizesLoading } = useQuery({
    queryKey: ['gamification-prizes', unitId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gamification_prizes')
        .select('*')
        .eq('unit_id', unitId!)
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data as GamificationPrize[];
    },
    enabled: !!unitId,
  });

  const { data: settings } = useQuery({
    queryKey: ['gamification-settings', unitId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gamification_settings')
        .select('*')
        .eq('unit_id', unitId!)
        .maybeSingle();
      if (error) throw error;
      return data as GamificationSettings | null;
    },
    enabled: !!unitId,
  });

  const checkAlreadyPlayed = async (orderId: string): Promise<boolean> => {
    const { count } = await supabase
      .from('gamification_plays')
      .select('id', { count: 'exact', head: true })
      .eq('unit_id', unitId!)
      .eq('order_id', orderId);
    return (count ?? 0) > 0;
  };

  const checkDailyCostExceeded = async (): Promise<boolean> => {
    if (!settings?.max_daily_cost) return false;
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('gamification_plays')
      .select('prize_id')
      .eq('unit_id', unitId!)
      .gte('played_at', `${today}T00:00:00`)
      .lte('played_at', `${today}T23:59:59`);

    if (!data) return false;
    const prizeIds = data.map(p => p.prize_id).filter(Boolean);
    const costs = prizes.filter(p => prizeIds.includes(p.id));
    const totalCost = costs.reduce((sum, p) => sum + p.estimated_cost, 0);
    return totalCost >= settings.max_daily_cost;
  };

  const recordPlay = useMutation({
    mutationFn: async (play: { order_id: string; customer_name?: string; prize: GamificationPrize }) => {
      const { error } = await supabase.from('gamification_plays').insert({
        unit_id: unitId!,
        order_id: play.order_id,
        customer_name: play.customer_name || null,
        prize_id: play.prize.type === 'empty' ? null : play.prize.id,
        prize_name: play.prize.name,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gamification-plays'] });
    },
  });

  return {
    prizes,
    prizesLoading,
    settings,
    isEnabled: settings?.is_enabled ?? false,
    checkAlreadyPlayed,
    checkDailyCostExceeded,
    recordPlay,
  };
}
