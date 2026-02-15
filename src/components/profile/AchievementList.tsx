import { Achievement, RARITY_CONFIG, CATEGORY_LABELS, type AchievementCategory } from '@/lib/achievements';
import { cn } from '@/lib/utils';

interface AchievementListProps {
  achievements: Achievement[];
}

export function AchievementList({ achievements }: AchievementListProps) {
  const unlocked = achievements.filter(a => a.unlocked);
  const categories: AchievementCategory[] = ['tasks', 'points', 'redemptions'];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground px-1">
        Conquistas ({unlocked.length}/{achievements.length})
      </h3>
      {categories.map(cat => {
        const items = achievements.filter(a => a.category === cat);
        if (items.length === 0) return null;
        return (
          <div key={cat} className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground px-1">
              {CATEGORY_LABELS[cat]}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {items.map(a => {
                const rarity = RARITY_CONFIG[a.rarity];
                const progress = a.target > 0 ? (a.current / a.target) * 100 : 0;
                return (
                  <div
                    key={a.id}
                    className={cn(
                      "rounded-xl p-3 text-center transition-all relative overflow-hidden",
                      !a.unlocked && "opacity-50"
                    )}
                    style={{
                      background: rarity.gradient,
                      border: `1px solid ${a.unlocked ? rarity.border : 'hsl(215 20% 20%)'}`,
                      boxShadow: a.unlocked ? rarity.glow : 'none',
                    }}
                  >
                    {/* Shimmer for legendary unlocked */}
                    {a.unlocked && a.rarity === 'legendary' && (
                      <div className="absolute inset-0 achievement-shimmer pointer-events-none" />
                    )}
                    <span className={cn("text-2xl block", a.unlocked && "drop-shadow-lg")} style={a.unlocked ? { filter: `drop-shadow(0 0 6px ${rarity.border})` } : undefined}>
                      {a.icon}
                    </span>
                    <p className="text-xs font-semibold text-foreground mt-1">{a.title}</p>
                    <p className="text-[10px] text-muted-foreground">{a.description}</p>
                    {!a.unlocked && (
                      <div className="mt-2 w-full h-1 rounded-full overflow-hidden" style={{ background: 'hsl(215 20% 18%)' }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${progress}%`,
                            background: rarity.border,
                            opacity: 0.7,
                          }}
                        />
                      </div>
                    )}
                    {!a.unlocked && (
                      <p className="text-[9px] text-muted-foreground mt-0.5">
                        {a.current}/{a.target}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
