import { Leaderboard } from '@/components/dashboard/Leaderboard';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useAuth } from '@/contexts/AuthContext';

interface LeaderboardWidgetProps {
  size: 'medium' | 'large';
}

export function LeaderboardWidget({ size }: LeaderboardWidgetProps) {
  const { user } = useAuth();
  const { leaderboard, isLoading } = useLeaderboard();

  return (
    <Leaderboard
      entries={leaderboard}
      currentUserId={user?.id}
      isLoading={isLoading}
      maxEntries={size === 'medium' ? 5 : undefined}
    />
  );
}
