import { AppIcon } from '@/components/ui/app-icon';
import { Progress } from '@/components/ui/progress';
import { SectorPointsSummary as SectorData } from '@/hooks/useLeaderboard';

interface SectorPointsSummaryProps {
  sectors: SectorData[];
  isLoading?: boolean;
}

export function SectorPointsSummary({ sectors, isLoading }: SectorPointsSummaryProps) {
  if (isLoading) {
    return (
      <div className="card-base p-4">
        <div className="flex items-center gap-2 mb-4">
          <AppIcon name="Star" size={20} className="text-amber-500" fill={1} />
          <h3 className="font-semibold text-foreground">Pontos por Setor</h3>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-secondary rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const totalPoints = sectors.reduce((sum, s) => sum + s.points_earned, 0);

  return (
    <div className="card-base p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AppIcon name="Star" size={20} className="text-amber-500" fill={1} />
          <h3 className="font-semibold text-foreground">Pontos por Setor</h3>
        </div>
        <span className="text-sm text-muted-foreground">
          Total: <span className="font-bold text-foreground">{totalPoints}</span> pts
        </span>
      </div>
      <div className="space-y-4">
        {sectors.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            Nenhum setor configurado
          </div>
        ) : (
          sectors.map((sector) => {
            const percentage = totalPoints > 0 
              ? Math.round((sector.points_earned / totalPoints) * 100) 
              : 0;

            return (
              <div key={sector.sector_id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: sector.sector_color }}
                    />
                    <span className="font-medium text-sm">{sector.sector_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">{percentage}%</span>
                    <span className="font-bold">{sector.points_earned} pts</span>
                  </div>
                </div>
                <Progress 
                  value={percentage} 
                  className="h-2"
                  style={{ 
                    '--progress-color': sector.sector_color 
                  } as React.CSSProperties}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
