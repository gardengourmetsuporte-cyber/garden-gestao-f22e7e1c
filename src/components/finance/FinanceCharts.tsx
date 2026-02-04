import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line } from 'recharts';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { MonthSelector } from './MonthSelector';
import { CategoryStats, FinanceCategory } from '@/types/finance';
import { cn } from '@/lib/utils';

interface FinanceChartsProps {
  selectedMonth: Date;
  onMonthChange: (date: Date) => void;
  expensesByCategory: CategoryStats[];
  incomeByCategory: CategoryStats[];
  dailyExpenses: { date: string; amount: number }[];
  dailyIncome: { date: string; amount: number }[];
  getSubcategoryStats: (parentId: string) => CategoryStats[];
}

export function FinanceCharts({
  selectedMonth,
  onMonthChange,
  expensesByCategory,
  incomeByCategory,
  dailyExpenses,
  dailyIncome,
  getSubcategoryStats
}: FinanceChartsProps) {
  const [viewType, setViewType] = useState<'categories' | 'timeline' | 'bars'>('categories');
  const [dataType, setDataType] = useState<'expense' | 'income'>('expense');
  const [drillDownCategory, setDrillDownCategory] = useState<FinanceCategory | null>(null);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const categoryData = dataType === 'expense' ? expensesByCategory : incomeByCategory;
  const totalAmount = categoryData.reduce((sum, c) => sum + c.amount, 0);

  const subcategoryData = drillDownCategory ? getSubcategoryStats(drillDownCategory.id) : [];

  const displayData = drillDownCategory ? subcategoryData : categoryData;
  const displayTotal = displayData.reduce((sum, c) => sum + c.amount, 0);

  const chartColors = displayData.map(d => d.category.color);

  const handleCategoryClick = (category: FinanceCategory) => {
    if (!drillDownCategory) {
      setDrillDownCategory(category);
    }
  };

  const handleBack = () => {
    setDrillDownCategory(null);
  };

  return (
    <div className="space-y-4">
      {/* Month Selector */}
      <div className="px-4 pt-4">
        <MonthSelector selectedMonth={selectedMonth} onMonthChange={onMonthChange} />
      </div>

      {/* Data Type Toggle */}
      <div className="px-4">
        <Tabs value={dataType} onValueChange={(v) => { setDataType(v as 'expense' | 'income'); setDrillDownCategory(null); }}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="expense" className="data-[state=active]:bg-destructive data-[state=active]:text-white">
              Despesas
            </TabsTrigger>
            <TabsTrigger value="income" className="data-[state=active]:bg-success data-[state=active]:text-white">
              Receitas
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* View Type Toggle */}
      <div className="px-4">
        <Tabs value={viewType} onValueChange={(v) => setViewType(v as 'categories' | 'timeline' | 'bars')}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="categories">Categorias</TabsTrigger>
            <TabsTrigger value="timeline">Linha</TabsTrigger>
            <TabsTrigger value="bars">Barras</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Drill-down header */}
      {drillDownCategory && (
        <div className="px-4">
          <Button variant="ghost" size="sm" onClick={handleBack} className="gap-1">
            <ChevronLeft className="w-4 h-4" />
            {drillDownCategory.name}
          </Button>
        </div>
      )}

      {/* Charts */}
      <div className="px-4 pb-24">
        {viewType === 'categories' && (
          <div className="space-y-6">
            {/* Pie Chart */}
            {displayData.length > 0 ? (
              <>
                <div className="h-64 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={displayData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="amount"
                        nameKey="category.name"
                      >
                        {displayData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.category.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-2xl font-bold">{formatCurrency(displayTotal)}</p>
                    <p className="text-sm text-muted-foreground">total</p>
                  </div>
                </div>

                {/* Category List */}
                <div className="space-y-2">
                  {displayData.map((item) => (
                    <button
                      key={item.category.id}
                      onClick={() => handleCategoryClick(item.category)}
                      disabled={!!drillDownCategory}
                      className={cn(
                        "flex items-center gap-3 w-full p-3 rounded-xl bg-card border transition-colors",
                        !drillDownCategory && "hover:bg-secondary"
                      )}
                    >
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: item.category.color }}
                      />
                      <span className="flex-1 text-left font-medium">{item.category.name}</span>
                      <span className="text-muted-foreground text-sm">{item.percentage.toFixed(1)}%</span>
                      <span className="font-semibold">{formatCurrency(item.amount)}</span>
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

        {viewType === 'timeline' && (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dataType === 'expense' ? dailyExpenses : dailyIncome}>
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(d) => new Date(d).getDate().toString()}
                  fontSize={12}
                />
                <YAxis 
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  fontSize={12}
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(d) => new Date(d).toLocaleDateString('pt-BR')}
                />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke={dataType === 'expense' ? 'hsl(var(--destructive))' : 'hsl(var(--success))'}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {viewType === 'bars' && (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayData}>
                <XAxis 
                  dataKey="category.name" 
                  tick={false}
                />
                <YAxis 
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  fontSize={12}
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(_, payload) => payload[0]?.payload?.category?.name || ''}
                />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                  {displayData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.category.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
