import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { calculatePointsSummary, calculateEarnedPoints } from '@/lib/points';
import { calculateMedals, type Medal } from '@/lib/medals';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export interface ProfileData {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  jobTitle: string | null;
  selectedFrame: string | null;
  earned: number;
  spent: number;
  balance: number;
  totalCompletions: number;
  totalRedemptions: number;
  medals: Medal[];
  leaderboardRank: number | null;
  bonusPoints: Array<{ points: number; reason: string; type: string; created_at: string }>;
  totalBonusPoints: number;
  monthlyScore: number;
  monthlyBase: number;
  monthlyBonus: number;
}

async function fetchProfileData(userId: string, unitId: string | null): Promise<Omit<ProfileData, 'leaderboardRank'>> {
  const now = new Date();
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');

  // Build queries with optional unit_id filter (same logic as usePoints)
  let completionsQuery = supabase
    .from('checklist_completions')
    .select('points_awarded, awarded_points, completed_at, item_id')
    .eq('completed_by', userId)
    .limit(10000);
  if (unitId) completionsQuery = completionsQuery.eq('unit_id', unitId);

  let redemptionsQuery = supabase
    .from('reward_redemptions')
    .select('points_spent, status')
    .eq('user_id', userId)
    .limit(10000);
  if (unitId) redemptionsQuery = redemptionsQuery.eq('unit_id', unitId);

  let bonusQuery = supabase
    .from('bonus_points')
    .select('points, reason, type, created_at')
    .eq('user_id', userId)
    .eq('month', monthStart)
    .order('created_at', { ascending: false })
    .limit(10000);
  if (unitId) bonusQuery = bonusQuery.eq('unit_id', unitId);

  let monthlyCompletionsQuery = supabase
    .from('checklist_completions')
    .select('points_awarded, awarded_points')
    .eq('completed_by', userId)
    .gte('date', monthStart)
    .lte('date', monthEnd)
    .limit(10000);
  if (unitId) monthlyCompletionsQuery = monthlyCompletionsQuery.eq('unit_id', unitId);

  let badgeQuery = supabase
    .from('bonus_points')
    .select('badge_id')
    .eq('user_id', userId)
    .eq('badge_id', 'employee_of_month')
    .limit(10000);
  if (unitId) badgeQuery = badgeQuery.eq('unit_id', unitId);

  let inventorQuery = supabase
    .from('bonus_points')
    .select('badge_id')
    .eq('user_id', userId)
    .eq('badge_id', 'inventor')
    .limit(10000);
  if (unitId) inventorQuery = inventorQuery.eq('unit_id', unitId);

  const [{ data: profile }, { data: completions }, { data: redemptions }, { data: bonusRows }, { data: monthlyCompletions }, { data: badgeRows }, { data: employeeRow }, { data: inventorRows }] = await Promise.all([
    supabase.from('profiles').select('user_id, full_name, avatar_url, job_title, selected_frame').eq('user_id', userId).single(),
    completionsQuery,
    redemptionsQuery,
    bonusQuery,
    monthlyCompletionsQuery,
    badgeQuery,
    supabase.from('employees').select('admission_date').eq('user_id', userId).maybeSingle(),
    inventorQuery,
  ]);

  const summary = calculatePointsSummary(completions || [], redemptions || []);
  const totalCompletions = (completions || []).filter(c => c.awarded_points !== false).length;
  const totalRedemptions = (redemptions || []).filter(r => r.status === 'approved' || r.status === 'delivered').length;

  const medals = calculateMedals({
    hasEmployeeOfMonth: (badgeRows || []).length > 0,
    admissionDate: employeeRow?.admission_date || null,
    hasInventedRecipe: (inventorRows || []).length > 0,
  });

  const bonusPoints = (bonusRows || []) as Array<{ points: number; reason: string; type: string; created_at: string }>;
  const totalBonusPoints = bonusPoints.reduce((sum, b) => sum + b.points, 0);
  const monthlyBase = calculateEarnedPoints(monthlyCompletions || []);

  return {
    userId,
    fullName: profile?.full_name || 'Usuário',
    avatarUrl: profile?.avatar_url || null,
    jobTitle: profile?.job_title || null,
    selectedFrame: (profile as any)?.selected_frame || null,
    ...summary,
    totalCompletions,
    totalRedemptions,
    medals,
    bonusPoints,
    totalBonusPoints,
    monthlyScore: monthlyBase + totalBonusPoints,
    monthlyBase,
    monthlyBonus: totalBonusPoints,
  };
}

export function useProfile(userId: string | undefined, leaderboard?: Array<{ user_id: string; rank: number }>, unitId?: string | null) {
  const { data, isLoading } = useQuery({
    queryKey: ['profile', userId, unitId],
    queryFn: () => fetchProfileData(userId!, unitId ?? null),
    enabled: !!userId,
    staleTime: 60_000,
    refetchInterval: 300_000, // Reduced from 60s to 5min to lower backend load at scale
  });

  const leaderboardRank = leaderboard?.find(e => e.user_id === userId)?.rank ?? null;

  const profile: ProfileData | undefined = data ? { ...data, leaderboardRank } : undefined;

  return { profile, isLoading };
}
