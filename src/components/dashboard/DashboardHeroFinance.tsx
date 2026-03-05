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

  return (
    <button
      onClick={() => navigate('/finance')}
      className="finance-hero-card w-full text-left animate-spring-in spring-stagger-2"
    >
      <div className="finance-hero-inner p-5 pb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-bold tracking-[0.15em] uppercase" style={{ color: 'var(--gp-label)' }}>
            Saldo em contas
          </span>
          <AppIcon name="ChevronRight" size={18} style={{ color: 'var(--gp-icon)' }} />
        </div>

        <div className="mt-1">
          {isLoading ? (
            <Skeleton className="h-10 w-44 bg-white/10 rounded-xl" />
          ) : (
            <p className="text-[2rem] font-extrabold tracking-tight leading-tight animate-number-reveal" style={{ color: balance >= 0 ? 'var(--gp-value)' : 'var(--gp-negative)' }}>
              {formatCurrency(balance)}
            </p>
          )}
        </div>

        {!isLoading && (
          <div className="flex gap-2 mt-3">
            <div className="finance-hero-chip finance-hero-chip--success">
              <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--gp-sublabel)' }}>Lucro líquido</span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold" style={{ color: balance >= 0 ? 'var(--gp-positive)' : 'var(--gp-negative)' }}>
                  {formatCurrency(Math.max(balance, 0))}
                </span>
              </div>
            </div>
            <div className="finance-hero-chip finance-hero-chip--neutral">
              <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--gp-sublabel)' }}>Despesas</span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold" style={{ color: 'var(--gp-negative)' }}>
                  {formatCurrency(pendingExpenses)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </button>
  );
}