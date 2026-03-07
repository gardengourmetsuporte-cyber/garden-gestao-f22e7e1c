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

  return (
    <div className="card-holographic w-full text-left animate-spring-in spring-stagger-2">
      <div className="finance-hero-inner p-5 pb-4 relative z-10">
        {/* Header row */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-medium tracking-wide" style={{ color: 'var(--gp-label)' }}>
            Saldo Disponível
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); setVisible(!visible); }}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
              aria-label={visible ? 'Ocultar saldo' : 'Mostrar saldo'}
            >
              <AppIcon name={visible ? 'Eye' : 'EyeOff'} size={16} style={{ color: 'var(--gp-icon)' }} />
            </button>
            <button
              onClick={() => navigate('/finance')}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
              aria-label="Ir para finanças"
            >
              <AppIcon name="ChevronRight" size={16} style={{ color: 'var(--gp-icon)' }} />
            </button>
          </div>
        </div>

        {/* Balance */}
        <div className="mt-1">
          {isLoading ? (
            <Skeleton className="h-10 w-44 bg-white/10 rounded-xl" />
          ) : (
            <p className="text-[2rem] font-extrabold tracking-tight leading-tight animate-number-reveal" style={{ color: balance >= 0 ? 'var(--gp-value)' : 'var(--gp-negative)' }}>
              {visible ? formatCurrency(balance) : masked}
            </p>
          )}
        </div>

        {/* Stat chips */}
        {!isLoading && (
          <div className="flex gap-2 mt-3">
            {/* Lucro */}
            <div className="finance-hero-chip finance-hero-chip--success flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <AppIcon name="TrendingUp" size={12} style={{ color: 'var(--gp-positive)' }} />
                <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--gp-sublabel)' }}>Lucro Líquido</span>
              </div>
              <span className="text-sm font-bold" style={{ color: balance >= 0 ? 'var(--gp-positive)' : 'var(--gp-negative)' }}>
                {visible ? formatCurrency(Math.max(balance, 0)) : masked}
              </span>
            </div>
            {/* Despesas */}
            <div className="finance-hero-chip finance-hero-chip--neutral flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <AppIcon name="TrendingDown" size={12} style={{ color: 'var(--gp-negative)' }} />
                <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--gp-sublabel)' }}>Despesas</span>
              </div>
              <span className="text-sm font-bold" style={{ color: 'var(--gp-negative)' }}>
                {visible ? formatCurrency(pendingExpenses) : masked}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
