import { cn } from '@/lib/utils';
import { AppIcon } from '@/components/ui/app-icon';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  refreshing: boolean;
  threshold: number;
}

export function PullToRefreshIndicator({ pullDistance, refreshing, threshold }: PullToRefreshIndicatorProps) {
  if (pullDistance <= 0 && !refreshing) return null;

  const progress = Math.min(pullDistance / threshold, 1);
  const rotation = progress * 180;
  const ready = pullDistance >= threshold;

  return (
    <div
      className="flex items-center justify-center overflow-hidden transition-[height] duration-200"
      style={{ height: refreshing ? 48 : pullDistance > 0 ? Math.min(pullDistance, 60) : 0 }}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center transition-all",
          ready ? "bg-primary/20" : "bg-muted/40",
          refreshing && "animate-spin"
        )}
      >
        <AppIcon
          name={refreshing ? "Loader2" : "ArrowDown"}
          size={18}
          className={cn("text-primary transition-transform", !refreshing && "duration-100")}
          style={{ transform: refreshing ? undefined : `rotate(${rotation}deg)` }}
        />
      </div>
    </div>
  );
}
