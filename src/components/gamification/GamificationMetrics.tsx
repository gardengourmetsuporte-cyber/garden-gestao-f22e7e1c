import { Card } from '@/components/ui/card';
import { AppIcon } from '@/components/ui/app-icon';

interface GamificationMetricsProps {
  playsToday: number;
  prizesToday: number;
  costToday: number;
  maxDailyCost: number;
}

export function GamificationMetrics({ playsToday, prizesToday, costToday, maxDailyCost }: GamificationMetricsProps) {
  const costPct = maxDailyCost > 0 ? Math.min((costToday / maxDailyCost) * 100, 100) : 0;

  return (
    <div className="grid grid-cols-3 gap-3">
      <Card className="p-3 text-center">
        <AppIcon name="Dices" size={20} className="mx-auto text-primary mb-1" />
        <p className="text-2xl font-bold text-foreground">{playsToday}</p>
        <p className="text-xs text-muted-foreground">Jogadas hoje</p>
      </Card>

      <Card className="p-3 text-center">
        <AppIcon name="Gift" size={20} className="mx-auto text-success mb-1" />
        <p className="text-2xl font-bold text-foreground">{prizesToday}</p>
        <p className="text-xs text-muted-foreground">Prêmios dados</p>
      </Card>

      <Card className="p-3 text-center">
        <AppIcon name="DollarSign" size={20} className="mx-auto text-warning mb-1" />
        <p className="text-2xl font-bold text-foreground">
          R$ {costToday.toFixed(0)}
        </p>
        <p className="text-xs text-muted-foreground">
          de R$ {maxDailyCost.toFixed(0)}
        </p>
        <div className="w-full h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${costPct}%`,
              background: costPct > 80
                ? 'hsl(var(--destructive))'
                : costPct > 50
                  ? 'hsl(var(--warning))'
                  : 'hsl(var(--success))',
            }}
          />
        </div>
      </Card>
    </div>
  );
}
