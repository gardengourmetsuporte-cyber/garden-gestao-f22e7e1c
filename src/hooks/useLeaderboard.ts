import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  earned_points: number;
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

export function useLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [sectorPoints, setSectorPoints] = useState<SectorPointsSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
    fetchSectorPoints();
  }, []);

  async function fetchLeaderboard() {
    setIsLoading(true);
    try {
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url');

      if (profilesError) throw profilesError;

      // Get completions with actual points_awarded (variable points per task: 0-4)
      const { data: completions, error: completionsError } = await supabase
        .from('checklist_completions')
        .select('completed_by, points_awarded, awarded_points')
        .eq('awarded_points', true);

      if (completionsError) throw completionsError;

      // Get redemptions per user (spent points) - only approved/delivered
      const { data: redemptions, error: redemptionsError } = await supabase
        .from('reward_redemptions')
        .select('user_id, points_spent, status')
        .in('status', ['approved', 'delivered']);

      if (redemptionsError) throw redemptionsError;

      // Calculate points for each user
      const userPointsMap = new Map<string, { earned: number; spent: number }>();

      // Sum earned points using points_awarded value
      completions?.forEach(c => {
        const current = userPointsMap.get(c.completed_by) || { earned: 0, spent: 0 };
        current.earned += c.points_awarded || 0;
        userPointsMap.set(c.completed_by, current);
      });

      // Sum spent points
      redemptions?.forEach(r => {
        const current = userPointsMap.get(r.user_id) || { earned: 0, spent: 0 };
        current.spent += r.points_spent;
        userPointsMap.set(r.user_id, current);
      });

      // Build leaderboard entries
      const entries: LeaderboardEntry[] = (profiles || [])
        .map(profile => {
          const points = userPointsMap.get(profile.user_id) || { earned: 0, spent: 0 };
          return {
            user_id: profile.user_id,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
            earned_points: points.earned,
            spent_points: points.spent,
            balance: points.earned - points.spent,
            rank: 0,
          };
        })
        .filter(e => e.earned_points > 0) // Only show users with points
        .sort((a, b) => b.earned_points - a.earned_points);

      // Assign ranks
      entries.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      setLeaderboard(entries);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchSectorPoints() {
    try {
      // Get sectors
      const { data: sectors, error: sectorsError } = await supabase
        .from('checklist_sectors')
        .select('id, name, color')
        .order('sort_order');

      if (sectorsError) throw sectorsError;

      // Get subcategories with sector_id
      const { data: subcategories, error: subError } = await supabase
        .from('checklist_subcategories')
        .select('id, sector_id');

      if (subError) throw subError;

      // Get items with subcategory_id
      const { data: items, error: itemsError } = await supabase
        .from('checklist_items')
        .select('id, subcategory_id, is_active');

      if (itemsError) throw itemsError;

      // Get all completions
      const { data: completions, error: compError } = await supabase
        .from('checklist_completions')
        .select('item_id');

      if (compError) throw compError;

      // Build sector -> subcategory -> items map
      const subcatToSectorMap = new Map<string, string>();
      subcategories?.forEach(sub => {
        subcatToSectorMap.set(sub.id, sub.sector_id);
      });

      const itemToSectorMap = new Map<string, string>();
      items?.forEach(item => {
        if (item.is_active) {
          const sectorId = subcatToSectorMap.get(item.subcategory_id);
          if (sectorId) {
            itemToSectorMap.set(item.id, sectorId);
          }
        }
      });

      // Count completions per sector
      const sectorCompletions = new Map<string, number>();
      completions?.forEach(c => {
        const sectorId = itemToSectorMap.get(c.item_id);
        if (sectorId) {
          sectorCompletions.set(sectorId, (sectorCompletions.get(sectorId) || 0) + 1);
        }
      });

      // Count total tasks per sector
      const sectorTasks = new Map<string, number>();
      items?.forEach(item => {
        if (item.is_active) {
          const sectorId = subcatToSectorMap.get(item.subcategory_id);
          if (sectorId) {
            sectorTasks.set(sectorId, (sectorTasks.get(sectorId) || 0) + 1);
          }
        }
      });

      // Build summary
      const summary: SectorPointsSummary[] = (sectors || []).map(sector => ({
        sector_id: sector.id,
        sector_name: sector.name,
        sector_color: sector.color,
        points_earned: sectorCompletions.get(sector.id) || 0,
        total_tasks: sectorTasks.get(sector.id) || 0,
      }));

      setSectorPoints(summary);
    } catch (error) {
      console.error('Error fetching sector points:', error);
    }
  }

  return {
    leaderboard,
    sectorPoints,
    isLoading,
    refetch: () => {
      fetchLeaderboard();
      fetchSectorPoints();
    },
  };
}
