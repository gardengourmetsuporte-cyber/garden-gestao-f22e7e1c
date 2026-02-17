import { Achievement, calculateAchievements, AchievementData } from '@/lib/achievements';
import { Progress } from '@/components/ui/progress';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';

interface ObjectivesListProps {
  data: AchievementData;
}

export function ObjectivesList({ data }: ObjectivesListProps) {
  const objectives = calculateAchievements(data);
  const unlocked = objectives.filter(o => o.unlocked).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AppIcon name="Target" size={16} className="text-primary" />
          <h3 className="font-semibold text-sm text-foreground">Objetivos</h3>
        </div>
        <span className="text-xs font-semibold text-muted-foreground">
          {unlocked}/{objectives.length}
        </span>
      </div>

      <div className="space-y-2">
        {objectives.map(obj => {
          const progress = obj.target > 0 ? Math.round((obj.current / obj.target) * 100) : 0;
          return (
            <div
              key={obj.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl transition-all",
                obj.unlocked
                  ? "bg-primary/5 border border-primary/20"
                  : "bg-secondary/30 border border-border/20"
              )}
            >
              <span className="text-lg shrink-0">{obj.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={cn(
                    "text-xs font-semibold truncate",
                    obj.unlocked ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {obj.title}
                  </p>
                  {obj.unlocked && (
                    <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ background: 'hsl(var(--neon-green) / 0.2)' }}>
                      <AppIcon name="Check" size={10} style={{ color: 'hsl(var(--neon-green))' }} />
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{obj.description}</p>
                {!obj.unlocked && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <Progress value={progress} className="h-1 flex-1" />
                    <span className="text-xs font-semibold text-muted-foreground shrink-0">
                      {obj.current}/{obj.target}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
