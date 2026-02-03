import { Star, TrendingUp, Gift } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { usePoints } from '@/hooks/usePoints';
import { cn } from '@/lib/utils';

interface UserPointsCardProps {
  className?: string;
}

export function UserPointsCard({ className }: UserPointsCardProps) {
  const { earnedPoints, spentPoints, balance, isLoading } = usePoints();

  if (isLoading) {
    return (
      <div className={cn("card-base animate-pulse", className)}>
        <div className="p-6">
          <div className="h-24 bg-secondary rounded" />
        </div>
      </div>
    );
  }

  // Calculate progress towards next milestone (every 50 points)
  const nextMilestone = Math.ceil((earnedPoints + 1) / 50) * 50;
  const progress = earnedPoints > 0 ? ((earnedPoints % 50) / 50) * 100 : 0;

  return (
    <div className={cn("card-base overflow-hidden", className)}>
      {/* Main Balance Section */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-amber-100 text-sm">Seu saldo atual</p>
            <div className="flex items-center gap-2 mt-1">
              <Star className="w-8 h-8 fill-current" />
              <span className="text-4xl font-bold">{balance}</span>
              <span className="text-lg text-amber-100">pts</span>
            </div>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
            <Gift className="w-8 h-8" />
          </div>
        </div>

        {/* Progress to next milestone */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-amber-100">Próxima conquista</span>
            <span className="font-medium">{earnedPoints}/{nextMilestone}</span>
          </div>
          <Progress 
            value={progress} 
            className="h-2 bg-white/20 [&>div]:bg-white"
          />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 divide-x">
        <div className="p-4 text-center">
          <div className="flex items-center justify-center gap-1 text-success mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-2xl font-bold">{earnedPoints}</span>
          </div>
          <p className="text-xs text-muted-foreground">Pontos ganhos</p>
        </div>
        <div className="p-4 text-center">
          <div className="flex items-center justify-center gap-1 text-primary mb-1">
            <Gift className="w-4 h-4" />
            <span className="text-2xl font-bold">{spentPoints}</span>
          </div>
          <p className="text-xs text-muted-foreground">Pontos usados</p>
        </div>
      </div>
    </div>
  );
}
