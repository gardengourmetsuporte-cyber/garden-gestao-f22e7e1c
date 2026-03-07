import { useState, useEffect, useCallback } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  LineChart, Line, CartesianGrid, Area, AreaChart
} from 'recharts';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/ui/app-icon';
import { UnifiedMonthNav } from '@/components/ui/unified-month-nav';
import { CategoryStats, FinanceCategory, FinanceTransaction } from '@/types/finance';
import { DREReport } from './DREReport';
import { EntityStats } from '@/hooks/useFinanceStats';
import { cn } from '@/lib/utils';

interface FinanceChartsProps {
  selectedMonth: Date;
  onMonthChange: (date: Date) => void;
  expensesByCategory: CategoryStats[];
  incomeByCategory: CategoryStats[];
  dailyExpenses: { date: string; amount: number }[];
  dailyIncome: { date: string; amount: number }[];
  getSubcategoryStats: (parentId: string, type?: 'expense' | 'income') => CategoryStats[];
  getSupplierStats: (categoryId: string) => EntityStats[];
  getEmployeeStats: (categoryId: string) => EntityStats[];
  transactions: FinanceTransaction[];
  categories?: FinanceCategory[];
}

import { formatCurrency } from '@/lib/format';

const formatCompact = (value: number) => {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return value.toFixed(0);
};

