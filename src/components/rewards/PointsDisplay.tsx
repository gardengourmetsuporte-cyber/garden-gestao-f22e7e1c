import { Star } from 'lucide-react';
import { usePoints } from '@/hooks/usePoints';
import { cn } from '@/lib/utils';

interface PointsDisplayProps {
  className?: string;
  showLabel?: boolean;
  isPulsing?: boolean;
}

export function PointsDisplay({ className, showLabel = true, isPulsing = false }: PointsDisplayProps) {
  const { balance, isLoading } = usePoints();

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
        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
      </div>
      <div className="flex flex-col">
        <span className={cn("font-bold text-foreground", isPulsing && "animate-coin-pulse")}>{balance}</span>
        {showLabel && (
          <span className="text-xs text-muted-foreground">pontos</span>
        )}
      </div>
    </div>
  );
}
