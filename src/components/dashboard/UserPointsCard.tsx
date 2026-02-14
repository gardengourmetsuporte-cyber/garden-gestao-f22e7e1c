import { AppIcon } from '@/components/ui/app-icon';
import { Progress } from '@/components/ui/progress';
import { usePoints } from '@/hooks/usePoints';
import { useCountUp } from '@/hooks/useCountUp';
import { cn } from '@/lib/utils';

interface UserPointsCardProps {
  className?: string;
}

export function UserPointsCard({ className }: UserPointsCardProps) {
  const { earnedPoints, spentPoints, balance, isLoading } = usePoints();
  const animatedBalance = useCountUp(balance);
  const animatedEarned = useCountUp(earnedPoints);
  const animatedSpent = useCountUp(spentPoints);

  if (isLoading) {
    return (
      <div className={cn("card-command animate-pulse", className)}>
        <div className="p-5">
          <div className="h-20 bg-secondary rounded-xl" />
        </div>
      </div>
    );
  }

  const nextMilestone = Math.ceil((earnedPoints + 1) / 50) * 50;
  const progress = earnedPoints > 0 ? ((earnedPoints % 50) / 50) * 100 : 0;

  return (
    <div className={cn("card-command-warning overflow-hidden", className)}>
      {/* Main Balance Section */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-muted-foreground text-xs">Seu saldo atual</p>
            <div className="flex items-center gap-2 mt-1">
              <AppIcon name="Star" size={28} className="text-warning" />
              <span className="text-3xl font-bold tracking-tight text-foreground">{animatedBalance}</span>
              <span className="text-sm text-muted-foreground">pts</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-warning/10 flex items-center justify-center border border-warning/20">
            <AppIcon name="Gift" size={24} className="text-warning" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Próxima conquista</span>
            <span className="font-medium text-foreground">{earnedPoints}/{nextMilestone}</span>
          </div>
          <Progress 
            value={progress} 
            className="h-1.5 bg-secondary [&>div]:bg-warning"
          />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 divide-x divide-border/30 border-t border-border/30">
        <div className="p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-success mb-0.5">
            <AppIcon name="TrendingUp" size={14} />
            <span className="text-xl font-bold">{animatedEarned}</span>
          </div>
          <p className="text-[10px] text-muted-foreground">Pontos ganhos</p>
        </div>
        <div className="p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-primary mb-0.5">
            <AppIcon name="Gift" size={14} />
            <span className="text-xl font-bold">{animatedSpent}</span>
          </div>
          <p className="text-[10px] text-muted-foreground">Pontos usados</p>
        </div>
      </div>
    </div>
  );
}
