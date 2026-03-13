import { useState } from 'react';
import { formatCurrency } from '@/lib/format';
import { useNavigate } from 'react-router-dom';
import { AppIcon } from '@/components/ui/app-icon';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface DashboardHeroFinanceProps {
  balance: number;
  pendingExpenses: number;
  isLoading: boolean;
}

const statCards = [
  { key: 'balance', label: 'Saldo atual', icon: 'Landmark', iconBg: 'bg-blue-500/15', iconColor: 'text-blue-400' },
  { key: 'income', label: 'Receitas', icon: 'TrendingUp', iconBg: 'bg-success/15', iconColor: 'text-success' },
  { key: 'expenses', label: 'Despesas', icon: 'TrendingDown', iconBg: 'bg-destructive/15', iconColor: 'text-destructive' },
] as const;

export function DashboardHeroFinance({ balance, pendingExpenses, isLoading }: DashboardHeroFinanceProps) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(true);
  const masked = '•••••';
  const income = Math.max(balance + pendingExpenses, 0);

  const values: Record<string, number> = {
    balance,
    income,
    expenses: pendingExpenses,
  };

  const valueColors: Record<string, string> = {
    balance: balance >= 0 ? 'text-foreground' : 'text-destructive',
    income: 'text-success',
    expenses: 'text-destructive',
  };

  return (
    <div className="animate-card-reveal">
      {/* Eye toggle */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold text-foreground">Finanças</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setVisible(!visible)}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted/50 transition-colors"
            aria-label={visible ? 'Ocultar valores' : 'Mostrar valores'}
          >
            <AppIcon name={visible ? 'Eye' : 'EyeOff'} size={15} className="text-muted-foreground" />
          </button>
          <button
            onClick={() => navigate('/finance')}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted/50 transition-colors"
            aria-label="Ir para finanças"
          >
            <AppIcon name="ArrowRight" size={15} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Horizontal scrollable stat cards — Mobills style */}
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {statCards.map((card) => (
          <button
            key={card.key}
            onClick={() => navigate('/finance')}
            className={cn(
              "flex items-center gap-3 min-w-[160px] flex-1 rounded-2xl p-4",
              "bg-card border border-border/40 hover:border-border/60",
              "active:scale-[0.97] transition-all duration-200 touch-manipulation",
            )}
          >
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", card.iconBg)}>
              <AppIcon name={card.icon} size={18} className={card.iconColor} />
            </div>
            <div className="text-left min-w-0 flex-1">
              <p className="text-[11px] text-muted-foreground leading-tight truncate">{card.label}</p>
              {isLoading ? (
                <Skeleton className="h-5 w-16 rounded mt-1" />
              ) : (
                <p className={cn("text-base font-bold tabular-nums leading-tight mt-0.5 truncate", valueColors[card.key])}>
                  {visible ? formatCurrency(values[card.key]) : masked}
                </p>
              )}
            </div>
            <AppIcon name="ChevronRight" size={14} className="text-muted-foreground/40 shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
