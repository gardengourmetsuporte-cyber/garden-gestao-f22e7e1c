import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { startOfMonth, format } from 'date-fns';
import { toast } from 'sonner';
import { invalidateGamificationCaches } from '@/lib/queryKeys';

export interface BonusPoint {
  id: string;
  user_id: string;
  unit_id: string;
  points: number;
  reason: string;
  type: 'auto' | 'manual';
  badge_id: string | null;
  awarded_by: string | null;
  month: string;
  created_at: string;
}

export interface HighValueBadge {
  id: string;
  title: string;
  points: number;
  cooldown: 'weekly' | 'monthly';
  icon: string;
}

export const HIGH_VALUE_BADGES: HighValueBadge[] = [
  { id: 'perfect_punctuality', title: 'Pontualidade Perfeita', points: 15, cooldown: 'weekly', icon: '⏰' },
  { id: 'perfect_week', title: 'Semana Perfeita', points: 25, cooldown: 'weekly', icon: '🏆' },
  { id: 'fire_streak', title: 'Sequência de Fogo', points: 20, cooldown: 'monthly', icon: '🔥' },
  { id: 'speedster', title: 'Velocista', points: 10, cooldown: 'weekly', icon: '⚡' },
  { id: 'early_bird', title: 'Madrugador', points: 5, cooldown: 'weekly', icon: '🌅' },
];

function getCurrentMonth(): string {
  return format(startOfMonth(new Date()), 'yyyy-MM-dd');
}

export function useBonusPoints(targetUserId?: string) {
  const { user } = useAuth();
  const { activeUnitId } = useUnit();
  const queryClient = useQueryClient();
  const currentMonth = getCurrentMonth();

  const uid = targetUserId || user?.id;

  // Fetch bonus points for a user in current month
  const { data: bonusPoints = [], isLoading } = useQuery({
    queryKey: ['bonus-points', uid, activeUnitId, currentMonth],
    queryFn: async () => {
      if (!uid || !activeUnitId) return [];
      const { data } = await supabase
        .from('bonus_points')
        .select('*')
        .eq('user_id', uid)
        .eq('unit_id', activeUnitId)
        .eq('month', currentMonth)
        .order('created_at', { ascending: false });
      return (data || []) as BonusPoint[];
    },
    enabled: !!uid && !!activeUnitId,
  });

  const totalBonusPoints = bonusPoints.reduce((sum, bp) => sum + bp.points, 0);

  // Check if a badge was already awarded (cooldown)
  const hasBadge = (badgeId: string) => {
    return bonusPoints.some(bp => bp.badge_id === badgeId);
  };

  // Award auto bonus
  const awardAutoBonusMutation = useMutation({
    mutationFn: async ({ badgeId, points, reason }: { badgeId: string; points: number; reason: string }) => {
      if (!user?.id || !activeUnitId) throw new Error('Missing context');
      const { error } = await supabase.from('bonus_points').insert({
        user_id: user.id,
        unit_id: activeUnitId,
        points,
        reason,
        type: 'auto',
        badge_id: badgeId,
        month: currentMonth,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bonus-points'] });
      invalidateGamificationCaches(queryClient);
    },
  });

  // Award manual bonus (admin only)
  const awardManualBonusMutation = useMutation({
    mutationFn: async ({ targetUserId: tid, points, reason }: { targetUserId: string; points: number; reason: string }) => {
      if (!user?.id || !activeUnitId) throw new Error('Missing context');
      const { error } = await supabase.from('bonus_points').insert({
        user_id: tid,
        unit_id: activeUnitId,
        points,
        reason,
        type: 'manual',
        awarded_by: user.id,
        month: currentMonth,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bonus-points'] });
      invalidateGamificationCaches(queryClient);
      toast.success('Bônus concedido com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao conceder bônus');
    },
  });

  return {
    bonusPoints,
    totalBonusPoints,
    isLoading,
    hasBadge,
    awardAutoBonus: awardAutoBonusMutation.mutate,
    awardManualBonus: awardManualBonusMutation.mutate,
    isAwarding: awardManualBonusMutation.isPending,
    currentMonth,
  };
}
