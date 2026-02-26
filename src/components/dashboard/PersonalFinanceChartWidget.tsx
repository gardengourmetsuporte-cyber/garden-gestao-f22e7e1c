import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { AppIcon } from '@/components/ui/app-icon';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, format } from 'date-fns';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

interface CategoryExpense {
  id: string;
  name: string;
  color: string;
  icon: string;
  amount: number;
  percentage: number;
}

export function PersonalFinanceChartWidget() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const now = useMemo(() => new Date(), []);
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');

  const { data, isLoading } = useQuery({
    queryKey: ['personal-finance-chart', user?.id, monthStart],
    queryFn: async () => {
      if (!user?.id) return { categories: [] as CategoryExpense[], total: 0 };

      // Fetch personal expense transactions with category for this month
      const { data: transactions } = await supabase
        .from('finance_transactions')
        .select('amount, category_id, finance_categories!finance_transactions_category_id_fkey(id, name, color, icon, parent_id)')
        .eq('user_id', user.id)
        .is('unit_id', null)
        .in('type', ['expense', 'credit_card'])
        .eq('is_paid', true)
        .gte('date', monthStart)
        .lte('date', monthEnd);

      if (!transactions || transactions.length === 0) return { categories: [], total: 0 };

      // Fetch all personal categories to resolve parents
      const { data: allCats } = await supabase
        .from('finance_categories')
        .select('id, name, color, icon, parent_id')
        .eq('user_id', user.id)
        .is('unit_id', null);

      const catMap: Record<string, { id: string; name: string; color: string; icon: string }> = {};
      (allCats || []).forEach(c => { catMap[c.id] = c; });

      // Group by parent category
      const byCategory: Record<string, { name: string; color: string; icon: string; amount: number }> = {};
      let total = 0;

      transactions.forEach((t: any) => {
        const cat = t.finance_categories;
        if (!cat) return;
        // Find parent
        let parentCat = cat;
        if (cat.parent_id && catMap[cat.parent_id]) {
          parentCat = catMap[cat.parent_id];
        }
        const key = parentCat.id;
        if (!byCategory[key]) {
          byCategory[key] = { name: parentCat.name, color: parentCat.color, icon: parentCat.icon, amount: 0 };
        }
        byCategory[key].amount += Number(t.amount);
        total += Number(t.amount);
      });

      const categories: CategoryExpense[] = Object.entries(byCategory)
        .map(([id, c]) => ({
          id,
          name: c.name,
          color: c.color,
          icon: c.icon,
          amount: c.amount,
          percentage: total > 0 ? (c.amount / total) * 100 : 0,
        }))
        .sort((a, b) => b.amount - a.amount);

      return { categories, total };
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
  });

  const chartData = data?.categories.slice(0, 5) || [];
  const othersAmount = (data?.categories.slice(5) || []).reduce((s, c) => s + c.amount, 0);
  const finalData = othersAmount > 0
    ? [...chartData, { id: 'others', name: 'Outros', color: '#64748b', icon: 'MoreHorizontal', amount: othersAmount, percentage: 0 }]
    : chartData;
  const totalExpense = data?.total || 0;

  if (isLoading) {
    return (
      <div className="card-command w-full p-5 animate-slide-up stagger-4">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="w-[120px] h-[120px] rounded-full" />
          <div className="flex-1 space-y-2">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-5 w-full" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => navigate('/personal-finance')}
      className="card-command w-full p-0 text-left animate-slide-up stagger-4 transition-all duration-200 hover:scale-[1.005] active:scale-[0.98] overflow-hidden relative"
    >
      <div
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'hsl(160 60% 40%)' }}
      />

      <div className="p-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: 'hsl(160 60% 30% / 0.15)',
              }}
            >
              <AppIcon name="PieChart" size={18} style={{ color: 'hsl(160 60% 40%)' }} />
            </div>
            <div>
              <span className="text-sm font-bold text-foreground">Minhas despesas</span>
              <span className="text-[10px] text-muted-foreground block">Pessoal • por categoria</span>
            </div>
          </div>
          <AppIcon name="ChevronRight" size={16} className="text-muted-foreground" />
        </div>

        {finalData.length > 0 ? (
          <div className="flex items-center gap-3">
            <div className="relative shrink-0" style={{ width: 120, height: 120 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={finalData}
                    cx="50%"
                    cy="50%"
                    innerRadius={36}
                    outerRadius={55}
                    dataKey="amount"
                    paddingAngle={2}
                    cornerRadius={3}
                    stroke="none"
                  >
                    {finalData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-xs font-bold leading-none" style={{ color: 'hsl(160 60% 40%)' }}>
                  {totalExpense >= 1000
                    ? `${(totalExpense / 1000).toFixed(1)}k`
                    : formatCurrency(totalExpense)}
                </p>
                <p className="text-[9px] text-muted-foreground">total</p>
              </div>
            </div>

            <div className="flex-1 space-y-1.5 min-w-0">
              {finalData.map((item) => (
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
            <p className="text-xs text-muted-foreground">Sem despesas pessoais este mês</p>
          </div>
        )}
      </div>
    </button>
  );
}
