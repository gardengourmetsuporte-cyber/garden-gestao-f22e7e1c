import { useNavigate } from 'react-router-dom';
import { AlertTriangle, AlertCircle, ArrowUpRight } from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { cn } from '@/lib/utils';

function AlertItem({ message, count, severity, onClick }: {
  message: string;
  count: number | string;
  severity: 'error' | 'warning' | 'info';
  onClick: () => void;
}) {
  const severityStyles = {
    error: 'text-destructive bg-destructive/10',
    warning: 'text-warning bg-warning/10',
    info: 'text-primary bg-primary/10',
  };
  const borderColor = {
    error: 'border-l-destructive/50',
    warning: 'border-l-warning/50',
    info: 'border-l-primary/50',
  };

  return (
    <div onClick={onClick} className={cn(
      "flex items-center justify-between py-2 px-3 rounded-xl hover:bg-muted/50 cursor-pointer transition-colors active:scale-[0.98] group border-l-2",
      borderColor[severity]
    )}>
      <div className="flex items-center gap-2.5">
        <AlertCircle className={cn("w-4 h-4", severity === 'error' ? 'text-destructive' : severity === 'warning' ? 'text-warning' : 'text-primary')} />
        <span className="text-xs text-foreground">{message}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", severityStyles[severity])}>{count}</span>
        <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}

export function AlertsWidget() {
  const navigate = useNavigate();
  const { stats } = useDashboardStats();

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const hasAlerts = stats.pendingRedemptions > 0 || stats.pendingClosings > 0 || stats.pendingExpenses > 0;

  if (!hasAlerts) {
    return (
      <div className="card-command-success p-4">
        <p className="text-sm text-success font-medium text-center">✅ Nenhuma ação pendente</p>
      </div>
    );
  }

  return (
    <div className="card-command-warning p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-warning" />
        <h3 className="font-semibold text-sm text-foreground">Ações Pendentes</h3>
      </div>
      <div className="space-y-1">
        {stats.pendingRedemptions > 0 && (
          <AlertItem message="Resgates aguardando" count={stats.pendingRedemptions} severity="info" onClick={() => navigate('/rewards')} />
        )}
        {stats.pendingClosings > 0 && (
          <AlertItem message="Fechamentos pendentes" count={stats.pendingClosings} severity="warning" onClick={() => navigate('/cash-closing')} />
        )}
        {stats.pendingExpenses > 0 && (
          <AlertItem message="Despesas a pagar" count={formatCurrency(stats.pendingExpenses)} severity="info" onClick={() => navigate('/finance')} />
        )}
      </div>
    </div>
  );
}
