import { Leaderboard } from '@/components/dashboard/Leaderboard';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useAuth } from '@/contexts/AuthContext';

export function LeaderboardWidget() {
  const { user } = useAuth();
  const { leaderboard, isLoading } = useLeaderboard();

  return (
    <div className="h-full overflow-hidden">
      <Leaderboard
        entries={leaderboard}
        currentUserId={user?.id}
        isLoading={isLoading}
        maxEntries={3}
      />
    </div>
  );
}
