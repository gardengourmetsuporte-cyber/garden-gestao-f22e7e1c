import { Achievement } from '@/lib/achievements';
import { cn } from '@/lib/utils';

interface AchievementListProps {
  achievements: Achievement[];
}

export function AchievementList({ achievements }: AchievementListProps) {
  const unlocked = achievements.filter(a => a.unlocked);
  const locked = achievements.filter(a => !a.unlocked);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground px-1">
        Conquistas ({unlocked.length}/{achievements.length})
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {[...unlocked, ...locked].map(a => (
          <div
            key={a.id}
            className={cn(
              "rounded-xl p-3 text-center transition-all",
              a.unlocked
                ? "bg-card border border-primary/20"
                : "bg-secondary/30 border border-border/20 opacity-50"
            )}
            style={a.unlocked ? { boxShadow: '0 0 8px hsl(var(--primary) / 0.1)' } : undefined}
          >
            <span className="text-2xl">{a.icon}</span>
            <p className="text-xs font-semibold text-foreground mt-1">{a.title}</p>
            <p className="text-[10px] text-muted-foreground">{a.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
