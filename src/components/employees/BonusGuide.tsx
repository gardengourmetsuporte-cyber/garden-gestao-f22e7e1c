import { HIGH_VALUE_BADGES } from '@/hooks/useBonusPoints';
import { useBonusPoints } from '@/hooks/useBonusPoints';
import { AppIcon } from '@/components/ui/app-icon';
import { Badge } from '@/components/ui/badge';

export function BonusGuide() {
  const { hasBadge } = useBonusPoints();

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'hsl(var(--neon-amber) / 0.15)' }}>
          <AppIcon name="Flame" size={16} style={{ color: 'hsl(var(--neon-amber))' }} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">Como Ganhar Bônus</h3>
          <p className="text-xs text-muted-foreground">Conquistas de alto valor</p>
        </div>
      </div>

      <div className="space-y-2">
        {HIGH_VALUE_BADGES.map(badge => {
          const alreadyEarned = hasBadge(badge.id);
          return (
            <div
              key={badge.id}
              className="card-surface p-3 flex items-center gap-3"
              style={alreadyEarned ? { borderColor: 'hsl(var(--neon-amber) / 0.3)' } : undefined}
            >
              <span className="text-xl shrink-0">{badge.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-foreground truncate">{badge.title}</p>
                  <Badge variant="outline" className="text-xs px-1.5 py-0 h-4 shrink-0" style={{ borderColor: 'hsl(var(--neon-amber) / 0.5)', color: 'hsl(var(--neon-amber))' }}>
                    +{badge.points} pts
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {badge.cooldown === 'weekly' ? '1x por semana' : '1x por mês'}
                </p>
              </div>
              {alreadyEarned ? (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ background: 'hsl(var(--neon-amber) / 0.1)', color: 'hsl(var(--neon-amber))' }}>
                  <AppIcon name="Check" size={12} className="inline mr-0.5" /> Conquistado
                </span>
              ) : (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ background: 'hsl(var(--neon-green) / 0.1)', color: 'hsl(var(--neon-green))' }}>
                  Disponível
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
