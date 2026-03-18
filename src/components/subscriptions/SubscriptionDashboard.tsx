import { DollarSign, Package, AlertTriangle, TrendingDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Subscription, getAlertLevel, getMonthlyPrice, AlertLevel } from '@/hooks/useSubscriptions';

interface Props {
  totalMonthly: number;
  activeCount: number;
  upcomingBills: Subscription[];
  subscriptions: Subscription[];
}

const alertStyles: Record<AlertLevel, { bg: string; text: string; label: string }> = {
  overdue: { bg: 'bg-destructive/20', text: 'text-destructive', label: 'Atrasado' },
  today: { bg: 'bg-destructive/20', text: 'text-destructive', label: 'Hoje' },
  tomorrow: { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'Amanhã' },
  soon: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Em breve' },
};

export function SubscriptionDashboard({ totalMonthly, activeCount, upcomingBills, subscriptions }: Props) {
  const canceledSavings = subscriptions
    .filter(s => s.status === 'cancelado')
    .reduce((sum, s) => sum + getMonthlyPrice(s.price, s.billing_cycle), 0);

  const stats = [
    { icon: DollarSign, label: 'Total mensal', value: `R$ ${totalMonthly.toFixed(2)}`, color: 'text-primary' },
    { icon: Package, label: 'Serviços ativos', value: String(activeCount), color: 'text-blue-400' },
    { icon: AlertTriangle, label: 'Cobranças próximas', value: String(upcomingBills.length), color: 'text-yellow-400' },
    { icon: TrendingDown, label: 'Economia (cancelados)', value: `R$ ${canceledSavings.toFixed(2)}`, color: 'text-emerald-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <Card key={s.label} className="p-4 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Insights */}
      <Card className="p-4 border border-primary/20 bg-primary/5">
        <p className="text-sm text-muted-foreground">
          💡 Você tem <span className="text-foreground font-semibold">{activeCount} serviços ativos</span> totalizando{' '}
          <span className="text-primary font-semibold">R$ {totalMonthly.toFixed(2)}/mês</span>.
          {canceledSavings > 0 && (
            <> Já economizou <span className="text-emerald-400 font-semibold">R$ {canceledSavings.toFixed(2)}/mês</span> cancelando serviços.</>
          )}
        </p>
      </Card>

      {/* Upcoming Bills */}
      {upcomingBills.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Próximas cobranças</h3>
          <div className="space-y-2">
            {upcomingBills.slice(0, 8).map((bill) => {
              const level = getAlertLevel(bill.next_payment_date);
              const style = level ? alertStyles[level] : alertStyles.soon;
              return (
                <Card key={bill.id} className="p-3 flex items-center justify-between border border-border/30">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex-shrink-0">
                      <Badge className={`${style.bg} ${style.text} border-0 text-[10px]`}>{style.label}</Badge>
                    </div>
                    <span className="text-sm font-medium truncate">{bill.name}</span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold">R$ {Number(bill.price).toFixed(2)}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {bill.next_payment_date ? new Date(bill.next_payment_date + 'T12:00:00').toLocaleDateString('pt-BR') : ''}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
