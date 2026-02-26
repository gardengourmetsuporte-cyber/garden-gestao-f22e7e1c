import { useLeaderboard } from '@/hooks/useLeaderboard';
import { Leaderboard } from './Leaderboard';

export default function LazyLeaderboardWidget({ currentUserId }: { currentUserId?: string }) {
  const { leaderboard, isLoading, selectedMonth, setSelectedMonth } = useLeaderboard();
  return (
    <Leaderboard
      entries={leaderboard}
      currentUserId={currentUserId}
      isLoading={isLoading}
      selectedMonth={selectedMonth}
      onMonthChange={setSelectedMonth}
    />
  );
}
