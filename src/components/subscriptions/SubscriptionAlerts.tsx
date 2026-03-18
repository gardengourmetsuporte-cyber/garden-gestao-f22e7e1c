import { AlertTriangle, Clock, Bell, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Subscription, AlertLevel } from '@/hooks/useSubscriptions';

interface AlertItem extends Subscription {
  alertLevel: AlertLevel;
}

interface Props {
  alerts: AlertItem[];
}

const alertConfig: Record<AlertLevel, { icon: typeof AlertTriangle; label: string; color: string; bg: string }> = {
  overdue: { icon: AlertCircle, label: 'Atrasado', color: 'text-destructive', bg: 'bg-destructive/15' },
  today: { icon: AlertTriangle, label: 'Vence hoje', color: 'text-destructive', bg: 'bg-destructive/10' },
  tomorrow: { icon: Clock, label: 'Vence amanhã', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  soon: { icon: Bell, label: 'Em breve', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
};

export function SubscriptionAlerts({ alerts }: Props) {
  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Bell className="w-12 h-12 mb-3 opacity-30" />
        <p className="text-sm">Nenhum alerta no momento</p>
        <p className="text-xs mt-1">Tudo em dia! 🎉</p>
      </div>
    );
  }

  const grouped = {
    overdue: alerts.filter(a => a.alertLevel === 'overdue'),
    today: alerts.filter(a => a.alertLevel === 'today'),
    tomorrow: alerts.filter(a => a.alertLevel === 'tomorrow'),
    soon: alerts.filter(a => a.alertLevel === 'soon'),
  };

  return (
    <div className="space-y-4">
      {(Object.entries(grouped) as [AlertLevel, AlertItem[]][]).map(([level, items]) => {
        if (items.length === 0) return null;
        const config = alertConfig[level];
        const Icon = config.icon;
        return (
          <div key={level}>
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${config.color}`} />
              <span className={`text-xs font-semibold ${config.color}`}>{config.label}</span>
              <Badge variant="secondary" className="text-[10px] h-4">{items.length}</Badge>
            </div>
            <div className="space-y-2">
              {items.map(item => (
                <Card key={item.id} className={`p-3 flex items-center justify-between ${config.bg} border-0`}>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {item.next_payment_date ? new Date(item.next_payment_date + 'T12:00:00').toLocaleDateString('pt-BR') : ''}
                    </p>
                  </div>
                  <p className="text-sm font-bold flex-shrink-0 ml-2">R$ {Number(item.price).toFixed(2)}</p>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
