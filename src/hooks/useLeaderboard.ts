import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { calculateEarnedPoints, calculateSpentPoints } from '@/lib/points';

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

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    try {
      // Busca todos os perfis
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url');

      if (profilesError) throw profilesError;

      // Busca completions com pontos reais
      const { data: completions, error: completionsError } = await supabase
        .from('checklist_completions')
        .select('completed_by, points_awarded, awarded_points');

      if (completionsError) throw completionsError;

      // Busca redemptions aprovadas/entregues
      const { data: redemptions, error: redemptionsError } = await supabase
        .from('reward_redemptions')
        .select('user_id, points_spent, status');

      if (redemptionsError) throw redemptionsError;

      // Agrupa completions por usuário
      const userCompletions = new Map<string, Array<{ points_awarded: number; awarded_points?: boolean }>>();
      completions?.forEach(c => {
        const list = userCompletions.get(c.completed_by) || [];
        list.push({ points_awarded: c.points_awarded, awarded_points: c.awarded_points });
        userCompletions.set(c.completed_by, list);
      });

      // Agrupa redemptions por usuário
      const userRedemptions = new Map<string, Array<{ points_spent: number; status: string }>>();
      redemptions?.forEach(r => {
        const list = userRedemptions.get(r.user_id) || [];
        list.push({ points_spent: r.points_spent, status: r.status });
        userRedemptions.set(r.user_id, list);
      });

      // Calcula pontos usando funções centralizadas
      const entries: LeaderboardEntry[] = (profiles || [])
        .map(profile => {
          const userComps = userCompletions.get(profile.user_id) || [];
          const userReds = userRedemptions.get(profile.user_id) || [];
          
          const earned = calculateEarnedPoints(userComps);
          const spent = calculateSpentPoints(userReds);
          
          return {
            user_id: profile.user_id,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
            earned_points: earned,
            spent_points: spent,
            balance: earned - spent,
            rank: 0,
          };
        })
        .filter(e => e.earned_points > 0)
        .sort((a, b) => b.earned_points - a.earned_points);

      // Atribui ranks
      entries.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      setLeaderboard(entries);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  useEffect(() => {
    fetchLeaderboard();
    fetchSectorPoints();
  }, [fetchLeaderboard]);

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
