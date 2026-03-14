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

export function DashboardHeroFinance({ balance, pendingExpenses, isLoading }: DashboardHeroFinanceProps) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(true);
  const masked = '•••••';
  const income = Math.max(balance + pendingExpenses, 0);
  const profit = income - pendingExpenses;
  const profitPercent = income > 0 ? ((profit / income) * 100).toFixed(0) : '0';

  const fmtCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div className="animate-card-reveal space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-0">
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

      {/* === HERO BALANCE CARD — same as Finance page === */}
      <button
        onClick={() => navigate('/finance')}
        className="finance-hero-card w-full text-left"
      >
        <div className="finance-hero-inner p-5 pb-4">
          {/* Card header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white/[0.08] flex items-center justify-center border border-white/[0.06]">
                <AppIcon name="Landmark" size={16} style={{ color: 'var(--gp-icon)' }} />
              </div>
              <span className="text-[11px] font-semibold tracking-[0.08em] uppercase" style={{ color: 'var(--gp-label)' }}>
                Saldo em contas
              </span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-white/[0.08] flex items-center justify-center border border-white/[0.06]">
              <AppIcon name="ArrowRight" size={14} style={{ color: 'var(--gp-icon)' }} />
            </div>
          </div>

          {/* Balance */}
          {isLoading ? (
            <Skeleton className="h-10 w-48 rounded" />
          ) : (
            <p className="text-[2.25rem] font-black tracking-[-0.03em] leading-none" style={{ color: balance >= 0 ? 'var(--gp-value)' : 'var(--gp-negative)' }}>
              {visible ? fmtCurrency(balance) : masked}
            </p>
          )}

          {/* Stat chips */}
          <div className="flex gap-2.5 mt-5">
            <div className="finance-hero-chip">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center">
                  <AppIcon name="TrendingUp" size={11} style={{ color: 'var(--gp-positive)' }} />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--gp-sublabel)' }}>
                  Lucro
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {isLoading ? (
                  <Skeleton className="h-4 w-16 rounded" />
                ) : (
                  <>
                    <span className="text-[15px] font-bold tabular-nums" style={{ color: profit >= 0 ? 'var(--gp-positive)' : 'var(--gp-negative)' }}>
                      {visible ? fmtCurrency(Math.abs(profit)) : masked}
                    </span>
                    <span className={cn(
                      "text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                      profit >= 0 ? "bg-primary/15" : "bg-destructive/15"
                    )} style={{ color: profit >= 0 ? 'var(--gp-positive)' : 'var(--gp-negative)' }}>
                      {profit >= 0 ? '+' : ''}{profitPercent}%
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </button>

      {/* Income / Expense cards */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate('/finance')}
          className="card-command-success p-4 text-left cursor-pointer transition-all duration-200"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-success/20 flex items-center justify-center">
              <AppIcon name="ArrowUpCircle" size={18} className="text-success" />
            </div>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Receitas</span>
          </div>
          {isLoading ? (
            <Skeleton className="h-5 w-20 rounded" />
          ) : (
            <p className="text-lg font-bold text-success">
              {visible ? fmtCurrency(income) : masked}
            </p>
          )}
        </button>
        <button
          onClick={() => navigate('/finance')}
          className="card-command-danger p-4 text-left cursor-pointer transition-all duration-200"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-destructive/20 flex items-center justify-center">
              <AppIcon name="ArrowDownCircle" size={18} className="text-destructive" />
            </div>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Despesas</span>
          </div>
          {isLoading ? (
            <Skeleton className="h-5 w-20 rounded" />
          ) : (
            <p className="text-lg font-bold text-destructive">
              {visible ? fmtCurrency(pendingExpenses) : masked}
            </p>
          )}
        </button>
      </div>
    </div>
  );
}
