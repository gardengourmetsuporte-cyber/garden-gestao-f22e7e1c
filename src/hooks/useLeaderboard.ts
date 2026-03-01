import { useMemo, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export type LeaderboardScope = 'unit' | 'global';

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
  /** All-time earned points (for rank/frame calculation) */
  earned_all_time: number;
  /** Unit name — only populated in global scope */
  unit_name?: string;
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

  const { data: userUnitsData } = await supabase
    .from('user_units')
    .select('user_id')
    .eq('unit_id', unitId);

  const userIds = (userUnitsData || []).map(u => u.user_id);

  const [{ data: rpcData }, { data: profilesData }] = await Promise.all([
    supabase.rpc('get_leaderboard_data', {
      p_unit_id: unitId,
      p_month_start: monthStart,
      p_month_end: monthEnd,
    }),
    userIds.length > 0
      ? supabase.from('profiles').select('user_id, full_name, avatar_url').in('user_id', userIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  return buildEntries(rpcData, profilesData);
}

async function fetchGlobalLeaderboardData(month: Date): Promise<LeaderboardEntry[]> {
  const monthStart = format(startOfMonth(month), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(month), 'yyyy-MM-dd');

  const { data: rpcData } = await supabase.rpc('get_global_leaderboard_data', {
    p_month_start: monthStart,
    p_month_end: monthEnd,
  });

  const userIds = (rpcData || []).map((r: any) => r.user_id);
  const unitIds = [...new Set((rpcData || []).map((r: any) => r.unit_id).filter(Boolean))];

  const [{ data: profilesData }, { data: unitsData }] = await Promise.all([
    userIds.length > 0
      ? supabase.from('profiles').select('user_id, full_name, avatar_url').in('user_id', userIds)
      : Promise.resolve({ data: [] as any[] }),
    unitIds.length > 0
      ? supabase.from('units').select('id, name').in('id', unitIds as string[])
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const unitMap = new Map<string, string>();
  (unitsData || []).forEach((u: any) => unitMap.set(u.id, u.name));

  const entries = buildEntries(rpcData, profilesData);
  // Attach unit_name from RPC unit_id
  const rpcMap = new Map<string, string>();
  (rpcData || []).forEach((r: any) => { if (r.unit_id) rpcMap.set(r.user_id, r.unit_id); });
  entries.forEach(e => {
    const uid = rpcMap.get(e.user_id);
    if (uid) e.unit_name = unitMap.get(uid) || '';
  });

  return entries;
}

function buildEntries(rpcData: any, profilesData: any): LeaderboardEntry[] {
  const profileMap = new Map<string, { full_name: string; avatar_url: string | null }>();
  (profilesData || []).forEach((p: any) => profileMap.set(p.user_id, p));

  const entries: LeaderboardEntry[] = (rpcData || [])
    .map((row: any) => {
      const profile = profileMap.get(row.user_id);
      if (!profile) return null;
      const earned = Number(row.earned_points) || 0;
      const bonus = Number(row.bonus_points) || 0;
      const spent = Number(row.spent_points) || 0;
      const allTimeEarned = Number(row.earned_all_time) || 0;
      return {
        user_id: row.user_id,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        earned_points: earned,
        bonus_points: bonus,
        total_score: earned + bonus,
        spent_points: spent,
        balance: earned - spent,
        rank: 0,
        earned_all_time: allTimeEarned,
      };
    })
    .filter((e: any): e is LeaderboardEntry => e !== null && e.total_score > 0)
    .sort((a: LeaderboardEntry, b: LeaderboardEntry) => b.total_score - a.total_score);

  entries.forEach((entry, index) => { entry.rank = index + 1; });
  return entries;
}

async function fetchSectorPointsData(unitId: string): Promise<SectorPointsSummary[]> {
  const { data, error } = await supabase.rpc('get_sector_points_summary', {
    p_unit_id: unitId,
  });
  if (error) throw error;
  return ((data as any[]) || []).map((s: any) => ({
    sector_id: s.sector_id,
    sector_name: s.sector_name,
    sector_color: s.sector_color,
    points_earned: Number(s.points_earned) || 0,
    total_tasks: Number(s.total_tasks) || 0,
  }));
}

export function useLeaderboard(scope: LeaderboardScope = 'unit') {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { activeUnitId } = useUnit();
  const [selectedMonth, setSelectedMonth] = useState(() => startOfMonth(new Date()));

  const { data: leaderboard = [], isLoading: isLoadingLeaderboard, refetch: refetchLeaderboard } = useQuery({
    queryKey: scope === 'unit'
      ? ['leaderboard', activeUnitId, format(selectedMonth, 'yyyy-MM')]
      : ['leaderboard-global', format(selectedMonth, 'yyyy-MM')],
    queryFn: () =>
      scope === 'unit'
        ? fetchLeaderboardData(activeUnitId!, selectedMonth)
        : fetchGlobalLeaderboardData(selectedMonth),
    enabled: scope === 'unit' ? (!!user && !!activeUnitId) : !!user,
    staleTime: 30_000,
    gcTime: 60_000,
  });

  const { data: sectorPoints = [], isLoading: isLoadingSectors } = useQuery({
    queryKey: ['sector-points', activeUnitId],
    queryFn: () => fetchSectorPointsData(activeUnitId!),
    enabled: !!user && !!activeUnitId,
  });

  const isLoading = isLoadingLeaderboard || isLoadingSectors;

  const refetch = useCallback(async () => {
    await Promise.all([
      refetchLeaderboard(),
      queryClient.refetchQueries({ queryKey: ['points'] }),
    ]);
  }, [refetchLeaderboard, queryClient]);

  return useMemo(() => ({
    leaderboard,
    sectorPoints,
    isLoading,
    selectedMonth,
    setSelectedMonth,
    refetch,
  }), [leaderboard, sectorPoints, isLoading, selectedMonth, setSelectedMonth, refetch]);
}
