import { useState } from 'react';
import { formatCurrency } from '@/lib/format';
import { useNavigate } from 'react-router-dom';
import { AppIcon } from '@/components/ui/app-icon';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardHeroFinanceProps {
  balance: number;
  pendingExpenses: number;
  isLoading: boolean;
}

export function DashboardHeroFinance({ balance, pendingExpenses, isLoading }: DashboardHeroFinanceProps) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(true);
  const masked = '•••••••';
  const income = Math.max(balance + pendingExpenses, 0);

  return (
    <div className="finance-hero-card w-full text-left animate-card-reveal">
      <div className="finance-hero-inner p-5 pb-4">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <AppIcon name="Wallet" size={16} className="text-primary" />
            </div>
            <span className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
              Saldo disponível
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); setVisible(!visible); }}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted/50 transition-colors"
              aria-label={visible ? 'Ocultar saldo' : 'Mostrar saldo'}
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

        {/* Balance */}
        {isLoading ? (
          <Skeleton className="h-11 w-48 bg-muted rounded-xl" />
        ) : (
          <p
            className="text-[2rem] font-black tracking-tight leading-none animate-number-reveal"
            style={{ color: balance >= 0 ? 'hsl(var(--foreground))' : 'hsl(var(--destructive))' }}
          >
            {visible ? formatCurrency(balance) : masked}
          </p>
        )}

        {/* Stat chips */}
        {!isLoading && (
          <div className="flex gap-2.5 mt-5">
            <div className="finance-hero-chip">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-success/12 flex items-center justify-center">
                  <AppIcon name="TrendingUp" size={11} className="text-success" />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Receitas
                </span>
              </div>
              <span className="text-sm font-bold tabular-nums text-success">
                {visible ? formatCurrency(income) : masked}
              </span>
            </div>
            <div className="finance-hero-chip">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-destructive/12 flex items-center justify-center">
                  <AppIcon name="TrendingDown" size={11} className="text-destructive" />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Despesas
                </span>
              </div>
              <span className="text-sm font-bold tabular-nums text-destructive">
                {visible ? formatCurrency(pendingExpenses) : masked}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
