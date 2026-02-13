import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { calculatePointsSummary } from '@/lib/points';
import { calculateAchievements, type Achievement } from '@/lib/achievements';

export interface ProfileData {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  jobTitle: string | null;
  earned: number;
  spent: number;
  balance: number;
  totalCompletions: number;
  totalRedemptions: number;
  achievements: Achievement[];
  leaderboardRank: number | null;
}

async function fetchProfileData(userId: string): Promise<ProfileData> {
  const [{ data: profile }, { data: completions }, { data: redemptions }, { data: allCompletions }] = await Promise.all([
    supabase.from('profiles').select('user_id, full_name, avatar_url, job_title').eq('user_id', userId).single(),
    supabase.from('checklist_completions').select('points_awarded, awarded_points').eq('completed_by', userId),
    supabase.from('reward_redemptions').select('points_spent, status').eq('user_id', userId),
    supabase.from('checklist_completions').select('completed_by, points_awarded, awarded_points'),
  ]);

  const summary = calculatePointsSummary(completions || [], redemptions || []);
  const totalCompletions = (completions || []).filter(c => c.awarded_points !== false).length;
  const totalRedemptions = (redemptions || []).filter(r => r.status === 'approved' || r.status === 'delivered').length;

  // Calculate rank
  const userEarned = new Map<string, number>();
  (allCompletions || []).forEach(c => {
    if (c.awarded_points !== false) {
      userEarned.set(c.completed_by, (userEarned.get(c.completed_by) || 0) + (c.points_awarded || 0));
    }
  });
  const sorted = [...userEarned.entries()].sort((a, b) => b[1] - a[1]);
  const rankIdx = sorted.findIndex(([uid]) => uid === userId);

  return {
    userId,
    fullName: profile?.full_name || 'Usuário',
    avatarUrl: profile?.avatar_url || null,
    jobTitle: profile?.job_title || null,
    ...summary,
    totalCompletions,
    totalRedemptions,
    achievements: calculateAchievements({ totalCompletions, earnedPoints: summary.earned, totalRedemptions }),
    leaderboardRank: rankIdx >= 0 ? rankIdx + 1 : null,
  };
}

export function useProfile(userId: string | undefined) {
  const { data, isLoading } = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => fetchProfileData(userId!),
    enabled: !!userId,
  });

  return { profile: data, isLoading };
}
