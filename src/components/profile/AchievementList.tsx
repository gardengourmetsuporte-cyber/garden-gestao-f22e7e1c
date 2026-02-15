import { Achievement, RARITY_CONFIG, CATEGORY_LABELS, type AchievementCategory } from '@/lib/achievements';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface AchievementListProps {
  achievements: Achievement[];
}

export function AchievementList({ achievements }: AchievementListProps) {
  const unlocked = achievements.filter(a => a.unlocked);
  const categories: AchievementCategory[] = ['tasks', 'points', 'redemptions'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-foreground">Conquistas</h3>
        <span className="text-xs text-muted-foreground">{unlocked.length}/{achievements.length} desbloqueadas</span>
      </div>
      {categories.map(cat => {
        const items = achievements.filter(a => a.category === cat);
        if (items.length === 0) return null;
        // unlocked first, then locked
        const sorted = [...items].sort((a, b) => (b.unlocked ? 1 : 0) - (a.unlocked ? 1 : 0));
        return (
          <div key={cat} className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground px-1">
              {CATEGORY_LABELS[cat]}
            </p>
            <div className="space-y-1.5">
              {sorted.map(a => {
                const rarity = RARITY_CONFIG[a.rarity];
                const progress = a.target > 0 ? (a.current / a.target) * 100 : 0;
                return (
                  <div
                    key={a.id}
                    className={cn(
                      "rounded-xl p-3 flex items-center gap-3 transition-all relative overflow-hidden",
                      !a.unlocked && "opacity-50"
                    )}
                    style={{
                      background: rarity.gradient,
                      border: `1px solid ${a.unlocked ? rarity.border : 'hsl(215 20% 20%)'}`,
                      boxShadow: a.unlocked ? rarity.glow : 'none',
                    }}
                  >
                    {a.unlocked && a.rarity === 'legendary' && (
                      <div className="absolute inset-0 achievement-shimmer pointer-events-none" />
                    )}
                    <span className={cn("text-2xl shrink-0", a.unlocked && "drop-shadow-lg")} style={a.unlocked ? { filter: `drop-shadow(0 0 6px ${rarity.border})` } : undefined}>
                      {a.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-foreground truncate">{a.title}</p>
                        <Badge variant="outline" className="text-[8px] px-1.5 py-0 h-4 shrink-0" style={{ borderColor: rarity.border, color: rarity.border }}>
                          {rarity.label}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{a.description}</p>
                      {!a.unlocked && (
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'hsl(215 20% 18%)' }}>
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${progress}%`, background: rarity.border, opacity: 0.7 }}
                            />
                          </div>
                          <span className="text-[9px] text-muted-foreground shrink-0">{a.current}/{a.target}</span>
                        </div>
                      )}
                    </div>
                    {a.unlocked && (
                      <span className="text-[10px] shrink-0" style={{ color: rarity.border }}>✓</span>
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
