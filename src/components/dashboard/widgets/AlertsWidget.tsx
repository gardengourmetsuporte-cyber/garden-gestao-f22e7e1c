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

  return (
    <div onClick={onClick} className="flex items-center justify-between py-1.5 cursor-pointer active:scale-[0.98] transition-all">
      <div className="flex items-center gap-2">
        <AlertCircle className={cn("w-3.5 h-3.5 shrink-0", severity === 'error' ? 'text-destructive' : severity === 'warning' ? 'text-warning' : 'text-primary')} />
        <span className="text-[11px] text-foreground">{message}</span>
      </div>
      <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full", severityStyles[severity])}>{count}</span>
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
      <div className="card-command-success p-4 h-full flex items-center justify-center">
        <p className="text-sm text-success font-medium text-center">✅ Tudo ok</p>
      </div>
    );
  }

  return (
    <div className="card-command-warning p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-4 h-4 text-warning" />
        <h3 className="font-semibold text-xs text-foreground">Pendentes</h3>
      </div>
      <div className="space-y-0.5 flex-1">
        {stats.pendingRedemptions > 0 && (
          <AlertItem message="Resgates" count={stats.pendingRedemptions} severity="info" onClick={() => navigate('/rewards')} />
        )}
        {stats.pendingClosings > 0 && (
          <AlertItem message="Fechamentos" count={stats.pendingClosings} severity="warning" onClick={() => navigate('/cash-closing')} />
        )}
        {stats.pendingExpenses > 0 && (
          <AlertItem message="Despesas" count={formatCurrency(stats.pendingExpenses)} severity="info" onClick={() => navigate('/finance')} />
        )}
      </div>
    </div>
  );
}
