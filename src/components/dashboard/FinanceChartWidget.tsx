import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { AppIcon } from '@/components/ui/app-icon';
import { formatCurrency } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { startOfMonth, endOfMonth, format } from 'date-fns';

interface CategoryExpense {
  id: string;
  name: string;
  color: string;
  icon: string;
  amount: number;
  percentage: number;
}

/**
 * Lightweight hook that fetches only expense aggregates by category.
 * Avoids loading the full useFinance hook (accounts + all transactions).
 */
function useExpensesByCategory() {
  const { user } = useAuth();
  const { activeUnitId } = useUnit();
  const now = useMemo(() => new Date(), []);
  const startDate = format(startOfMonth(now), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(now), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['expenses-by-category', user?.id, activeUnitId, startDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('finance_transactions')
        .select('amount, category:finance_categories(id, name, color, icon)')
        .eq('user_id', user!.id)
        .eq('unit_id', activeUnitId!)
        .in('type', ['expense', 'credit_card'])
        .eq('is_paid', true)
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) throw error;

      const catMap = new Map<string, { id: string; name: string; color: string; icon: string; amount: number }>();
      let total = 0;

      (data || []).forEach((t: any) => {
        const cat = t.category;
        const catId = cat?.id || 'uncategorized';
        const amount = Number(t.amount) || 0;
        total += amount;

        const existing = catMap.get(catId);
        if (existing) {
          existing.amount += amount;
        } else {
          catMap.set(catId, {
            id: catId,
            name: cat?.name || 'Sem categoria',
            color: cat?.color || '#64748b',
            icon: cat?.icon || 'Circle',
            amount,
          });
        }
      });

      const sorted = [...catMap.values()]
        .sort((a, b) => b.amount - a.amount)
        .map(c => ({ ...c, percentage: total > 0 ? (c.amount / total) * 100 : 0 }));

      return { categories: sorted, totalExpense: total };
    },
    enabled: !!user && !!activeUnitId,
    staleTime: 5 * 60 * 1000,
  });
}

export function FinanceChartWidget() {
  const navigate = useNavigate();
  const { data, isLoading } = useExpensesByCategory();

  const expensesByCategory = data?.categories || [];
  const totalExpense = data?.totalExpense || 0;

  // Top 5 categories for compact view
  const top5 = expensesByCategory.slice(0, 5);
  const othersAmount = expensesByCategory.slice(5).reduce((s, c) => s + c.amount, 0);
  const chartData = othersAmount > 0
    ? [...top5, { id: 'others', name: 'Outros', color: '#64748b', icon: 'MoreHorizontal', amount: othersAmount, percentage: 0 }]
    : top5;

  if (isLoading) {
    return (
      <div className="card-surface w-full p-5 animate-slide-up stagger-2">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-secondary/60 relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3.5 w-24 rounded bg-secondary/60 relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
            <div className="h-2.5 w-16 rounded bg-secondary/60 relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-[120px] h-[120px] rounded-full bg-secondary/60 relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
          <div className="flex-1 space-y-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-4 w-full rounded bg-secondary/60 relative overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => navigate('/finance', { state: { tab: 'charts' } })}
      className="card-command w-full p-0 text-left animate-slide-up stagger-2 transition-all duration-200 hover:scale-[1.005] active:scale-[0.98] overflow-hidden relative"
    >
      {/* Decorative glow */}
      <div
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'hsl(var(--destructive))' }}
      />

      <div className="p-4 pb-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: 'hsl(var(--destructive) / 0.15)',
              }}
            >
              <AppIcon name="PieChart" size={18} className="text-destructive" />
            </div>
            <div>
              <span className="text-sm font-bold text-foreground font-display" style={{ letterSpacing: '-0.02em' }}>Despesas do mês</span>
              <span className="text-[10px] text-muted-foreground block">Por categoria</span>
            </div>
          </div>
          <AppIcon name="ChevronRight" size={16} className="text-muted-foreground" />
        </div>

        {chartData.length > 0 ? (
          <div className="flex items-center gap-3">
            {/* Mini Donut */}
            <div className="relative shrink-0" style={{ width: 120, height: 120 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={36}
                    outerRadius={55}
                    dataKey="amount"
                    paddingAngle={2}
                    cornerRadius={3}
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {/* Center value */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-xs font-bold text-destructive leading-none">
                  {totalExpense >= 1000
                    ? `${(totalExpense / 1000).toFixed(1)}k`
                    : formatCurrency(totalExpense)
                  }
                </p>
                <p className="text-[9px] text-muted-foreground">total</p>
              </div>
            </div>

            {/* Legend */}
            <div className="flex-1 space-y-1.5 min-w-0">
              {chartData.map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-[11px] text-foreground truncate flex-1">
                    {item.name}
                  </span>
                  <span className="text-[10px] font-semibold text-muted-foreground tabular-nums shrink-0">
                    {item.percentage > 0 ? `${item.percentage.toFixed(0)}%` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <AppIcon name="PieChart" size={28} className="text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Sem despesas este mês</p>
          </div>
        )}
      </div>
    </button>
  );
}
