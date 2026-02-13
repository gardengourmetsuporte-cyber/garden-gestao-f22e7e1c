import { Trophy, Medal, Star } from 'lucide-react';
import { LeaderboardEntry } from '@/hooks/useLeaderboard';
import { cn } from '@/lib/utils';
import { RankedAvatar } from '@/components/profile/RankedAvatar';
import { getRank } from '@/lib/ranks';
import { Link } from 'react-router-dom';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  isLoading?: boolean;
  maxEntries?: number;
}

export function Leaderboard({ entries, currentUserId, isLoading, maxEntries }: LeaderboardProps) {
  const displayEntries = maxEntries ? entries.slice(0, maxEntries) : entries;

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="w-4 h-4" style={{ color: 'hsl(var(--neon-amber))' }} />;
      case 2: return <Medal className="w-4 h-4 text-muted-foreground" />;
      case 3: return <Medal className="w-4 h-4" style={{ color: 'hsl(30 60% 40%)' }} />;
      default: return <span className="w-4 text-center text-xs font-bold text-muted-foreground">{rank}</span>;
    }
  };

  const getRankBorder = (rank: number) => {
    switch (rank) {
      case 1: return 'border-l-[hsl(var(--neon-amber))]';
      case 2: return 'border-l-muted-foreground/60';
      case 3: return 'border-l-[hsl(30,60%,40%)]/60';
      default: return 'border-l-border/30';
    }
  };

  if (isLoading) {
    return (
      <div className="card-command p-4">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4" style={{ color: 'hsl(var(--neon-amber))' }} />
          <h3 className="font-semibold text-sm text-foreground">Ranking de Pontos</h3>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-14 bg-secondary rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card-command p-4">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4" style={{ color: 'hsl(var(--neon-amber))' }} />
        <h3 className="font-semibold text-sm text-foreground">Ranking de Pontos</h3>
      </div>
      <div className="space-y-1.5">
        {displayEntries.length === 0 ? (
          <div className="empty-state py-6">
            <Trophy className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Nenhum ponto registrado</p>
          </div>
        ) : (
          displayEntries.map((entry, idx) => {
            const isCurrentUser = entry.user_id === currentUserId;
            const entryRank = getRank(entry.earned_points);
            return (
              <Link
                to={`/profile/${entry.user_id}`}
                key={entry.user_id}
                className={cn(
                  "list-command flex items-center gap-2.5 p-2.5 border-l-3 animate-slide-up",
                  getRankBorder(entry.rank),
                  isCurrentUser && "ring-1 ring-primary/30",
                  `stagger-${Math.min(idx + 1, 8)}`
                )}
              >
                <div className="w-6 flex items-center justify-center shrink-0">
                  {getRankIcon(entry.rank)}
                </div>
                <RankedAvatar avatarUrl={entry.avatar_url} earnedPoints={entry.earned_points} size={32} />
                <div className="flex-1 min-w-0">
                  <p className={cn("font-medium text-xs truncate", isCurrentUser && "text-primary")}>
                    {entry.full_name}
                    {isCurrentUser && <span className="text-[10px] ml-1 text-muted-foreground">(você)</span>}
                  </p>
                  <p className="text-[10px]" style={{ color: entryRank.color }}>
                    {entryRank.title} • Saldo: {entry.balance} pts
                  </p>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-full shrink-0" style={{ background: 'hsl(var(--neon-amber) / 0.1)' }}>
                  <Star className="w-3 h-3 fill-current" style={{ color: 'hsl(var(--neon-amber))' }} />
                  <span className="font-bold text-xs" style={{ color: 'hsl(var(--neon-amber))' }}>{entry.earned_points}</span>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
