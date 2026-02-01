import { Trophy, Medal, Star, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LeaderboardEntry } from '@/hooks/useLeaderboard';
import { cn } from '@/lib/utils';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  isLoading?: boolean;
  maxEntries?: number;
}

export function Leaderboard({ entries, currentUserId, isLoading, maxEntries = 10 }: LeaderboardProps) {
  const displayEntries = entries.slice(0, maxEntries);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-amber-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-700" />;
      default:
        return <span className="w-5 text-center font-bold text-muted-foreground">{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-amber-500/10 to-amber-500/5 border-amber-500/20';
      case 2:
        return 'bg-gradient-to-r from-gray-400/10 to-gray-400/5 border-gray-400/20';
      case 3:
        return 'bg-gradient-to-r from-amber-700/10 to-amber-700/5 border-amber-700/20';
      default:
        return 'bg-card';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Ranking de Pontos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-secondary rounded-xl animate-pulse" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          Ranking de Pontos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {displayEntries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum ponto registrado ainda</p>
          </div>
        ) : (
          displayEntries.map((entry) => {
            const isCurrentUser = entry.user_id === currentUserId;

            return (
              <div
                key={entry.user_id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border transition-all",
                  getRankBg(entry.rank),
                  isCurrentUser && "ring-2 ring-primary ring-offset-2"
                )}
              >
                {/* Rank */}
                <div className="w-8 flex items-center justify-center">
                  {getRankIcon(entry.rank)}
                </div>

                {/* Avatar */}
                <Avatar className="w-10 h-10">
                  <AvatarImage src={entry.avatar_url || undefined} />
                  <AvatarFallback>
                    <User className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "font-medium truncate",
                    isCurrentUser && "text-primary"
                  )}>
                    {entry.full_name}
                    {isCurrentUser && <span className="text-xs ml-1">(você)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Saldo: {entry.balance} pts
                  </p>
                </div>

                {/* Points */}
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-500/10">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="font-bold text-amber-600">{entry.earned_points}</span>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
