import { lazy, Suspense } from 'react';
import { useTeamDashboard } from '@/hooks/useTeamDashboard';
import { TeamUtilizationChart } from './TeamUtilizationChart';
import { TeamTrendChart } from './TeamTrendChart';
import { TeamPendingItems } from './TeamPendingItems';
import { AppIcon } from '@/components/ui/app-icon';
import { GenericWidgetSkeleton } from '@/components/ui/widget-skeleton';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const LazyLeaderboard = lazy(() => import('./LazyLeaderboardWidget'));

interface Props {
  currentUserId?: string;
}

const KPI_CONFIG = [
  { key: 'active', icon: 'groups', label: 'Ativos', variant: 'bg-blue-500/15 text-blue-400' },
  { key: 'completed', icon: 'task_alt', label: 'Concluídos', variant: 'bg-emerald-500/15 text-emerald-400' },
  { key: 'utilization', icon: 'speed', label: 'Aproveitamento', variant: 'bg-primary/15 text-primary' },
  { key: 'pending', icon: 'pending_actions', label: 'Pendências', variant: 'bg-destructive/15 text-destructive' },
] as const;

export function TeamDashboardView({ currentUserId }: Props) {
  const {
    activeEmployees, completionsToday, totalAvailableToday,
    utilizationPct, pendingToday, memberStats, trend, pendingItems, isLoading,
  } = useTeamDashboard();

  if (isLoading) {
    return (
      <div className="mt-4 space-y-4">
        <GenericWidgetSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <GenericWidgetSkeleton />
          <GenericWidgetSkeleton />
        </div>
      </div>
    );
  }

  const kpiValues: Record<string, { value: string | number; sub?: string }> = {
    active: { value: activeEmployees },
    completed: { value: completionsToday, sub: `de ${totalAvailableToday}` },
    utilization: { value: `${utilizationPct}%` },
    pending: { value: pendingToday },
  };

  return (
    <div className="mt-4 space-y-5">
      {/* KPI Strip */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 lg:-mx-8 lg:px-8 snap-x snap-mandatory">
        {KPI_CONFIG.map(kpi => {
          const data = kpiValues[kpi.key];
          return (
            <div
              key={kpi.key}
              className="flex items-center gap-2.5 shrink-0 snap-start rounded-xl px-3.5 py-2.5 bg-card/70 border border-border/30 min-w-[120px]"
            >
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", kpi.variant)}>
                <AppIcon name={kpi.icon} size={16} />
              </div>
              <div className="text-left min-w-0">
                <p className="text-lg font-extrabold font-display leading-tight" style={{ letterSpacing: '-0.02em' }}>
                  {data.value}
                </p>
                <p className="text-[10px] text-muted-foreground truncate leading-tight">
                  {data.sub ? `${kpi.label} · ${data.sub}` : kpi.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Utilization progress bar */}
      <div className="card-base p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center">
            <AppIcon name="speed" size={14} className="text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground flex-1">Aproveitamento Geral</h3>
          <span className="text-sm font-bold text-primary tabular-nums">{utilizationPct}%</span>
        </div>
        <Progress value={utilizationPct} className="h-2" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TeamUtilizationChart members={memberStats} />
        <TeamTrendChart trend={trend} />
      </div>

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