// Custom tooltip component
function CustomTooltip({ active, payload, label, labelFormatter }: any) {
  if (!active || !payload?.length) return null;
  const displayLabel = labelFormatter ? labelFormatter(label, payload) : label;
  return (
    <div className="rounded-lg border border-border/50 bg-background/95 backdrop-blur-sm px-3 py-2 shadow-xl">
      <p className="text-xs text-muted-foreground mb-0.5">{displayLabel}</p>
      <p className="text-sm font-bold text-foreground">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

export function FinanceCharts({
  selectedMonth,
  onMonthChange,
  expensesByCategory,
  incomeByCategory,
  dailyExpenses,
  dailyIncome,
  getSubcategoryStats,
  getSupplierStats,
  getEmployeeStats,
  transactions,
  categories: categoriesProp = [],
}: FinanceChartsProps) {
  const [viewType, setViewType] = useState<'categories' | 'timeline' | 'cumulative' | 'weekly'>('categories');
  const [dataType, setDataType] = useState<'expense' | 'income'>('expense');
  const [drillDownCategory, setDrillDownCategory] = useState<FinanceCategory | null>(null);
  const [entityView, setEntityView] = useState<'employees' | 'suppliers' | null>(null);
  const [entityData, setEntityData] = useState<EntityStats[]>([]);

  const categoryData = dataType === 'expense' ? expensesByCategory : incomeByCategory;
  const subcategoryData = drillDownCategory ? getSubcategoryStats(drillDownCategory.id, dataType) : [];
  const displayData = drillDownCategory ? subcategoryData : categoryData;
  const displayTotal = displayData.reduce((sum, c) => sum + c.amount, 0);

  const detectEntityData = useCallback((categoryId: string): { type: 'employees' | 'suppliers' | null; data: EntityStats[] } => {
    const relevantTxs = transactions.filter(t => {
      if (!t.is_paid) return false;
      if (t.type !== 'expense' && t.type !== 'credit_card') return false;
      if (!t.category) return false;
      return t.category.id === categoryId || t.category.parent_id === categoryId;
    });
    const hasEmployees = relevantTxs.some(t => t.employee_id);
    const hasSuppliers = relevantTxs.some(t => t.supplier_id);
    if (hasEmployees) return { type: 'employees', data: getEmployeeStats(categoryId) };
    if (hasSuppliers) return { type: 'suppliers', data: getSupplierStats(categoryId) };
    return { type: null, data: [] };
  }, [transactions, getEmployeeStats, getSupplierStats]);

  const handleCategoryClick = (category: FinanceCategory) => {
    if (!drillDownCategory) {
      setDrillDownCategory(category);
      setEntityView(null);
      setEntityData([]);
    } else if (!entityView) {
      const detected = detectEntityData(category.id);
      if (detected.type) {
        setEntityView(detected.type);
        setEntityData(detected.data);
      }
    }
  };

  const handleBack = () => {
    if (entityView) {
      setEntityView(null);
      setEntityData([]);
    } else {
      setDrillDownCategory(null);
    }
  };

  useEffect(() => {
    setDrillDownCategory(null);
    setEntityView(null);
    setEntityData([]);
  }, [dataType]);

  const entityTotal = entityData.reduce((sum, e) => sum + e.amount, 0);

  // Prepare bar chart data with proper names
  const barData = (entityView ? entityData : displayData).map((entry: any) => ({
    name: entityView ? entry.name : entry.category?.name || '',
    amount: entry.amount,
    color: entityView ? entry.color : entry.category?.color || '#6366f1',
  }));

  // Merged timeline data with both income and expense per day
  const mergedTimelineData = (() => {
    const map = new Map<number, { day: number; label: string; expense: number; income: number }>();
    dailyExpenses.forEach(d => {
      const day = new Date(d.date + 'T12:00:00').getDate();
      const label = new Date(d.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const existing = map.get(day) || { day, label, expense: 0, income: 0 };
      existing.expense += d.amount;
      map.set(day, existing);
    });
    dailyIncome.forEach(d => {
      const day = new Date(d.date + 'T12:00:00').getDate();
      const label = new Date(d.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const existing = map.get(day) || { day, label, expense: 0, income: 0 };
      existing.income += d.amount;
      map.set(day, existing);
    });
    return Array.from(map.values()).sort((a, b) => a.day - b.day);
  })();

  // Weekly data
  const weeklyData = (() => {
    const weeks = [
      { name: 'Sem 1', min: 1, max: 7 },
      { name: 'Sem 2', min: 8, max: 14 },
      { name: 'Sem 3', min: 15, max: 21 },
      { name: 'Sem 4', min: 22, max: 28 },
      { name: 'Sem 5', min: 29, max: 31 },
    ];
    return weeks.map(w => {
      const income = dailyIncome
        .filter(d => { const day = new Date(d.date + 'T12:00:00').getDate(); return day >= w.min && day <= w.max; })
        .reduce((s, d) => s + d.amount, 0);
      const expense = dailyExpenses
        .filter(d => { const day = new Date(d.date + 'T12:00:00').getDate(); return day >= w.min && day <= w.max; })
        .reduce((s, d) => s + d.amount, 0);
      return { name: w.name, income, expense, balance: income - expense };
    }).filter(w => w.income > 0 || w.expense > 0);
  })();

  return (
    <div className="space-y-4">
      <div className="px-4 pt-3 lg:px-6">
        <UnifiedMonthNav currentMonth={selectedMonth} onMonthChange={onMonthChange} />
      </div>

      {/* Data Type Toggle — hidden on weekly view */}
      {viewType !== 'weekly' && viewType !== 'timeline' && viewType !== 'cumulative' && (
        <div className="px-4">
          <div className="tab-command">
            {['expense', 'income'].map(type => (
              <button
                key={type}
                onClick={() => setDataType(type as 'expense' | 'income')}
                className={cn("tab-command-item", dataType === type && "tab-command-item-active")}
              >
                {type === 'expense' ? 'Despesas' : 'Receitas'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* View Type Toggle */}
      <div className="px-4">
        <div className="tab-command">
          {[
            { value: 'categories', label: 'Categorias' },
            { value: 'timeline', label: 'Linha' },
            { value: 'cumulative', label: 'Acumulado' },
            { value: 'weekly', label: 'Semanal' },
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setViewType(tab.value as 'categories' | 'timeline' | 'cumulative' | 'weekly')}
              className={cn("tab-command-item", viewType === tab.value && "tab-command-item-active")}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>



      {/* Drill-down header */}
      {(drillDownCategory || entityView) && (
        <div className="px-4 flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleBack} className="gap-1">
            <AppIcon name="ChevronLeft" size={16} />
            Voltar
          </Button>
          <span className="text-sm font-medium text-muted-foreground">
            {entityView
              ? `${drillDownCategory?.name} › ${entityView === 'employees' ? 'Funcionários' : 'Fornecedores'}`
              : drillDownCategory?.name
            }
          </span>
        </div>
      )}

      {/* Charts */}
      <div className="px-4 pb-32 overflow-hidden">

        {/* ═══ PIE / DONUT — Categories ═══ */}
        {viewType === 'categories' && !entityView && (
          <div className="space-y-5">
            {displayData.length > 0 ? (
              <>
                <div className="relative overflow-hidden" style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={displayData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={110}
                        dataKey="amount"
                        nameKey="category.name"
                        paddingAngle={2}
                        cornerRadius={4}
                        stroke="none"
                      >
                        {displayData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.category.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomTooltip labelFormatter={(_: any, p: any) => p[0]?.payload?.category?.name || ''} />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-xl font-bold text-foreground">{formatCurrency(displayTotal)}</p>
                    <p className="text-xs text-muted-foreground">total</p>
                  </div>
                </div>

                {/* Category List */}
                <div className="card-surface rounded-2xl overflow-hidden divide-y divide-border/40">
                  {displayData.map((item) => (
                    <button
                      key={item.category.id}
                      onClick={() => handleCategoryClick(item.category)}
                      disabled={!!entityView}
                      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/30 active:bg-secondary/50 transition-colors text-left"
                    >
                      <div
                        className="w-3.5 h-3.5 rounded-full shrink-0 ring-2 ring-offset-2 ring-offset-card"
                        style={{ backgroundColor: item.category.color, '--tw-ring-color': item.category.color } as React.CSSProperties}
                      />
                      <span className="flex-1 text-left font-medium text-sm truncate text-foreground">{item.category.name}</span>
                      <span className="text-muted-foreground text-xs tabular-nums mr-2">{item.percentage.toFixed(1)}%</span>
                      <span className="font-semibold text-sm tabular-nums text-foreground">{formatCurrency(item.amount)}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <p>Sem dados para exibir</p>
              </div>
            )}
          </div>
        )}

        {/* ═══ PIE / DONUT — Entity View ═══ */}
        {viewType === 'categories' && entityView && (
          <div className="space-y-5">
            {entityData.length > 0 ? (
              <>
                <div className="relative overflow-hidden" style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={entityData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={110}
                        dataKey="amount"
                        nameKey="name"
                        paddingAngle={2}
                        cornerRadius={4}
                        stroke="none"
                      >
                        {entityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomTooltip labelFormatter={(_: any, p: any) => p[0]?.payload?.name || ''} />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-xl font-bold text-foreground">{formatCurrency(entityTotal)}</p>
                    <p className="text-xs text-muted-foreground">
                      {entityView === 'employees' ? 'funcionários' : 'fornecedores'}
                    </p>
                  </div>
                </div>

                <div className="card-surface rounded-2xl overflow-hidden divide-y divide-border/40">
                  {entityData.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 w-full px-4 py-3.5"
                    >
                      <div
                        className="w-3.5 h-3.5 rounded-full shrink-0 ring-2 ring-offset-2 ring-offset-card"
                        style={{ backgroundColor: item.color, '--tw-ring-color': item.color } as React.CSSProperties}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.count} lançamento{item.count !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <span className="text-muted-foreground text-xs tabular-nums mr-2">{item.percentage.toFixed(1)}%</span>
                      <span className="font-semibold text-sm tabular-nums text-foreground">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <p>Sem {entityView === 'employees' ? 'funcionários' : 'fornecedores'} vinculados</p>
                <p className="text-xs mt-1">
                  {entityView === 'employees'
                    ? 'Os pagamentos precisam estar vinculados ao cadastro de funcionários'
                    : 'As transações precisam ter um fornecedor vinculado'
                  }
                </p>
              </div>
            )}
          </div>
        )}

        {/* ═══ AREA / LINE CHART ═══ */}
        {viewType === 'timeline' && (
          <div className="space-y-3">
            {mergedTimelineData.length > 0 ? (
              <div className="card-base p-3" style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mergedTimelineData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
                    <XAxis dataKey="day" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tickFormatter={formatCompact} fontSize={11} tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} width={45} />
                    <RechartsTooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        const inc = payload.find(p => p.dataKey === 'income')?.value as number || 0;
                        const exp = payload.find(p => p.dataKey === 'expense')?.value as number || 0;
                        return (
                          <div className="rounded-lg border border-border/50 bg-background/95 backdrop-blur-sm px-3 py-2 shadow-xl space-y-0.5">
                            <p className="text-xs font-medium text-foreground">Dia {label}</p>
                            <p className="text-xs" style={{ color: '#22c55e' }}>Receita: {formatCurrency(inc)}</p>
                            <p className="text-xs" style={{ color: '#ef4444' }}>Despesa: {formatCurrency(exp)}</p>
                          </div>
                        );
                      }}
                    />
                    <Area type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} fill="url(#incomeGradient)" dot={{ r: 2.5, fill: '#22c55e', strokeWidth: 0 }} activeDot={{ r: 4, fill: '#22c55e', stroke: 'hsl(var(--background))', strokeWidth: 2 }} />
                    <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2.5} fill="url(#expenseGradient)" dot={{ r: 2.5, fill: '#ef4444', strokeWidth: 0 }} activeDot={{ r: 4, fill: '#ef4444', stroke: 'hsl(var(--background))', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <p>Sem dados para exibir</p>
              </div>
            )}

            {/* Summary stats below chart */}
            {mergedTimelineData.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                <div className="card-base p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-0.5">Receita total</p>
                  <p className="text-sm font-bold tabular-nums" style={{ color: '#22c55e' }}>
                    {formatCurrency(mergedTimelineData.reduce((s, d) => s + d.income, 0))}
                  </p>
                </div>
                <div className="card-base p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-0.5">Despesa total</p>
                  <p className="text-sm font-bold tabular-nums" style={{ color: '#ef4444' }}>
                    {formatCurrency(mergedTimelineData.reduce((s, d) => s + d.expense, 0))}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ CUMULATIVE CHART ═══ */}
        {viewType === 'cumulative' && (
          <div className="space-y-3">
            {mergedTimelineData.length > 0 ? (() => {
              const cumulativeData = mergedTimelineData.reduce((acc, curr, i) => {
                const prevIncome = i > 0 ? acc[i - 1].cumulativeIncome : 0;
                const prevExpense = i > 0 ? acc[i - 1].cumulativeExpense : 0;
                acc.push({
                  ...curr,
                  cumulativeIncome: prevIncome + curr.income,
                  cumulativeExpense: prevExpense + curr.expense,
                  balance: (prevIncome + curr.income) - (prevExpense + curr.expense),
                });
                return acc;
              }, [] as (typeof mergedTimelineData[0] & { cumulativeIncome: number; cumulativeExpense: number; balance: number })[]);
              const finalBalance = cumulativeData.length > 0 ? cumulativeData[cumulativeData.length - 1].balance : 0;
              return (
                <>
                  <div className="card-base p-3" style={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={cumulativeData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="cumIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
                          </linearGradient>
                          <linearGradient id="cumExpenseGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
                        <XAxis dataKey="day" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                        <YAxis tickFormatter={formatCompact} fontSize={11} tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} width={45} />
                        <RechartsTooltip
                          content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null;
                            const inc = payload.find(p => p.dataKey === 'cumulativeIncome')?.value as number || 0;
                            const exp = payload.find(p => p.dataKey === 'cumulativeExpense')?.value as number || 0;
                            const bal = inc - exp;
                            return (
                              <div className="rounded-lg border border-border/50 bg-background/95 backdrop-blur-sm px-3 py-2 shadow-xl space-y-0.5">
                                <p className="text-xs font-medium text-foreground">Dia {label}</p>
                                <p className="text-xs" style={{ color: '#22c55e' }}>Receita acum.: {formatCurrency(inc)}</p>
                                <p className="text-xs" style={{ color: '#ef4444' }}>Despesa acum.: {formatCurrency(exp)}</p>
                                <p className={cn("text-xs font-bold", bal >= 0 ? "text-green-500" : "text-red-500")}>
                                  Saldo: {bal >= 0 ? '+' : ''}{formatCurrency(bal)}
                                </p>
                              </div>
                            );
                          }}
                        />
                        <Area type="monotone" dataKey="cumulativeIncome" stroke="#22c55e" strokeWidth={2.5} fill="url(#cumIncomeGrad)" dot={false} activeDot={{ r: 4, fill: '#22c55e', stroke: 'hsl(var(--background))', strokeWidth: 2 }} />
                        <Area type="monotone" dataKey="cumulativeExpense" stroke="#ef4444" strokeWidth={2.5} fill="url(#cumExpenseGrad)" dot={false} activeDot={{ r: 4, fill: '#ef4444', stroke: 'hsl(var(--background))', strokeWidth: 2 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Cumulative summary */}
                  <div className="card-base p-4 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Receita acum.</p>
                      <p className="text-sm font-bold tabular-nums" style={{ color: '#22c55e' }}>
                        {formatCurrency(cumulativeData[cumulativeData.length - 1]?.cumulativeIncome || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Despesa acum.</p>
                      <p className="text-sm font-bold tabular-nums" style={{ color: '#ef4444' }}>
                        {formatCurrency(cumulativeData[cumulativeData.length - 1]?.cumulativeExpense || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Saldo</p>
                      <p className={cn("text-sm font-bold tabular-nums", finalBalance >= 0 ? "text-green-500" : "text-red-500")}>
                        {finalBalance >= 0 ? '+' : ''}{formatCurrency(finalBalance)}
                      </p>
                    </div>
                  </div>
                </>
              );
            })() : (
              <div className="text-center py-16 text-muted-foreground">
                <p>Sem dados para exibir</p>
              </div>
            )}
          </div>
        )}

        {/* ═══ WEEKLY CHART ═══ */}
        {viewType === 'weekly' && (
          <div className="space-y-3">
            {weeklyData.length > 0 ? (
              <>
                <div className="card-base p-3" style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
                      <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis tickFormatter={formatCompact} fontSize={11} tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} width={45} />
                      <RechartsTooltip
                        cursor={{ fill: 'hsl(var(--muted))', opacity: 0.15 }}
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null;
                          const inc = payload.find(p => p.dataKey === 'income')?.value as number || 0;
                          const exp = payload.find(p => p.dataKey === 'expense')?.value as number || 0;
                          return (
                            <div className="rounded-lg border border-border/50 bg-background/95 backdrop-blur-sm px-3 py-2 shadow-xl space-y-0.5">
                              <p className="text-xs font-medium text-foreground">{label}</p>
                              <p className="text-xs" style={{ color: '#22c55e' }}>Receita: {formatCurrency(inc)}</p>
                              <p className="text-xs" style={{ color: '#ef4444' }}>Despesa: {formatCurrency(exp)}</p>
                              <p className={cn("text-xs font-bold", inc - exp >= 0 ? "text-green-500" : "text-red-500")}>
                                Saldo: {formatCurrency(inc - exp)}
                              </p>
                            </div>
                          );
                        }}
                      />
                      <Bar dataKey="income" name="Receita" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={28} />
                      <Bar dataKey="expense" name="Despesa" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Weekly summary cards */}
                <div className="space-y-2">
                  {weeklyData.map(w => (
                    <div key={w.name} className="card-base p-3 flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{w.name}</span>
                      <div className="flex items-center gap-4 text-xs tabular-nums">
                        <span style={{ color: '#22c55e' }}>{formatCurrency(w.income)}</span>
                        <span style={{ color: '#ef4444' }}>{formatCurrency(w.expense)}</span>
                        <span className={cn("font-bold", w.balance >= 0 ? "text-green-500" : "text-red-500")}>
                          {w.balance >= 0 ? '+' : ''}{formatCurrency(w.balance)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Monthly totals */}
                <div className="card-base p-4 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Receita total</p>
                    <p className="text-sm font-bold tabular-nums" style={{ color: '#22c55e' }}>
                      {formatCurrency(weeklyData.reduce((s, w) => s + w.income, 0))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Despesa total</p>
                    <p className="text-sm font-bold tabular-nums" style={{ color: '#ef4444' }}>
                      {formatCurrency(weeklyData.reduce((s, w) => s + w.expense, 0))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Saldo</p>
                    {(() => {
                      const total = weeklyData.reduce((s, w) => s + w.balance, 0);
                      return (
                        <p className={cn("text-sm font-bold tabular-nums", total >= 0 ? "text-green-500" : "text-red-500")}>
                          {total >= 0 ? '+' : ''}{formatCurrency(total)}
                        </p>
                      );
                    })()}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <p>Sem dados para exibir</p>
              </div>
            )}
          </div>
        )}

        {/* DRE Report - only on pie/categories view */}
        {viewType === 'categories' && (
          <div className="mt-8">
            <DREReport transactions={transactions} categories={categoriesProp} monthLabel={`${selectedMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}`} />
          </div>
        )}
      </div>
    </div>
  );
}
