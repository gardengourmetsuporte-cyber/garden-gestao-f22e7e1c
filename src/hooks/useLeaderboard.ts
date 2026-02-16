import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { calculateEarnedPoints, calculateSpentPoints } from '@/lib/points';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  earned_points: number;
  bonus_points: number;
  total_score: number;
  spent_points: number;
  balance: number;
  rank: number;
}

export interface SectorPointsSummary {
  sector_id: string;
  sector_name: string;
  sector_color: string;
  points_earned: number;
  total_tasks: number;
}

async function fetchLeaderboardData(unitId: string, month: Date): Promise<LeaderboardEntry[]> {
  const monthStart = format(startOfMonth(month), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(month), 'yyyy-MM-dd');

  const [{ data: profiles }, { data: completions }, { data: redemptions }, { data: bonusRows }] = await Promise.all([
    supabase.from('profiles').select('user_id, full_name, avatar_url'),
    supabase
      .from('checklist_completions')
      .select('completed_by, points_awarded, awarded_points, date')
      .eq('unit_id', unitId)
      .gte('date', monthStart)
      .lte('date', monthEnd),
    supabase.from('reward_redemptions').select('user_id, points_spent, status').eq('unit_id', unitId),
    supabase
      .from('bonus_points')
      .select('user_id, points')
      .eq('unit_id', unitId)
      .eq('month', monthStart),
  ]);

  const userCompletions = new Map<string, Array<{ points_awarded: number; awarded_points?: boolean }>>();
  completions?.forEach(c => {
    const list = userCompletions.get(c.completed_by) || [];
    list.push({ points_awarded: c.points_awarded, awarded_points: c.awarded_points });
    userCompletions.set(c.completed_by, list);
  });

  const userRedemptions = new Map<string, Array<{ points_spent: number; status: string }>>();
  redemptions?.forEach(r => {
    const list = userRedemptions.get(r.user_id) || [];
    list.push({ points_spent: r.points_spent, status: r.status });
    userRedemptions.set(r.user_id, list);
  });

  const userBonus = new Map<string, number>();
  bonusRows?.forEach(b => {
    userBonus.set(b.user_id, (userBonus.get(b.user_id) || 0) + b.points);
  });

  const entries: LeaderboardEntry[] = (profiles || [])
    .map(profile => {
      const earned = calculateEarnedPoints(userCompletions.get(profile.user_id) || []);
      const spent = calculateSpentPoints(userRedemptions.get(profile.user_id) || []);
      const bonus = userBonus.get(profile.user_id) || 0;
      return {
        user_id: profile.user_id,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        earned_points: earned,
        bonus_points: bonus,
        total_score: earned + bonus,
        spent_points: spent,
        balance: earned - spent,
        rank: 0,
      };
    })
    .filter(e => e.total_score > 0)
    .sort((a, b) => b.total_score - a.total_score);

  entries.forEach((entry, index) => { entry.rank = index + 1; });
  return entries;
}

async function fetchSectorPointsData(unitId: string): Promise<SectorPointsSummary[]> {
  const [{ data: sectors }, { data: subcategories }, { data: items }, { data: completions }] = await Promise.all([
    supabase.from('checklist_sectors').select('id, name, color').eq('unit_id', unitId).order('sort_order'),
    supabase.from('checklist_subcategories').select('id, sector_id').eq('unit_id', unitId),
    supabase.from('checklist_items').select('id, subcategory_id, is_active').eq('unit_id', unitId),
    supabase.from('checklist_completions').select('item_id').eq('unit_id', unitId),
  ]);

  const subcatToSectorMap = new Map<string, string>();
  subcategories?.forEach(sub => subcatToSectorMap.set(sub.id, sub.sector_id));

  const itemToSectorMap = new Map<string, string>();
  items?.forEach(item => {
    if (item.is_active) {
      const sectorId = subcatToSectorMap.get(item.subcategory_id);
      if (sectorId) itemToSectorMap.set(item.id, sectorId);
    }
  });

  const sectorCompletions = new Map<string, number>();
  completions?.forEach(c => {
    const sectorId = itemToSectorMap.get(c.item_id);
    if (sectorId) sectorCompletions.set(sectorId, (sectorCompletions.get(sectorId) || 0) + 1);
  });

  const sectorTasks = new Map<string, number>();
  items?.forEach(item => {
    if (item.is_active) {
      const sectorId = subcatToSectorMap.get(item.subcategory_id);
      if (sectorId) sectorTasks.set(sectorId, (sectorTasks.get(sectorId) || 0) + 1);
    }
  });

  return (sectors || []).map(sector => ({
    sector_id: sector.id,
    sector_name: sector.name,
    sector_color: sector.color,
    points_earned: sectorCompletions.get(sector.id) || 0,
    total_tasks: sectorTasks.get(sector.id) || 0,
  }));
}

export function useLeaderboard() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { activeUnitId } = useUnit();
  const [selectedMonth, setSelectedMonth] = useState(() => startOfMonth(new Date()));

  const { data: leaderboard = [], isLoading: isLoadingLeaderboard } = useQuery({
    queryKey: ['leaderboard', activeUnitId, format(selectedMonth, 'yyyy-MM')],
    queryFn: () => fetchLeaderboardData(activeUnitId!, selectedMonth),
    enabled: !!user && !!activeUnitId,
  });

  const { data: sectorPoints = [], isLoading: isLoadingSectors } = useQuery({
    queryKey: ['sector-points', activeUnitId],
    queryFn: () => fetchSectorPointsData(activeUnitId!),
    enabled: !!user && !!activeUnitId,
  });

  const isLoading = isLoadingLeaderboard || isLoadingSectors;

  return useMemo(() => ({
    leaderboard,
    sectorPoints,
    isLoading,
    selectedMonth,
    setSelectedMonth,
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['sector-points'] });
    },
  }), [leaderboard, sectorPoints, isLoading, selectedMonth, queryClient]);
}
