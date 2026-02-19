import { RankedAvatar } from '@/components/profile/RankedAvatar';
import { getRank, getNextRank } from '@/lib/ranks';
import { formatPoints } from '@/lib/points';
import { Progress } from '@/components/ui/progress';
import { AppIcon } from '@/components/ui/app-icon';
import { useCountUp } from '@/hooks/useCountUp';

interface MyRankCardProps {
  fullName: string;
  avatarUrl?: string | null;
  earnedPoints: number;
  monthlyScore: number;
  leaderboardPosition?: number;
  onRefresh?: () => Promise<void>;
  isSyncing?: boolean;
}

export function MyRankCard({ fullName, avatarUrl, earnedPoints, monthlyScore, leaderboardPosition, onRefresh, isSyncing }: MyRankCardProps) {
  const rank = getRank(earnedPoints);
  const next = getNextRank(earnedPoints);
  const animatedMonthly = useCountUp(monthlyScore);

  return (
    <div className="card-surface p-5">
      <div className="flex items-center gap-4">
        <RankedAvatar avatarUrl={avatarUrl} earnedPoints={earnedPoints} size={72} showTitle />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground truncate">{fullName}</h2>
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isSyncing}
                className="p-1.5 rounded-lg hover:bg-secondary transition-all active:scale-95 disabled:opacity-50"
              >
                <AppIcon name="RefreshCw" size={16} className={isSyncing ? 'animate-spin text-primary' : 'text-muted-foreground'} />
              </button>
            )}
          </div>
          <h2 className="text-base font-bold text-foreground truncate">{fullName}</h2>
          <p className="text-xs font-semibold mt-0.5" style={{ color: rank.color }}>
            {rank.title}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1">
              <AppIcon name="Star" size={14} style={{ color: 'hsl(var(--neon-amber))' }} />
              <span className="text-xs font-bold" style={{ color: 'hsl(var(--neon-amber))' }}>{animatedMonthly} pts/mês</span>
            </div>
            {leaderboardPosition && (
              <div className="flex items-center gap-1">
                <AppIcon name="TrendingUp" size={14} style={{ color: 'hsl(var(--neon-green))' }} />
                <span className="text-xs font-bold" style={{ color: 'hsl(var(--neon-green))' }}>#{leaderboardPosition}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {next && (
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span style={{ color: rank.color }}>{rank.title}</span>
            <span>{next.title}</span>
          </div>
          <Progress
            value={100 - (next.pointsNeeded / (earnedPoints + next.pointsNeeded)) * 100}
            className="h-2"
          />
          <p className="text-xs text-center text-muted-foreground">
            Faltam <span className="font-semibold text-foreground">{formatPoints(next.pointsNeeded)}</span> pts para {next.title}
          </p>
        </div>
      )}
    </div>
  );
}
