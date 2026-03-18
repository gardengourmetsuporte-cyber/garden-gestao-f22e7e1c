import { Badge } from '@/components/ui/badge';
import { Subscription, getAlertLevel, getMonthlyPrice, AlertLevel } from '@/hooks/useSubscriptions';
import { GradientIcon } from '@/components/ui/gradient-icon';
import { RecurringSuggestions } from './RecurringSuggestions';

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
    { name: 'DollarSign', label: 'Total mensal', value: `R$ ${totalMonthly.toFixed(2)}`, color: 'primary' as const },
    { name: 'Package', label: 'Ativos', value: String(activeCount), color: 'blue' as const },
    { name: 'AlertTriangle', label: 'Próximos', value: String(upcomingBills.length), color: 'amber' as const },
    { name: 'TrendingDown', label: 'Economia', value: `R$ ${canceledSavings.toFixed(2)}`, color: 'emerald' as const },
  ];

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-secondary/40 rounded-2xl p-4 active:scale-[0.98] transition-transform">
            <div className="flex items-center gap-2.5 mb-2">
              <GradientIcon name={s.name} color={s.color} size="sm" />
              <span className="text-[11px] text-muted-foreground font-medium">{s.label}</span>
            </div>
            <p className="text-xl font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Insights */}
      <div className="bg-primary/5 rounded-2xl p-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          💡 Você tem <span className="text-foreground font-semibold">{activeCount} serviços ativos</span> totalizando{' '}
          <span className="text-primary font-semibold">R$ {totalMonthly.toFixed(2)}/mês</span>.
          {canceledSavings > 0 && (
            <> Já economizou <span className="text-emerald-400 font-semibold">R$ {canceledSavings.toFixed(2)}/mês</span> cancelando serviços.</>
          )}
        </p>
      </div>

      {/* Upcoming Bills */}
      {upcomingBills.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Próximas cobranças</h3>
          <div className="space-y-2">
            {upcomingBills.slice(0, 8).map((bill) => {
              const level = getAlertLevel(bill.next_payment_date);
              const style = level ? alertStyles[level] : alertStyles.soon;
              return (
                <div key={bill.id} className="bg-secondary/40 rounded-2xl p-3 flex items-center justify-between active:scale-[0.98] transition-transform">
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge className={`${style.bg} ${style.text} border-0 text-[10px] shrink-0`}>{style.label}</Badge>
                    <span className="text-sm font-medium truncate">{bill.name}</span>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="text-sm font-bold">R$ {Number(bill.price).toFixed(2)}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {bill.next_payment_date ? new Date(bill.next_payment_date + 'T12:00:00').toLocaleDateString('pt-BR') : ''}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
