import { lazy, Suspense, useMemo } from 'react';
import { useTeamDashboard } from '@/hooks/useTeamDashboard';
import { AppIcon } from '@/components/ui/app-icon';
import { GenericWidgetSkeleton } from '@/components/ui/widget-skeleton';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { TeamMemberRow } from './TeamMemberRow';
import { TeamTrendChart } from './TeamTrendChart';
import { TeamPendingItems } from './TeamPendingItems';

const LazyLeaderboard = lazy(() => import('./LazyLeaderboardWidget'));

interface Props {
  currentUserId?: string;
}

type TeamPulse = 'excellent' | 'good' | 'attention' | 'critical';

const PULSE_CONFIG: Record<TeamPulse, { label: string; icon: string; color: string; bg: string; dot: string; ring: string }> = {
  excellent: { label: 'Excelente', icon: 'rocket_launch', color: 'text-emerald-400', bg: 'bg-emerald-500/10', dot: 'bg-emerald-400', ring: 'ring-emerald-500/30' },
  good: { label: 'Bom', icon: 'thumb_up', color: 'text-blue-400', bg: 'bg-blue-500/10', dot: 'bg-blue-400', ring: 'ring-blue-500/30' },
  attention: { label: 'Atenção', icon: 'warning', color: 'text-amber-400', bg: 'bg-amber-500/10', dot: 'bg-amber-400', ring: 'ring-amber-500/30' },
  critical: { label: 'Crítico', icon: 'error', color: 'text-destructive', bg: 'bg-destructive/10', dot: 'bg-destructive', ring: 'ring-destructive/30' },
};

function getPulse(utilization: number, pendingRatio: number): TeamPulse {
  if (utilization >= 80) return 'excellent';
  if (utilization >= 60) return 'good';
  if (utilization >= 35) return 'attention';
  return 'critical';
}

