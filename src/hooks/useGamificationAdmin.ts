import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import type { GamificationPrize, GamificationSettings, GamificationPlay } from './useGamification';

export function useGamificationAdmin() {
  const { activeUnit } = useUnit();
  const unitId = activeUnit?.id;
  const queryClient = useQueryClient();

  const { data: prizes = [], isLoading: prizesLoading } = useQuery({
    queryKey: ['gamification-prizes-admin', unitId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gamification_prizes')
        .select('*')
        .eq('unit_id', unitId!)
        .order('sort_order');
      if (error) throw error;
      return data as GamificationPrize[];
    },
    enabled: !!unitId,
  });

  const { data: settings } = useQuery({
    queryKey: ['gamification-settings-admin', unitId],
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

  const { data: todayPlays = [] } = useQuery({
    queryKey: ['gamification-plays-today', unitId],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('gamification_plays')
        .select('*')
        .eq('unit_id', unitId!)
        .gte('played_at', `${today}T00:00:00`)
        .order('played_at', { ascending: false });
      if (error) throw error;
      return data as GamificationPlay[];
    },
    enabled: !!unitId,
    refetchInterval: 30_000,
  });

  const metrics = {
    playsToday: todayPlays.length,
    prizesToday: todayPlays.filter(p => p.prize_id !== null).length,
    costToday: todayPlays.reduce((sum, play) => {
      const prize = prizes.find(p => p.id === play.prize_id);
      return sum + (prize?.estimated_cost ?? 0);
    }, 0),
  };

  const upsertSettings = useMutation({
    mutationFn: async (s: Partial<GamificationSettings>) => {
      if (settings?.id) {
        const { error } = await supabase
          .from('gamification_settings')
          .update({ ...s, updated_at: new Date().toISOString() })
          .eq('id', settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('gamification_settings')
          .insert({ unit_id: unitId!, ...s } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gamification-settings-admin', unitId] }),
  });

  const savePrize = useMutation({
    mutationFn: async (prize: Partial<GamificationPrize> & { id?: string }) => {
      if (prize.id) {
        const { error } = await supabase
          .from('gamification_prizes')
          .update({ ...prize, updated_at: new Date().toISOString() })
          .eq('id', prize.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('gamification_prizes')
          .insert({ unit_id: unitId!, ...prize } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gamification-prizes-admin', unitId] }),
  });

  const deletePrize = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('gamification_prizes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gamification-prizes-admin', unitId] }),
  });

  const togglePrize = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('gamification_prizes').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gamification-prizes-admin', unitId] }),
  });

  return {
    prizes,
    prizesLoading,
    settings,
    metrics,
    todayPlays,
    upsertSettings,
    savePrize,
    deletePrize,
    togglePrize,
  };
}
