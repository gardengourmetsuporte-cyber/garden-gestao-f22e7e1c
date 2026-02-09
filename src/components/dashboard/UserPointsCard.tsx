import { Star, TrendingUp, Gift } from 'lucide-react';
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
      <div className={cn("card-base animate-pulse", className)}>
        <div className="p-5">
          <div className="h-20 bg-secondary rounded-xl" />
        </div>
      </div>
    );
  }

  const nextMilestone = Math.ceil((earnedPoints + 1) / 50) * 50;
  const progress = earnedPoints > 0 ? ((earnedPoints % 50) / 50) * 100 : 0;

  return (
    <div className={cn("card-base overflow-hidden", className)}>
      {/* Main Balance Section */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-5 text-white">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-amber-100 text-xs">Seu saldo atual</p>
            <div className="flex items-center gap-2 mt-1">
              <Star className="w-7 h-7 fill-current" />
              <span className="text-3xl font-bold tracking-tight">{animatedBalance}</span>
              <span className="text-sm text-amber-100">pts</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
            <Gift className="w-6 h-6" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-amber-100">Próxima conquista</span>
            <span className="font-medium">{earnedPoints}/{nextMilestone}</span>
          </div>
          <Progress 
            value={progress} 
            className="h-1.5 bg-white/20 [&>div]:bg-white"
          />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 divide-x">
        <div className="p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-success mb-0.5">
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="text-xl font-bold">{animatedEarned}</span>
          </div>
          <p className="text-[10px] text-muted-foreground">Pontos ganhos</p>
        </div>
        <div className="p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-primary mb-0.5">
            <Gift className="w-3.5 h-3.5" />
            <span className="text-xl font-bold">{animatedSpent}</span>
          </div>
          <p className="text-[10px] text-muted-foreground">Pontos usados</p>
        </div>
      </div>
    </div>
  );
}
