import { LeaderboardEntry } from '@/hooks/useLeaderboard';
import { cn } from '@/lib/utils';
import { RankedAvatar } from '@/components/profile/RankedAvatar';
import { getRank } from '@/lib/ranks';
import { Link } from 'react-router-dom';
import { AppIcon } from '@/components/ui/app-icon';
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
        <AppIcon name="ChevronLeft" size={16} className="text-muted-foreground" />
      </button>
      <span className="text-xs font-semibold text-muted-foreground capitalize min-w-[80px] text-center">
        {format(month, 'MMM yyyy', { locale: ptBR })}
      </span>
      <button
        onClick={() => !isCurrentMonth && onChange(addMonths(month, 1))}
        disabled={isCurrentMonth}
        className="p-1 rounded-lg hover:bg-secondary transition-colors disabled:opacity-30"
      >
        <AppIcon name="ChevronRight" size={16} className="text-muted-foreground" />
      </button>
    </div>
  );
}

export function Leaderboard({ entries, currentUserId, isLoading, maxEntries, selectedMonth, onMonthChange }: LeaderboardProps) {
  const displayEntries = maxEntries ? entries.slice(0, maxEntries) : entries;

  if (isLoading) {
    return (
      <div className="card-surface p-4">
        <div className="flex items-center gap-2 mb-3">
          <AppIcon name="Trophy" size={16} style={{ color: 'hsl(var(--neon-amber))' }} />
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
    <div className="card-surface p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AppIcon name="Trophy" size={16} style={{ color: 'hsl(var(--neon-amber))' }} />
          <h3 className="font-semibold text-sm text-foreground">Ranking Mensal</h3>
        </div>
        {selectedMonth && onMonthChange && (
          <MonthSelector month={selectedMonth} onChange={onMonthChange} />
        )}
      </div>

      {displayEntries.length === 0 ? (
        <div className="empty-state py-6">
          <AppIcon name="Trophy" size={40} className="mx-auto mb-2 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Nenhum ponto registrado neste mês</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {displayEntries.map((entry, idx) => {
            const isCurrentUser = entry.user_id === currentUserId;
            const entryRank = getRank(entry.total_score);
            const isTop3 = entry.rank <= 3;

            const getRankLabel = (rank: number) => {
              if (rank === 1) return { icon: 'Trophy', color: 'hsl(var(--neon-amber))' };
              if (rank === 2) return { icon: 'Medal', color: 'hsl(215 20% 60%)' };
              if (rank === 3) return { icon: 'Medal', color: 'hsl(30 60% 40%)' };
              return null;
            };

            const rankLabel = getRankLabel(entry.rank);

            return (
              <Link
                to={`/profile/${entry.user_id}`}
                key={entry.user_id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl transition-all duration-200 animate-slide-up",
                  isTop3 ? "bg-card border border-border/40" : "bg-secondary/30",
                  isCurrentUser && "ring-1 ring-primary/30",
                  entry.rank === 1 && "border-l-2",
                  `stagger-${Math.min(idx + 1, 8)}`
                )}
                style={entry.rank === 1 ? { borderLeftColor: 'hsl(var(--neon-amber))' } : undefined}
              >
                {/* Rank number/icon */}
                <div className="w-6 flex items-center justify-center shrink-0">
                  {rankLabel ? (
                    <AppIcon name={rankLabel.icon} size={16} style={{ color: rankLabel.color }} />
                  ) : (
                    <span className="text-xs font-bold text-muted-foreground">{entry.rank}</span>
                  )}
                </div>

                <RankedAvatar avatarUrl={entry.avatar_url} earnedPoints={entry.total_score} size={32} />

                <div className="flex-1 min-w-0">
                  <p className={cn("font-medium text-sm truncate", isCurrentUser && "text-primary")}>
                    {entry.full_name}
                    {isCurrentUser && <span className="text-xs ml-1 text-muted-foreground">(você)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <span style={{ color: entryRank.color }}>{entryRank.title}</span>
                    {entry.bonus_points > 0 && (
                      <>
                        <span>·</span>
                        <span style={{ color: 'hsl(var(--neon-amber))' }}>+{entry.bonus_points} bônus</span>
                      </>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full shrink-0" style={{ background: 'hsl(var(--neon-amber) / 0.1)' }}>
                  <AppIcon name="Star" size={12} style={{ color: 'hsl(var(--neon-amber))' }} />
                  <span className="font-bold text-xs" style={{ color: 'hsl(var(--neon-amber))' }}>{entry.total_score}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
