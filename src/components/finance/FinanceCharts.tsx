import { useState, useEffect, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line } from 'recharts';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { MonthSelector } from './MonthSelector';
import { CategoryStats, FinanceCategory, FinanceTransaction } from '@/types/finance';
import { EntityStats } from '@/hooks/useFinanceStats';
import { cn } from '@/lib/utils';

interface FinanceChartsProps {
  selectedMonth: Date;
  onMonthChange: (date: Date) => void;
  expensesByCategory: CategoryStats[];
  incomeByCategory: CategoryStats[];
  dailyExpenses: { date: string; amount: number }[];
  dailyIncome: { date: string; amount: number }[];
  getSubcategoryStats: (parentId: string) => CategoryStats[];
  getSupplierStats: (categoryId: string) => EntityStats[];
  getEmployeeStats: (categoryId: string) => EntityStats[];
  transactions: FinanceTransaction[];
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
  transactions
}: FinanceChartsProps) {
  const [viewType, setViewType] = useState<'categories' | 'timeline' | 'bars'>('categories');
  const [dataType, setDataType] = useState<'expense' | 'income'>('expense');
  const [drillDownCategory, setDrillDownCategory] = useState<FinanceCategory | null>(null);
  const [entityView, setEntityView] = useState<'employees' | 'suppliers' | null>(null);
  const [entityData, setEntityData] = useState<EntityStats[]>([]);
  

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const categoryData = dataType === 'expense' ? expensesByCategory : incomeByCategory;

  const subcategoryData = drillDownCategory ? getSubcategoryStats(drillDownCategory.id) : [];

  const displayData = drillDownCategory ? subcategoryData : categoryData;
  const displayTotal = displayData.reduce((sum, c) => sum + c.amount, 0);

  // Auto-detect entity data for subcategory drill-down
  const detectEntityData = useCallback((categoryId: string): { type: 'employees' | 'suppliers' | null; data: EntityStats[] } => {
    // Check if transactions in this category have employee_id or supplier_id
    const relevantTxs = transactions.filter(t => {
      if (!t.is_paid) return false;
      if (t.type !== 'expense' && t.type !== 'credit_card') return false;
      if (!t.category) return false;
      return t.category.id === categoryId || t.category.parent_id === categoryId;
    });

    const hasEmployees = relevantTxs.some(t => t.employee_id);
    const hasSuppliers = relevantTxs.some(t => t.supplier_id);

    if (hasEmployees) {
      return { type: 'employees', data: getEmployeeStats(categoryId) };
    }
    if (hasSuppliers) {
      return { type: 'suppliers', data: getSupplierStats(categoryId) };
    }
    return { type: null, data: [] };
  }, [transactions, getEmployeeStats, getSupplierStats]);

  const handleCategoryClick = (category: FinanceCategory) => {
    if (!drillDownCategory) {
      setDrillDownCategory(category);
      setEntityView(null);
      setEntityData([]);
    } else if (!entityView) {
      // Second level click (subcategory) - auto-detect entity
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

  // Reset when changing data type
  useEffect(() => {
    setDrillDownCategory(null);
    setEntityView(null);
    setEntityData([]);
  }, [dataType]);

  const entityTotal = entityData.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-4">
      {/* Month Selector */}
      <div className="px-4 pt-4">
        <MonthSelector selectedMonth={selectedMonth} onMonthChange={onMonthChange} />
      </div>

      {/* Data Type Toggle */}
      <div className="px-4">
        <div className="tab-command">
          {['expense', 'income'].map(type => (
            <button
              key={type}
              onClick={() => setDataType(type as 'expense' | 'income')}
              className={cn(
                "tab-command-item",
                dataType === type && "tab-command-item-active"
              )}
            >
              {type === 'expense' ? 'Despesas' : 'Receitas'}
            </button>
          ))}
        </div>
      </div>

      {/* View Type Toggle */}
      <div className="px-4">
        <div className="tab-command">
          {[
            { value: 'categories', label: 'Categorias' },
            { value: 'timeline', label: 'Linha' },
            { value: 'bars', label: 'Barras' },
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setViewType(tab.value as 'categories' | 'timeline' | 'bars')}
              className={cn(
                "tab-command-item",
                viewType === tab.value && "tab-command-item-active"
              )}
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
            <ChevronLeft className="w-4 h-4" />
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
      <div className="px-4 pb-24">
        {viewType === 'categories' && !entityView && (
          <div className="space-y-6">
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
                      disabled={!!entityView}
                      className="list-command w-full flex items-center gap-3 p-3 text-left"
                      style={{ borderLeftColor: item.category.color }}
                    >
                      <div
                        className="w-4 h-4 rounded-full shrink-0"
                        style={{ backgroundColor: item.category.color }}
                      />
                      <span className="flex-1 text-left font-medium text-sm">{item.category.name}</span>
                      <span className="text-muted-foreground text-xs">{item.percentage.toFixed(1)}%</span>
                      <span className="font-semibold text-sm">{formatCurrency(item.amount)}</span>
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

        {/* Entity View (Employees / Suppliers) */}
        {viewType === 'categories' && entityView && (
           <div className="space-y-6">
            {entityData.length > 0 ? (
              <>
                <div className="h-64 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={entityData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="amount"
                        nameKey="name"
                      >
                        {entityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-2xl font-bold">{formatCurrency(entityTotal)}</p>
                    <p className="text-sm text-muted-foreground">
                      {entityView === 'employees' ? 'funcionários' : 'fornecedores'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {entityData.map((item) => (
                    <div
                      key={item.id}
                      className="list-command flex items-center gap-3 w-full p-3"
                      style={{ borderLeftColor: item.color }}
                    >
                      <div
                        className="w-4 h-4 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.count} lançamento{item.count !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <span className="text-muted-foreground text-xs">{item.percentage.toFixed(1)}%</span>
                      <span className="font-semibold text-sm">{formatCurrency(item.amount)}</span>
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
              <BarChart data={entityView ? entityData : displayData}>
                <XAxis 
                  dataKey={entityView ? "name" : "category.name"}
                  tick={false}
                />
                <YAxis 
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  fontSize={12}
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(_, payload) => {
                    if (entityView) return payload[0]?.payload?.name || '';
                    return payload[0]?.payload?.category?.name || '';
                  }}
                />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                  {(entityView ? entityData : displayData).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entityView ? entry.color : entry.category?.color} />
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
