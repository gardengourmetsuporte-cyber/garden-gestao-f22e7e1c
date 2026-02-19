import { AppIcon } from '@/components/ui/app-icon';
import { usePoints } from '@/hooks/usePoints';
import { useCountUp } from '@/hooks/useCountUp';
import { cn } from '@/lib/utils';

interface PointsDisplayProps {
  className?: string;
  showLabel?: boolean;
  isPulsing?: boolean;
}

export function PointsDisplay({ className, showLabel = true, isPulsing = false }: PointsDisplayProps) {
  const { monthlyScore, isLoading } = usePoints();
  const animatedBalance = useCountUp(monthlyScore);

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="w-5 h-5 rounded-full bg-muted animate-pulse" />
        <div className="w-12 h-4 rounded bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div id="points-counter" className={cn("flex items-center gap-2", className)}>
      <div className={cn(
        "flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20",
        isPulsing && "animate-coin-pulse"
      )}>
        <AppIcon name="Star" size={16} style={{ color: 'hsl(38 92% 50%)' }} />
      </div>
      <div className="flex flex-col">
        <span className={cn("font-bold text-foreground", isPulsing && "animate-coin-pulse")}>{animatedBalance}</span>
        {showLabel && (
          <span className="text-xs text-muted-foreground">pontos</span>
        )}
      </div>
    </div>
  );
}
