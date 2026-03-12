import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { format, subDays, startOfDay } from 'date-fns';

export interface TeamMemberStats {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  completionsToday: number;
  totalAvailable: number;
  utilizationPct: number;
}

export interface TrendPoint {
  date: string;
  points: number;
}

export interface PendingItem {
  item_id: string;
  item_name: string;
  sector_name: string;
  sector_color: string;
}

export interface TeamDashboardData {
  activeEmployees: number;
  completionsToday: number;
  totalAvailableToday: number;
  utilizationPct: number;
  pendingToday: number;
  memberStats: TeamMemberStats[];
  trend: TrendPoint[];
  pendingItems: PendingItem[];
  isLoading: boolean;
}

export function useTeamDashboard(): TeamDashboardData {
  const { user } = useAuth();
  const { activeUnitId } = useUnit();
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data, isLoading } = useQuery({
    queryKey: ['team-dashboard', activeUnitId, today],
    queryFn: async () => {
      if (!activeUnitId) return null;

      const fourteenDaysAgo = format(subDays(new Date(), 13), 'yyyy-MM-dd');

      const [
        { data: employees },
        { data: completionsToday },
        { data: allItems },
        { data: trendCompletions },
        { data: profiles },
      ] = await Promise.all([
        supabase.from('employees').select('id, user_id, full_name').eq('unit_id', activeUnitId).eq('is_active', true).is('deleted_at', null),
        supabase.from('checklist_completions').select('completed_by, item_id, points_awarded, awarded_points').eq('unit_id', activeUnitId).eq('date', today),
        supabase.from('checklist_items').select('id, name, subcategory_id').eq('unit_id', activeUnitId).eq('is_active', true).is('deleted_at', null),
        supabase.from('checklist_completions').select('completed_by, points_awarded, awarded_points, date').eq('unit_id', activeUnitId).gte('date', fourteenDaysAgo).lte('date', today),
        supabase.from('profiles').select('user_id, full_name, avatar_url'),
      ]);

      // Fetch sectors for pending items
      const { data: subcategories } = await supabase.from('checklist_subcategories').select('id, name, sector_id').eq('unit_id', activeUnitId);
      const { data: sectors } = await supabase.from('checklist_sectors').select('id, name, color').eq('unit_id', activeUnitId);

      const sectorMap = new Map((sectors || []).map(s => [s.id, s]));
      const subMap = new Map((subcategories || []).map(s => [s.id, { ...s, sector: sectorMap.get(s.sector_id) }]));
      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

      const activeEmployeeCount = employees?.length || 0;
      const totalItems = allItems?.length || 0;
      const completedItemIds = new Set((completionsToday || []).map(c => c.item_id));
      const completionCount = completedItemIds.size;
      const utilizationPct = totalItems > 0 ? Math.round((completionCount / totalItems) * 100) : 0;
      const pendingCount = totalItems - completionCount;

      // Member stats
      const completionsByUser = new Map<string, Set<string>>();
      (completionsToday || []).forEach(c => {
        if (!completionsByUser.has(c.completed_by)) completionsByUser.set(c.completed_by, new Set());
        completionsByUser.get(c.completed_by)!.add(c.item_id);
      });

      const memberStats: TeamMemberStats[] = (employees || [])
        .map(e => {
          const uid = e.user_id;
          const profile = uid ? profileMap.get(uid) : null;
          const userCompletions = uid ? (completionsByUser.get(uid)?.size || 0) : 0;
          return {
            user_id: uid || e.id,
            full_name: profile?.full_name || e.full_name,
            avatar_url: profile?.avatar_url || null,
            completionsToday: userCompletions,
            totalAvailable: totalItems,
            utilizationPct: totalItems > 0 ? Math.round((userCompletions / totalItems) * 100) : 0,
          };
        })
        .sort((a, b) => b.utilizationPct - a.utilizationPct);

      // Trend: points per day over 14 days
      const pointsByDate = new Map<string, number>();
      for (let i = 13; i >= 0; i--) {
        pointsByDate.set(format(subDays(new Date(), i), 'yyyy-MM-dd'), 0);
      }
      (trendCompletions || []).forEach(c => {
        if (c.awarded_points === true) {
          const current = pointsByDate.get(c.date) || 0;
          pointsByDate.set(c.date, current + (c.points_awarded || 0));
        }
      });
      const trend: TrendPoint[] = Array.from(pointsByDate.entries()).map(([date, points]) => ({ date, points }));

      // Pending items
      const pendingItems: PendingItem[] = (allItems || [])
        .filter(item => !completedItemIds.has(item.id))
        .slice(0, 20)
        .map(item => {
          const sub = subMap.get(item.subcategory_id);
          return {
            item_id: item.id,
            item_name: item.name,
            sector_name: sub?.sector?.name || '',
            sector_color: sub?.sector?.color || '#6b7280',
          };
        });

      return {
        activeEmployees: activeEmployeeCount,
        completionsToday: completionCount,
        totalAvailableToday: totalItems,
        utilizationPct,
        pendingToday: pendingCount,
        memberStats,
        trend,
        pendingItems,
      };
    },
    enabled: !!user && !!activeUnitId,
    staleTime: 60_000,
  });

  return {
    activeEmployees: data?.activeEmployees ?? 0,
    completionsToday: data?.completionsToday ?? 0,
    totalAvailableToday: data?.totalAvailableToday ?? 0,
    utilizationPct: data?.utilizationPct ?? 0,
    pendingToday: data?.pendingToday ?? 0,
    memberStats: data?.memberStats ?? [],
    trend: data?.trend ?? [],
    pendingItems: data?.pendingItems ?? [],
    isLoading,
  };
}
