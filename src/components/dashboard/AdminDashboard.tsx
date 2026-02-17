import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppIcon } from '@/components/ui/app-icon';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useCountUpCurrency } from '@/hooks/useCountUp';
import { Skeleton } from '@/components/ui/skeleton';
import { RankedAvatar } from '@/components/profile/RankedAvatar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AICopilotWidget } from './AICopilotWidget';
import { AgendaDashboardWidget } from './AgendaDashboardWidget';
import { SectionHeader } from '@/components/ui/section-header';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { leaderboard, isLoading: leaderboardLoading } = useLeaderboard();
  const { stats, isLoading: statsLoading } = useDashboardStats();
  const [alertsOpen, setAlertsOpen] = useState(true);

  const animatedBalance = useCountUpCurrency(stats.monthBalance);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  })();

  const firstName = profile?.full_name?.split(' ')[0] || 'Admin';

  const top3 = (leaderboard || []).slice(0, 3);
  const userRank = (leaderboard || []).find(e => e.user_id === user?.id);

  // Collect all pending alerts
  const alerts: { label: string; route: string; count?: number; variant: 'warning' | 'destructive' }[] = [];
  if (stats.pendingExpenses > 0) {
    alerts.push({ label: `${formatCurrency(stats.pendingExpenses)} em despesas pendentes`, route: '/finance', variant: 'warning' });
  }
  if (stats.pendingClosings > 0) {
    alerts.push({ label: `${stats.pendingClosings} fechamento(s) pendente(s)`, route: '/cash-closing', variant: 'warning' });
  }
  if (stats.pendingRedemptions > 0) {
    alerts.push({ label: `${stats.pendingRedemptions} resgate(s) aguardando`, route: '/rewards', variant: 'destructive' });
  }

  return (
    <div className="space-y-4 p-4 lg:p-6">
      {/* Welcome */}
      <div className="animate-slide-up stagger-1">
        <h2 className="text-xl font-bold text-foreground">
          {greeting}, {firstName}
        </h2>
        <p className="text-muted-foreground text-xs capitalize mt-0.5">
          {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
        </p>
      </div>

      {/* Primary row: Copilot + Finance */}
      <div className="grid grid-cols-2 gap-3">
        {/* AI COPILOT */}
        <AICopilotWidget />

        {/* FINANCE HERO */}
        <button
          onClick={() => navigate('/finance')}
          className="finance-hero-card col-span-1 text-left animate-slide-up stagger-2"
        >
          <div className="finance-hero-inner p-4">
            <span className="text-[11px] font-bold tracking-[0.1em] uppercase text-white/60">
              Saldo
            </span>
            <p className={cn(
              "text-xl font-extrabold tracking-tight leading-tight mt-1",
              stats.monthBalance >= 0 ? "text-white" : "text-red-300"
            )}>
              {statsLoading ? <Skeleton className="h-7 w-28 bg-white/10" /> : formatCurrency(animatedBalance)}
            </p>
            {stats.pendingExpenses > 0 && (
              <p className="text-[11px] text-white/50 mt-2">
                {formatCurrency(stats.pendingExpenses)} pendente
              </p>
            )}
          </div>
        </button>
      </div>

      {/* AGENDA */}
      <div className="animate-slide-up stagger-3">
        <AgendaDashboardWidget />
      </div>

      {/* ALERTS */}
      {alerts.length > 0 && (
        <div className="animate-slide-up stagger-4">
          <Collapsible open={alertsOpen} onOpenChange={setAlertsOpen}>
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between px-1 py-2">
                <div className="flex items-center gap-2">
                  <AppIcon name="Bell" size={14} className="text-warning" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Alertas ({alerts.length})
                  </span>
                </div>
                <AppIcon name={alertsOpen ? 'ChevronUp' : 'ChevronDown'} size={14} className="text-muted-foreground" />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="card-surface p-3 space-y-1">
                {alerts.map((alert, i) => (
                  <button
                    key={i}
                    onClick={() => navigate(alert.route)}
                    className="flex items-center justify-between w-full py-2 px-2 hover:bg-secondary/30 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        alert.variant === 'destructive' ? 'bg-destructive' : 'bg-warning'
                      )} />
                      <span className="text-xs text-foreground">{alert.label}</span>
                    </div>
                    <AppIcon name="ChevronRight" size={12} className="text-muted-foreground" />
                  </button>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}

      {/* RANKING - compact */}
      <button
        onClick={() => navigate('/ranking')}
        className="w-full animate-slide-up stagger-5"
      >
        <div className="card-interactive w-full p-4 text-left">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-warning/10 border border-warning/20">
              <AppIcon name="Trophy" size={18} className="text-warning" />
            </div>
            <div className="flex-1 min-w-0">
              {leaderboardLoading ? (
                <Skeleton className="h-4 w-40" />
              ) : top3.length > 0 ? (
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {top3.map((entry) => (
                      <div key={entry.user_id} className="ring-2 ring-background rounded-full">
                        <RankedAvatar avatarUrl={entry.avatar_url} earnedPoints={entry.total_score} size={24} />
                      </div>
                    ))}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {top3[0].full_name?.split(' ')[0]} lidera com {top3[0].total_score} pts
                    </p>
                    {userRank && userRank.rank > 1 && (
                      <p className="text-[11px] text-muted-foreground">
                        Você está em {userRank.rank}º
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Sem dados de ranking</p>
              )}
            </div>
            <AppIcon name="ChevronRight" size={16} className="text-muted-foreground shrink-0" />
          </div>
        </div>
      </button>
    </div>
  );
}
