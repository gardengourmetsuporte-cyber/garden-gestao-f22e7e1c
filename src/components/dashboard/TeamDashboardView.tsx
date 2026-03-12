import { lazy, Suspense } from 'react';
import { useTeamDashboard } from '@/hooks/useTeamDashboard';
import { TeamUtilizationChart } from './TeamUtilizationChart';
import { TeamTrendChart } from './TeamTrendChart';
import { TeamPendingItems } from './TeamPendingItems';
import { AppIcon } from '@/components/ui/app-icon';
import { GenericWidgetSkeleton } from '@/components/ui/widget-skeleton';
import { Progress } from '@/components/ui/progress';

const LazyLeaderboard = lazy(() => import('./LazyLeaderboardWidget'));

interface Props {
  currentUserId?: string;
}

function KpiCard({ icon, label, value, sub }: { icon: string; label: string; value: string | number; sub?: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl border border-border/40 bg-card p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <AppIcon name={icon} size={14} />
        <span className="text-[10px] font-medium uppercase tracking-wide">{label}</span>
      </div>
      <span className="text-lg font-bold text-foreground">{value}</span>
      {sub && <span className="text-[10px] text-muted-foreground">{sub}</span>}
    </div>
  );
}

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

  return (
    <div className="mt-4 space-y-5">
      {/* KPI Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon="groups" label="Ativos" value={activeEmployees} />
        <KpiCard icon="task_alt" label="Concluídos" value={completionsToday} sub={`de ${totalAvailableToday}`} />
        <div className="flex flex-col gap-1 rounded-xl border border-border/40 bg-card p-3">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <AppIcon name="speed" size={14} />
            <span className="text-[10px] font-medium uppercase tracking-wide">Aproveitamento</span>
          </div>
          <span className="text-lg font-bold text-foreground">{utilizationPct}%</span>
          <Progress value={utilizationPct} className="h-1.5" />
        </div>
        <KpiCard icon="pending_actions" label="Pendências" value={pendingToday} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TeamUtilizationChart members={memberStats} />
        <TeamTrendChart trend={trend} />
      </div>

      {/* Pending + Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TeamPendingItems items={pendingItems} total={pendingToday} />
        <Suspense fallback={<GenericWidgetSkeleton />}>
          <LazyLeaderboard currentUserId={currentUserId} />
        </Suspense>
      </div>
    </div>
  );
}
