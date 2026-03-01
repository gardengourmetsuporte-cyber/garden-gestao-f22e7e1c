// Centralized query key constants and cache invalidation helpers

import type { QueryClient } from '@tanstack/react-query';

export const QUERY_KEYS = {
  points: ['points'] as const,
  profile: ['profile'] as const,
  leaderboard: ['leaderboard'] as const,
  bonusPoints: ['bonus-points'] as const,
  grantedMedals: ['granted-medals'] as const,
} as const;

/** Invalidate all gamification-related caches (points, profile, leaderboard) */
export function invalidateGamificationCaches(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.points });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.leaderboard });
}
