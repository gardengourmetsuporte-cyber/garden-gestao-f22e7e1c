import { Trophy, Medal, Star, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LeaderboardEntry } from '@/hooks/useLeaderboard';
import { cn } from '@/lib/utils';

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
      case 1: return <Trophy className="w-4 h-4 text-amber-500" />;
      case 2: return <Medal className="w-4 h-4 text-gray-400" />;
      case 3: return <Medal className="w-4 h-4 text-amber-700" />;
      default: return <span className="w-4 text-center text-xs font-bold text-muted-foreground">{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-amber-500/10 to-transparent border-amber-500/20';
      case 2: return 'bg-gradient-to-r from-gray-400/10 to-transparent border-gray-400/20';
      case 3: return 'bg-gradient-to-r from-amber-700/10 to-transparent border-amber-700/20';
      default: return 'bg-card';
    }
  };

  if (isLoading) {
    return (
      <div className="card-base p-4">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4 text-amber-500" />
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
    <div className="card-base p-4">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-4 h-4 text-amber-500" />
        <h3 className="font-semibold text-sm text-foreground">Ranking de Pontos</h3>
      </div>
      <div className="space-y-1.5">
        {displayEntries.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Trophy className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhum ponto registrado</p>
          </div>
        ) : (
          displayEntries.map((entry, idx) => {
            const isCurrentUser = entry.user_id === currentUserId;
            return (
              <div
                key={entry.user_id}
                className={cn(
                  "flex items-center gap-2.5 p-2.5 rounded-xl border transition-all animate-slide-up",
                  getRankBg(entry.rank),
                  isCurrentUser && "ring-2 ring-primary/30 ring-offset-1",
                  `stagger-${Math.min(idx + 1, 8)}`
                )}
              >
                <div className="w-6 flex items-center justify-center shrink-0">
                  {getRankIcon(entry.rank)}
                </div>
                <Avatar className="w-8 h-8">
                  <AvatarImage src={entry.avatar_url || undefined} className="object-cover" />
                  <AvatarFallback className="text-xs">
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className={cn("font-medium text-xs truncate", isCurrentUser && "text-primary")}>
                    {entry.full_name}
                    {isCurrentUser && <span className="text-[10px] ml-1 text-muted-foreground">(você)</span>}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Saldo: {entry.balance} pts
                  </p>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 shrink-0">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span className="font-bold text-xs text-amber-600">{entry.earned_points}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
