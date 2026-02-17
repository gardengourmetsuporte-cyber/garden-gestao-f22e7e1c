import { AppIcon } from '@/components/ui/app-icon';
import { Progress } from '@/components/ui/progress';
import { usePoints } from '@/hooks/usePoints';
import { useCountUp } from '@/hooks/useCountUp';
import { cn } from '@/lib/utils';

interface UserPointsCardProps {
  className?: string;
}

export function UserPointsCard({ className }: UserPointsCardProps) {
  const { monthlyScore, monthlyBase, monthlyBonus, earned, balance, isLoading } = usePoints();
  const animatedScore = useCountUp(monthlyScore);
  const animatedBase = useCountUp(monthlyBase);
  const animatedBonus = useCountUp(monthlyBonus);
  const animatedAccum = useCountUp(earned);

  if (isLoading) {
    return (
      <div className={cn("card-surface animate-pulse", className)}>
        <div className="p-5">
          <div className="h-20 bg-secondary rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("card-surface overflow-hidden", className)} style={{ borderColor: 'hsl(var(--neon-amber) / 0.2)' }}>
      {/* Monthly Score - Primary */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-1">
          <p className="text-muted-foreground text-xs">Score Mensal</p>
          <div className="w-10 h-10 rounded-2xl bg-warning/10 flex items-center justify-center border border-warning/20">
            <AppIcon name="Trophy" size={20} className="text-warning" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AppIcon name="Flame" size={28} className="text-warning" />
          <span className="text-3xl font-bold tracking-tight text-foreground">{animatedScore}</span>
          <span className="text-sm text-muted-foreground">pts</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 divide-x divide-border/30 border-t border-border/30">
        <div className="p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5" style={{ color: 'hsl(var(--neon-green))' }}>
            <AppIcon name="TrendingUp" size={14} />
            <span className="text-xl font-bold">{animatedBase}</span>
          </div>
          <p className="text-xs text-muted-foreground">Base</p>
        </div>
        <div className="p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5" style={{ color: 'hsl(var(--neon-amber))' }}>
            <AppIcon name="Flame" size={14} />
            <span className="text-xl font-bold">{animatedBonus}</span>
          </div>
          <p className="text-xs text-muted-foreground">Bônus</p>
        </div>
        <div className="p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
            <AppIcon name="Star" size={14} />
            <span className="text-xl font-bold text-foreground">{animatedAccum}</span>
          </div>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
      </div>
    </div>
  );
}
