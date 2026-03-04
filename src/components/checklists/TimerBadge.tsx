import { useEffect, useState } from 'react';
import { ActiveTimer, formatDuration, ItemTimeStats } from '@/hooks/checklists/useChecklistTimer';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';

interface TimerBadgeProps {
  timer: ActiveTimer;
  stats?: ItemTimeStats | null;
  minExecutions?: number;
  className?: string;
}

export function TimerBadge({ timer, stats, minExecutions = 3, className }: TimerBadgeProps) {
  const [elapsed, setElapsed] = useState(timer.elapsedSeconds);

  useEffect(() => {
    const iv = setInterval(() => {
      setElapsed(Math.floor((Date.now() - timer.startedAt.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(iv);
  }, [timer.startedAt]);

  const hasStats = stats && stats.executionCount >= minExecutions;
  const isAboveAvg = hasStats && elapsed > stats.avgSeconds;
  const isNearRecord = hasStats && elapsed <= stats.recordSeconds;

  return (
    <div className={cn(
      "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border animate-pulse",
      isNearRecord
        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
        : isAboveAvg
          ? "bg-destructive/10 text-destructive border-destructive/30"
          : "bg-primary/10 text-primary border-primary/30",
      className
    )}>
      <AppIcon name="Timer" className="w-3.5 h-3.5" />
      <span className="tabular-nums">{formatDuration(elapsed)}</span>
      {hasStats && (
        <span className="text-[10px] font-normal opacity-70">
          / {formatDuration(Math.round(stats.avgSeconds))}
        </span>
      )}
    </div>
  );
}

interface TimerStatsIndicatorProps {
  stats: ItemTimeStats;
  minExecutions?: number;
}

export function TimerStatsIndicator({ stats, minExecutions = 3 }: TimerStatsIndicatorProps) {
  if (stats.executionCount < minExecutions) {
    return (
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <AppIcon name="BarChart3" className="w-3 h-3" />
        <span>{stats.executionCount}/{minExecutions} execuções</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
      <span className="flex items-center gap-0.5">
        <AppIcon name="Timer" className="w-3 h-3" />
        Média: {formatDuration(Math.round(stats.avgSeconds))}
      </span>
      <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400">
        <AppIcon name="Trophy" className="w-3 h-3" />
        Recorde: {formatDuration(stats.recordSeconds)}
      </span>
    </div>
  );
}
