import { Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { SectorPointsSummary as SectorData } from '@/hooks/useLeaderboard';

interface SectorPointsSummaryProps {
  sectors: SectorData[];
  isLoading?: boolean;
}

export function SectorPointsSummary({ sectors, isLoading }: SectorPointsSummaryProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pontos por Setor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-secondary rounded animate-pulse" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const totalPoints = sectors.reduce((sum, s) => sum + s.points_earned, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            Pontos por Setor
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            Total: <span className="font-bold text-foreground">{totalPoints}</span> pts
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
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
      </CardContent>
    </Card>
  );
}
