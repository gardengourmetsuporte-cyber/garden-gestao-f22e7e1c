import { cn } from '@/lib/utils';

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
  const displayHeight = refreshing ? 48 : pullDistance > 0 ? Math.min(pullDistance, 60) : 0;

  return (
    <div
      className="flex items-center justify-center overflow-hidden will-change-transform"
      style={{
        height: displayHeight,
        transition: refreshing || pullDistance <= 0 ? 'height 0.2s ease-out' : 'none',
      }}
    >
      {refreshing ? (
        <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
      ) : (
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center will-change-transform",
            ready ? "bg-primary/20" : "bg-muted/40"
          )}
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
            <path d="M12 5v14" />
            <path d="m19 12-7 7-7-7" />
          </svg>
        </div>
      )}
    </div>
  );
}
