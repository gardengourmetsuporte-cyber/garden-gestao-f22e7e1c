import { lazy, Suspense } from 'react';
import { useTeamDashboard } from '@/hooks/useTeamDashboard';
import { AppIcon } from '@/components/ui/app-icon';
import { GenericWidgetSkeleton } from '@/components/ui/widget-skeleton';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { TeamMemberRow } from './TeamMemberRow';
import { TeamTrendChart } from './TeamTrendChart';
import { TeamPendingItems } from './TeamPendingItems';

const LazyLeaderboard = lazy(() => import('./LazyLeaderboardWidget'));

interface Props {
  currentUserId?: string;
}

const QUICK_ACCESS = [
  { icon: 'groups', label: 'Funcionários', path: '/employees', color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/25' },
  { icon: 'schedule', label: 'Ponto', path: '/employees?tab=ponto', color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/25' },
  { icon: 'event_busy', label: 'Folgas', path: '/employees?tab=folgas', color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/25' },
  { icon: 'local_shipping', label: 'Entregas', path: '/employees?tab=entregas', color: 'text-violet-400', bg: 'bg-violet-500/15', border: 'border-violet-500/25' },
  { icon: 'gavel', label: 'Advertências', path: '/employees?tab=advertencias', color: 'text-destructive', bg: 'bg-destructive/15', border: 'border-destructive/25' },
  { icon: 'timer', label: 'Banco Horas', path: '/employees?tab=banco-horas', color: 'text-cyan-400', bg: 'bg-cyan-500/15', border: 'border-cyan-500/25' },
] as const;

export function TeamDashboardView({ currentUserId }: Props) {
  const navigate = useNavigate();
  const {
    activeEmployees, completionsToday, totalAvailableToday,
    utilizationPct, pendingToday, memberStats, trend, pendingItems, isLoading,
  } = useTeamDashboard();

  if (isLoading) {
    return (
      <div className="mt-4 space-y-4">
        <GenericWidgetSkeleton />
        <GenericWidgetSkeleton />
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      {/* Quick Access Grid */}
      <div className="grid grid-cols-3 gap-2">
        {QUICK_ACCESS.map(item => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className={cn(
              'flex flex-col items-center gap-2 py-4 rounded-2xl border transition-all active:scale-95',
              'bg-card/60 hover:bg-card/90',
              item.border
            )}
          >
            <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', item.bg)}>
              <AppIcon name={item.icon} size={22} className={item.color} />
            </div>
            <span className="text-[11px] font-medium text-foreground">{item.label}</span>
          </button>
        ))}
      </div>

      {/* KPI Strip */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 snap-x snap-mandatory">
        {[
          { value: activeEmployees, label: 'Ativos', icon: 'groups', variant: 'bg-blue-500/15 text-blue-400' },
          { value: completionsToday, label: `Concluídos · de ${totalAvailableToday}`, icon: 'task_alt', variant: 'bg-emerald-500/15 text-emerald-400' },
          { value: `${utilizationPct}%`, label: 'Aproveitamento', icon: 'speed', variant: 'bg-primary/15 text-primary' },
        ].map(kpi => (
          <div
            key={kpi.label}
            className="flex items-center gap-2.5 shrink-0 snap-start rounded-xl px-3.5 py-2.5 bg-card/70 border border-border/30 min-w-[140px]"
          >
            <div className={cn('w-9 h-9 rounded-full flex items-center justify-center shrink-0', kpi.variant)}>
              <AppIcon name={kpi.icon} size={18} />
            </div>
            <div className="text-left min-w-0">
              <p className="text-lg font-extrabold font-display leading-tight" style={{ letterSpacing: '-0.02em' }}>
                {kpi.value}
              </p>
              <p className="text-[10px] text-muted-foreground truncate leading-tight">{kpi.label}</p>
            </div>
          </div>
        ))}
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
      </div>

      {/* Member Stats */}
      <div className="card-base p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center">
            <AppIcon name="bar_chart" size={14} className="text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground flex-1">Aproveitamento por membro</h3>
        </div>
        {memberStats.length === 0 ? (
          <div className="flex flex-col items-center py-6 gap-1.5">
            <div className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center">
              <AppIcon name="groups" size={20} className="text-muted-foreground/50" />
            </div>
            <p className="text-xs text-muted-foreground">Sem dados disponíveis</p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[320px] overflow-y-auto scrollbar-none">
            {memberStats.slice(0, 10).map(m => (
              <TeamMemberRow key={m.user_id} member={m} />
            ))}
          </div>
        )}
      </div>

      {/* Trend + Pending */}
      <TeamTrendChart trend={trend} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TeamPendingItems items={pendingItems} total={pendingToday} />
        <Suspense fallback={<GenericWidgetSkeleton />}>
          <LazyLeaderboard currentUserId={currentUserId} />
        </Suspense>
      </div>
    </div>
  );
}
