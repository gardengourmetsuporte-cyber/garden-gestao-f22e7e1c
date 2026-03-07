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
    <div className="finance-hero-card w-full text-left animate-spring-in spring-stagger-2">
      <div className="finance-hero-inner p-5 pb-4">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/[0.08] flex items-center justify-center border border-white/[0.06]">
              <AppIcon name="Wallet" size={16} style={{ color: 'var(--gp-icon)' }} />
            </div>
            <span className="text-[11px] font-semibold tracking-[0.08em] uppercase" style={{ color: 'var(--gp-label)' }}>
              Saldo disponível
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); setVisible(!visible); }}
              className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/[0.08] transition-colors"
              aria-label={visible ? 'Ocultar saldo' : 'Mostrar saldo'}
            >
              <AppIcon name={visible ? 'Eye' : 'EyeOff'} size={15} style={{ color: 'var(--gp-icon)' }} />
            </button>
            <button
              onClick={() => navigate('/finance')}
              className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/[0.08] transition-colors"
              aria-label="Ir para finanças"
            >
              <AppIcon name="ArrowRight" size={15} style={{ color: 'var(--gp-icon)' }} />
            </button>
          </div>
        </div>

        {/* Balance */}
        {isLoading ? (
          <Skeleton className="h-11 w-48 bg-white/10 rounded-xl" />
        ) : (
          <p
            className="text-[2.25rem] font-black tracking-[-0.03em] leading-none animate-number-reveal"
            style={{ color: balance >= 0 ? 'var(--gp-value)' : 'var(--gp-negative)' }}
          >
            {visible ? formatCurrency(balance) : masked}
          </p>
        )}

        {/* Stat chips */}
        {!isLoading && (
          <div className="flex gap-2.5 mt-5">
            <div className="finance-hero-chip">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center">
                  <AppIcon name="TrendingUp" size={11} style={{ color: 'var(--gp-positive)' }} />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--gp-sublabel)' }}>
                  Receitas
                </span>
              </div>
              <span className="text-[15px] font-bold tabular-nums" style={{ color: 'var(--gp-positive)' }}>
                {visible ? formatCurrency(income) : masked}
              </span>
            </div>
            <div className="finance-hero-chip">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-red-500/15 flex items-center justify-center">
                  <AppIcon name="TrendingDown" size={11} style={{ color: 'var(--gp-negative)' }} />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--gp-sublabel)' }}>
                  Despesas
                </span>
              </div>
              <span className="text-[15px] font-bold tabular-nums" style={{ color: 'var(--gp-negative)' }}>
                {visible ? formatCurrency(pendingExpenses) : masked}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
