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
      className="dash-hero w-full text-left animate-spring-in spring-stagger-2"
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
            <AppIcon name="Wallet" size={14} className="text-white/80" />
          </div>
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/60">
            Saldo da empresa
          </span>
        </div>
        <AppIcon name="ChevronRight" size={16} className="text-white/30" />
      </div>

      <div className="mt-3">
        {isLoading ? (
          <Skeleton className="h-10 w-44 bg-white/10 rounded-xl" />
        ) : (
          <p className={`text-[2.25rem] font-extrabold tracking-tight leading-none ${balance >= 0 ? 'text-white' : 'text-red-300'}`}>
            {formatCurrency(balance)}
          </p>
        )}
      </div>

      {pendingExpenses > 0 && !isLoading && (
        <div className="mt-3 flex items-center gap-2">
          <div className="rounded-lg px-3 py-1.5 bg-white/5 border border-white/10">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-white/40">Pendências</span>
            <span className="text-sm font-bold ml-2 text-amber-300">
              {formatCurrency(pendingExpenses)}
            </span>
          </div>
        </div>
      )}
    </button>
  );
}
