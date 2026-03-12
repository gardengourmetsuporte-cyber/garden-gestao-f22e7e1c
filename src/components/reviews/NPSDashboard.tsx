import { useNPS } from '@/hooks/useNPS';
import { AppIcon } from '@/components/ui/app-icon';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export function NPSDashboard() {
  const { responses, npsScore, avgScore, isLoading } = useNPS();

  if (isLoading) return null;
  if (responses.length === 0) {
    return (
      <div className="text-center py-8">
        <AppIcon name="MessageSquare" size={36} className="mx-auto text-muted-foreground/40 mb-2" />
        <p className="text-sm text-muted-foreground">Nenhuma avaliação NPS recebida ainda</p>
      </div>
    );
  }

  const promoters = responses.filter(r => r.score >= 9).length;
  const neutrals = responses.filter(r => r.score >= 7 && r.score <= 8).length;
  const detractors = responses.filter(r => r.score <= 6).length;

  const npsColor = npsScore !== null
    ? npsScore >= 50 ? 'text-emerald-600 dark:text-emerald-400'
    : npsScore >= 0 ? 'text-amber-600 dark:text-amber-400'
    : 'text-red-600 dark:text-red-400'
    : '';

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground">NPS Score</p>
            <p className={cn("text-2xl font-bold", npsColor)}>{npsScore}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground">Média</p>
            <p className="text-2xl font-bold text-foreground">{avgScore}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground">Respostas</p>
            <p className="text-2xl font-bold text-foreground">{responses.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Distribution bar */}
      <div className="space-y-1">
        <div className="flex h-4 rounded-full overflow-hidden">
          {detractors > 0 && (
            <div className="bg-red-500" style={{ width: `${(detractors / responses.length) * 100}%` }} />
          )}
          {neutrals > 0 && (
            <div className="bg-amber-500" style={{ width: `${(neutrals / responses.length) * 100}%` }} />
          )}
          {promoters > 0 && (
            <div className="bg-emerald-500" style={{ width: `${(promoters / responses.length) * 100}%` }} />
          )}
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>😞 Detratores ({detractors})</span>
          <span>😐 Neutros ({neutrals})</span>
          <span>🤩 Promotores ({promoters})</span>
        </div>
      </div>

      {/* Recent responses */}
      <div className="space-y-1.5">
        <h4 className="text-xs font-semibold text-foreground">Últimas avaliações</h4>
        {responses.slice(0, 10).map(r => (
          <div key={r.id} className="flex items-start gap-3 p-2.5 rounded-xl bg-secondary/30">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
              r.score >= 9 ? "bg-emerald-500/15 text-emerald-600" :
              r.score >= 7 ? "bg-amber-500/15 text-amber-600" :
              "bg-red-500/15 text-red-600"
            )}>
              {r.score}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">{r.customer_name || 'Anônimo'}</span>
                <span className="text-[10px] text-muted-foreground">
                  {format(new Date(r.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                </span>
              </div>
              {r.comment && <p className="text-[11px] text-muted-foreground mt-0.5">{r.comment}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default NPSDashboard;
