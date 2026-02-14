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

async function fetchProfileData(userId: string): Promise<Omit<ProfileData, 'leaderboardRank'>> {
  const [{ data: profile }, { data: completions }, { data: redemptions }] = await Promise.all([
    supabase.from('profiles').select('user_id, full_name, avatar_url, job_title').eq('user_id', userId).single(),
    supabase.from('checklist_completions').select('points_awarded, awarded_points').eq('completed_by', userId),
    supabase.from('reward_redemptions').select('points_spent, status').eq('user_id', userId),
  ]);

  const summary = calculatePointsSummary(completions || [], redemptions || []);
  const totalCompletions = (completions || []).filter(c => c.awarded_points !== false).length;
  const totalRedemptions = (redemptions || []).filter(r => r.status === 'approved' || r.status === 'delivered').length;

  return {
    userId,
    fullName: profile?.full_name || 'Usuário',
    avatarUrl: profile?.avatar_url || null,
    jobTitle: profile?.job_title || null,
    ...summary,
    totalCompletions,
    totalRedemptions,
    achievements: calculateAchievements({ totalCompletions, earnedPoints: summary.earned, totalRedemptions }),
  };
}

export function useProfile(userId: string | undefined, leaderboard?: Array<{ user_id: string; rank: number }>) {
  const { data, isLoading } = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => fetchProfileData(userId!),
    enabled: !!userId,
  });

  // Derive rank from leaderboard cache instead of re-fetching all completions
  const leaderboardRank = leaderboard?.find(e => e.user_id === userId)?.rank ?? null;

  const profile: ProfileData | undefined = data ? { ...data, leaderboardRank } : undefined;

  return { profile, isLoading };
}
