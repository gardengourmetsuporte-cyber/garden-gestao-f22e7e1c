import { RankedAvatar } from '@/components/profile/RankedAvatar';
import { getRank, getNextRank } from '@/lib/ranks';
import { formatPoints } from '@/lib/points';
import { Progress } from '@/components/ui/progress';
import { Star, TrendingUp } from 'lucide-react';

interface MyRankCardProps {
  fullName: string;
  avatarUrl?: string | null;
  earnedPoints: number;
  monthlyScore: number;
  leaderboardPosition?: number;
}

export function MyRankCard({ fullName, avatarUrl, earnedPoints, monthlyScore, leaderboardPosition }: MyRankCardProps) {
  const rank = getRank(earnedPoints);
  const next = getNextRank(earnedPoints);

  return (
    <div className="card-command p-5">
      <div className="flex items-center gap-4">
        <RankedAvatar avatarUrl={avatarUrl} earnedPoints={earnedPoints} size={72} showTitle />
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-foreground truncate">{fullName}</h2>
          <p className="text-xs font-semibold mt-0.5" style={{ color: rank.color }}>
            {rank.title}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-current" style={{ color: 'hsl(var(--neon-amber))' }} />
              <span className="text-xs font-bold" style={{ color: 'hsl(var(--neon-amber))' }}>{monthlyScore} pts/mês</span>
            </div>
            {leaderboardPosition && (
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" style={{ color: 'hsl(var(--neon-green))' }} />
                <span className="text-xs font-bold" style={{ color: 'hsl(var(--neon-green))' }}>#{leaderboardPosition}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {next && (
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span style={{ color: rank.color }}>{rank.title}</span>
            <span>{next.title}</span>
          </div>
          <Progress
            value={100 - (next.pointsNeeded / (earnedPoints + next.pointsNeeded)) * 100}
            className="h-2"
          />
          <p className="text-[10px] text-center text-muted-foreground">
            Faltam <span className="font-semibold text-foreground">{formatPoints(next.pointsNeeded)}</span> pts para {next.title}
          </p>
        </div>
      )}
    </div>
  );
}
