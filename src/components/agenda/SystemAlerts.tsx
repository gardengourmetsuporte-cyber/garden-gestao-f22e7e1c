import { AlertTriangle, Package, Gift, ClipboardCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SystemAlert } from '@/types/agenda';

interface SystemAlertsProps {
  alerts: SystemAlert[];
}

const alertIcons = {
  inventory: Package,
  checklist: ClipboardCheck,
  rewards: Gift,
};

const severityStyles = {
  error: 'bg-destructive/10 border-destructive/20 text-destructive',
  warning: 'bg-warning/10 border-warning/20 text-warning',
  info: 'bg-primary/10 border-primary/20 text-primary',
};

export function SystemAlerts({ alerts }: SystemAlertsProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-muted-foreground">
        <AlertTriangle className="w-4 h-4" />
        <span className="text-sm font-medium">Alertas do Sistema</span>
      </div>
      
      <div className="grid gap-2">
        {alerts.map((alert, index) => {
          const Icon = alertIcons[alert.type] || AlertTriangle;
          return (
            <div
              key={index}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl border',
                severityStyles[alert.severity]
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium flex-1">{alert.message}</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-current/10">
                {alert.count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
