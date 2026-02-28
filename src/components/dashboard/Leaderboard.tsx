import { LeaderboardEntry } from '@/hooks/useLeaderboard';
import { cn } from '@/lib/utils';
import { RankedAvatar } from '@/components/profile/RankedAvatar';
import { getRank } from '@/lib/ranks';
import { Link } from 'react-router-dom';
import { AppIcon } from '@/components/ui/app-icon';
import { Podium } from '@/components/ranking/Podium';
import { format, addMonths, subMonths, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  isLoading?: boolean;
  maxEntries?: number;
  selectedMonth?: Date;
  onMonthChange?: (month: Date) => void;
  showPodium?: boolean;
  onRefresh?: () => Promise<void>;
  isSyncing?: boolean;
  showUnitBadge?: boolean;
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

export function Leaderboard({ entries, currentUserId, isLoading, maxEntries, selectedMonth, onMonthChange, showPodium = true, onRefresh, isSyncing, showUnitBadge = false }: LeaderboardProps) {
  const displayEntries = maxEntries ? entries.slice(0, maxEntries) : entries;
  const restEntries = showPodium ? displayEntries.slice(3) : displayEntries;

  if (isLoading) {
    return (
      <div className="card-surface p-4">
        <div className="flex items-center gap-2 mb-3">
          <AppIcon name="Trophy" size={16} style={{ color: 'hsl(var(--neon-amber))' }} />
          <h3 className="font-bold text-sm text-foreground font-display" style={{ letterSpacing: '-0.02em' }}>Ranking Mensal</h3>
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
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <AppIcon name="Trophy" size={16} style={{ color: 'hsl(var(--neon-amber))' }} />
          <h3 className="font-bold text-sm text-foreground font-display" style={{ letterSpacing: '-0.02em' }}>Ranking Mensal</h3>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isSyncing}
              className="p-1 rounded-md hover:bg-secondary transition-all active:scale-95 disabled:opacity-50"
            >
              <AppIcon name="RefreshCw" size={14} className={isSyncing ? 'animate-spin text-primary' : 'text-muted-foreground'} />
            </button>
          )}
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
        <>
          {showPodium && displayEntries.length >= 2 && (
            <Podium entries={displayEntries} currentUserId={currentUserId} />
          )}

          {restEntries.length > 0 && (
            <div className={cn("space-y-1.5", showPodium && "mt-3 pt-3 border-t border-border/30")}>
              {restEntries.map((entry, idx) => {
                const isCurrentUser = entry.user_id === currentUserId;
                const entryRank = getRank(entry.earned_all_time ?? entry.total_score);

                return (
                  <Link
                    to={`/profile/${entry.user_id}`}
                    key={entry.user_id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl transition-all duration-200 animate-slide-up",
                      "border border-emerald-500/10 bg-[#0a1a10]/60",
                      isCurrentUser && "ring-1 ring-emerald-500/30 bg-emerald-500/5",
                      `stagger-${Math.min(idx + 1, 8)}`
                    )}
                  >
                    <div className="w-6 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-muted-foreground">{entry.rank}</span>
                    </div>

                    <RankedAvatar avatarUrl={entry.avatar_url} earnedPoints={entry.earned_all_time ?? entry.total_score} size={32} userName={entry.full_name} userId={entry.user_id} />

                    <div className="flex-1 min-w-0">
                      <p className={cn("font-medium text-sm truncate", isCurrentUser && "text-emerald-400")}>
                        {entry.full_name}
                        {isCurrentUser && <span className="text-xs ml-1 text-muted-foreground">(você)</span>}
                      </p>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs" style={{ color: entryRank.color }}>{entryRank.title}</span>
                        {entry.bonus_points > 0 && (
                          <>
                            <span className="text-xs text-muted-foreground">·</span>
                            <span className="text-xs" style={{ color: 'hsl(var(--neon-amber))' }}>+{entry.bonus_points} bônus</span>
                          </>
                        )}
                        {showUnitBadge && entry.unit_name && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 ml-0.5">
                            {entry.unit_name}
                          </Badge>
                        )}
                      </div>
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
        </>
      )}
    </div>
  );
}
