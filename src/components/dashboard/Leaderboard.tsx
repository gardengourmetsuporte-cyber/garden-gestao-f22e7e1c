import { Trophy, Medal, Star, ChevronLeft, ChevronRight, Award, Flame } from 'lucide-react';
import { LeaderboardEntry } from '@/hooks/useLeaderboard';
import { cn } from '@/lib/utils';
import { RankedAvatar } from '@/components/profile/RankedAvatar';
import { getRank } from '@/lib/ranks';
import { Link } from 'react-router-dom';
import { format, addMonths, subMonths, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  isLoading?: boolean;
  maxEntries?: number;
  selectedMonth?: Date;
  onMonthChange?: (month: Date) => void;
}

function MonthSelector({ month, onChange }: { month: Date; onChange: (m: Date) => void }) {
  const isCurrentMonth = isSameMonth(month, new Date());
  return (
    <div className="flex items-center gap-1.5">
      <button onClick={() => onChange(subMonths(month, 1))} className="p-1 rounded-lg hover:bg-secondary transition-colors">
        <ChevronLeft className="w-4 h-4 text-muted-foreground" />
      </button>
      <span className="text-[11px] font-semibold text-muted-foreground capitalize min-w-[80px] text-center">
        {format(month, 'MMM yyyy', { locale: ptBR })}
      </span>
      <button
        onClick={() => !isCurrentMonth && onChange(addMonths(month, 1))}
        disabled={isCurrentMonth}
        className="p-1 rounded-lg hover:bg-secondary transition-colors disabled:opacity-30"
      >
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>
  );
}

function PodiumItem({ entry, position, currentUserId }: { entry: LeaderboardEntry; position: 1 | 2 | 3; currentUserId?: string }) {
  const isCurrentUser = entry.user_id === currentUserId;

  const podiumConfig = {
    1: { size: 56, label: '🥇', height: 'h-16', glow: 'hsl(var(--neon-amber))', borderColor: 'hsl(var(--neon-amber) / 0.5)' },
    2: { size: 44, label: '🥈', height: 'h-12', glow: 'hsl(215 20% 60%)', borderColor: 'hsl(215 20% 60% / 0.4)' },
    3: { size: 44, label: '🥉', height: 'h-10', glow: 'hsl(30 60% 40%)', borderColor: 'hsl(30 60% 40% / 0.4)' },
  };
  const config = podiumConfig[position];

  return (
    <Link to={`/profile/${entry.user_id}`} className={cn(
      "flex flex-col items-center gap-1",
      position === 1 ? "order-2" : position === 2 ? "order-1" : "order-3"
    )}>
      <div className="relative">
        <RankedAvatar avatarUrl={entry.avatar_url} earnedPoints={entry.total_score} size={config.size} />
        <span className="absolute -bottom-1 -right-1 text-sm">{config.label}</span>
        {position === 1 && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2">
            <Award className="w-4 h-4" style={{ color: 'hsl(var(--neon-amber))' }} />
          </div>
        )}
      </div>
      <p className={cn(
        "text-[11px] font-semibold truncate max-w-[80px] text-center",
        isCurrentUser ? "text-primary" : "text-foreground"
      )}>
        {entry.full_name?.split(' ')[0]}
      </p>
      {position === 1 && (
        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{
          background: 'hsl(var(--neon-amber) / 0.15)',
          color: 'hsl(var(--neon-amber))',
        }}>
          ⭐ Func. do Mês
        </span>
      )}
      <div className="flex items-center gap-0.5">
        <Star className="w-3 h-3 fill-current" style={{ color: 'hsl(var(--neon-amber))' }} />
        <span className="text-[10px] font-bold" style={{ color: 'hsl(var(--neon-amber))' }}>{entry.total_score}</span>
      </div>
      {entry.bonus_points > 0 && (
        <div className="flex items-center gap-0.5">
          <Flame className="w-2.5 h-2.5" style={{ color: 'hsl(var(--neon-red))' }} />
          <span className="text-[9px] font-medium" style={{ color: 'hsl(var(--neon-red))' }}>+{entry.bonus_points}</span>
        </div>
      )}
      <div
        className={cn("w-16 rounded-t-lg", config.height)}
        style={{
          background: `linear-gradient(180deg, ${config.borderColor}, transparent)`,
          border: `1px solid ${config.borderColor}`,
          borderBottom: 'none',
        }}
      />
    </Link>
  );
}

export function Leaderboard({ entries, currentUserId, isLoading, maxEntries, selectedMonth, onMonthChange }: LeaderboardProps) {
  const displayEntries = maxEntries ? entries.slice(0, maxEntries) : entries;
  const top3 = displayEntries.slice(0, 3);
  const rest = displayEntries.slice(3);

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
          <h3 className="font-semibold text-sm text-foreground">Ranking Mensal</h3>
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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4" style={{ color: 'hsl(var(--neon-amber))' }} />
          <h3 className="font-semibold text-sm text-foreground">Ranking Mensal</h3>
        </div>
        {selectedMonth && onMonthChange && (
          <MonthSelector month={selectedMonth} onChange={onMonthChange} />
        )}
      </div>

      {displayEntries.length === 0 ? (
        <div className="empty-state py-6">
          <Trophy className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Nenhum ponto registrado neste mês</p>
        </div>
      ) : (
        <>
          {top3.length >= 2 && (
            <div className="flex items-end justify-center gap-3 mb-4 pt-2">
              {top3.map((entry, idx) => (
                <PodiumItem key={entry.user_id} entry={entry} position={(idx + 1) as 1 | 2 | 3} currentUserId={currentUserId} />
              ))}
            </div>
          )}

          {rest.length > 0 && (
            <div className="space-y-1.5">
              {rest.map((entry, idx) => {
                const isCurrentUser = entry.user_id === currentUserId;
                const entryRank = getRank(entry.total_score);
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
                    <RankedAvatar avatarUrl={entry.avatar_url} earnedPoints={entry.total_score} size={32} />
                    <div className="flex-1 min-w-0">
                      <p className={cn("font-medium text-xs truncate", isCurrentUser && "text-primary")}>
                        {entry.full_name}
                        {isCurrentUser && <span className="text-[10px] ml-1 text-muted-foreground">(você)</span>}
                      </p>
                      <p className="text-[10px] flex items-center gap-1.5">
                        <span style={{ color: entryRank.color }}>{entryRank.title}</span>
                        <span className="text-muted-foreground">•</span>
                        <span style={{ color: 'hsl(var(--neon-green))' }}>{entry.earned_points} base</span>
                        {entry.bonus_points > 0 && (
                          <>
                            <span className="text-muted-foreground">+</span>
                            <span style={{ color: 'hsl(var(--neon-amber))' }}>{entry.bonus_points} bônus</span>
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full shrink-0" style={{ background: 'hsl(var(--neon-amber) / 0.1)' }}>
                      <Star className="w-3 h-3 fill-current" style={{ color: 'hsl(var(--neon-amber))' }} />
                      <span className="font-bold text-xs" style={{ color: 'hsl(var(--neon-amber))' }}>{entry.total_score}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