export function TeamDashboardView({ currentUserId }: Props) {
  const {
    activeEmployees, completionsToday, totalAvailableToday,
    utilizationPct, pendingToday, memberStats, trend, pendingItems, isLoading,
  } = useTeamDashboard();

  const pulse = useMemo(() => {
    const pendingRatio = totalAvailableToday > 0 ? pendingToday / totalAvailableToday : 0;
    return getPulse(utilizationPct, pendingRatio);
  }, [utilizationPct, pendingToday, totalAvailableToday]);

  const pulseCfg = PULSE_CONFIG[pulse];

  const topPerformers = useMemo(() => memberStats.filter(m => m.utilizationPct >= 80), [memberStats]);
  const needsAttention = useMemo(() => memberStats.filter(m => m.utilizationPct < 30 && m.utilizationPct >= 0), [memberStats]);

  const summary = useMemo(() => {
    if (utilizationPct >= 80) return `Equipe está performando bem — ${completionsToday} tarefas concluídas`;
    if (utilizationPct >= 60) return `Bom ritmo — ${pendingToday} tarefa${pendingToday !== 1 ? 's' : ''} pendente${pendingToday !== 1 ? 's' : ''}`;
    if (utilizationPct >= 35) return `${pendingToday} tarefas pendentes — equipe precisa acelerar`;
    return `Atenção: apenas ${utilizationPct}% do checklist concluído`;
  }, [utilizationPct, completionsToday, pendingToday]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <GenericWidgetSkeleton />
        <GenericWidgetSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Operation Pulse Hero */}
      <div className={cn('card-base p-4 border ring-1 animate-slide-up', pulseCfg.ring)}>
        <div className="flex items-center gap-2 mb-4">
          <div className={cn('w-2.5 h-2.5 rounded-full animate-pulse', pulseCfg.dot)} />
          <p className={cn('text-xs font-semibold', pulseCfg.color)}>{summary}</p>
        </div>

        {/* Status indicators */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { value: activeEmployees, label: 'Ativos', icon: 'groups', color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { value: completionsToday, label: 'Concluídos', icon: 'task_alt', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { value: pendingToday, label: 'Pendentes', icon: 'pending_actions', color: pendingToday > 10 ? 'text-destructive' : 'text-amber-400', bg: pendingToday > 10 ? 'bg-destructive/10' : 'bg-amber-500/10' },
            { value: `${utilizationPct}%`, label: 'Eficiência', icon: 'speed', color: pulseCfg.color, bg: pulseCfg.bg },
          ].map(stat => (
            <div key={stat.label} className={cn('flex flex-col items-center gap-1.5 py-3 rounded-xl', stat.bg)}>
              <div className="w-7 h-7 flex items-center justify-center shrink-0 overflow-hidden">
                <AppIcon name={stat.icon} size={16} className={stat.color} />
              </div>
              <span className="text-lg font-extrabold font-display leading-tight tabular-nums">{stat.value}</span>
              <span className="text-[9px] text-muted-foreground font-medium">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Utilization Progress */}
      <div className="card-base p-4">
        <div className="flex items-center gap-2 mb-2.5">
          <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center">
            <AppIcon name="speed" size={14} className="text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground flex-1">Aproveitamento Geral</h3>
          <span className={cn(
            'text-sm font-bold tabular-nums',
            utilizationPct >= 80 ? 'text-emerald-400' :
            utilizationPct >= 50 ? 'text-amber-400' :
            'text-destructive'
          )}>
            {utilizationPct}%
          </span>
        </div>
        <Progress value={utilizationPct} className="h-2.5" />
        <div className="flex justify-between mt-2">
          <span className="text-[10px] text-muted-foreground">{completionsToday} de {totalAvailableToday} tarefas</span>
          <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', pulseCfg.bg, pulseCfg.color)}>
            {pulseCfg.label}
          </span>
        </div>
      </div>

      {/* Top performers & needs attention */}
      {(topPerformers.length > 0 || needsAttention.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Top performers */}
          {topPerformers.length > 0 && (
            <div className="card-base p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <AppIcon name="emoji_events" size={14} className="text-amber-400" />
                <span className="text-[11px] font-bold text-foreground">Destaques</span>
                <span className="text-[10px] text-muted-foreground ml-auto tabular-nums">{topPerformers.length}</span>
              </div>
              <div className="space-y-1">
                {topPerformers.slice(0, 3).map(m => (
                  <TeamMemberRow key={m.user_id} member={m} compact />
                ))}
              </div>
            </div>
          )}

          {/* Needs attention */}
          {needsAttention.length > 0 && (
            <div className="card-base p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <AppIcon name="warning" size={14} className="text-amber-400" />
                <span className="text-[11px] font-bold text-foreground">Precisam melhorar</span>
                <span className="text-[10px] text-muted-foreground ml-auto tabular-nums">{needsAttention.length}</span>
              </div>
              <div className="space-y-1">
                {needsAttention.slice(0, 3).map(m => (
                  <TeamMemberRow key={m.user_id} member={m} compact />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* All members */}
      <div className="card-base p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center">
            <AppIcon name="bar_chart" size={14} className="text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground flex-1">Equipe Completa</h3>
          <span className="text-[10px] text-muted-foreground tabular-nums">{memberStats.length} membros</span>
        </div>
        {memberStats.length === 0 ? (
          <div className="flex flex-col items-center py-6 gap-1.5">
            <div className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center">
              <AppIcon name="groups" size={20} className="text-muted-foreground/50" />
            </div>
            <p className="text-xs text-muted-foreground">Sem dados disponíveis</p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[280px] overflow-y-auto scrollbar-none">
            {memberStats.map(m => (
              <TeamMemberRow key={m.user_id} member={m} />
            ))}
          </div>
        )}
      </div>

      {/* Trend */}
      <TeamTrendChart trend={trend} />

      {/* Pending + Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TeamPendingItems items={pendingItems} total={pendingToday} />
        <Suspense fallback={<GenericWidgetSkeleton />}>
          <LazyLeaderboard currentUserId={currentUserId} />
        </Suspense>
      </div>
    </div>
  );
}
