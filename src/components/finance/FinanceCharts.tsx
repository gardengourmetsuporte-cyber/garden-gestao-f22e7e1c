import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line } from 'recharts';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Users, Truck, Loader2 } from 'lucide-react';
import { MonthSelector } from './MonthSelector';
import { CategoryStats, FinanceCategory } from '@/types/finance';
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
  getEmployeeStats: (categoryId: string) => Promise<EntityStats[]>;
}

// Known category patterns for entity drill-down
const EMPLOYEE_CATEGORY_NAMES = ['folha de pagamento', 'salários', 'salario', 'funcionários', 'funcionarios'];
const SUPPLIER_CATEGORY_NAMES = ['matéria-prima', 'materia-prima', 'matéria prima', 'insumos', 'mercado', 'fornecedores'];

function isEmployeeCategory(name: string): boolean {
  return EMPLOYEE_CATEGORY_NAMES.some(n => name.toLowerCase().includes(n));
}

function isSupplierCategory(name: string): boolean {
  return SUPPLIER_CATEGORY_NAMES.some(n => name.toLowerCase().includes(n));
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
  getEmployeeStats
}: FinanceChartsProps) {
  const [viewType, setViewType] = useState<'categories' | 'timeline' | 'bars'>('categories');
  const [dataType, setDataType] = useState<'expense' | 'income'>('expense');
  const [drillDownCategory, setDrillDownCategory] = useState<FinanceCategory | null>(null);
  const [entityView, setEntityView] = useState<'employees' | 'suppliers' | null>(null);
  const [entityData, setEntityData] = useState<EntityStats[]>([]);
  const [entityLoading, setEntityLoading] = useState(false);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const categoryData = dataType === 'expense' ? expensesByCategory : incomeByCategory;

  const subcategoryData = drillDownCategory ? getSubcategoryStats(drillDownCategory.id) : [];

  const displayData = drillDownCategory ? subcategoryData : categoryData;
  const displayTotal = displayData.reduce((sum, c) => sum + c.amount, 0);

  // Check if current drill-down category supports entity view
  const canShowEmployees = drillDownCategory && isEmployeeCategory(drillDownCategory.name);
  const canShowSuppliers = drillDownCategory && isSupplierCategory(drillDownCategory.name);
  const canShowEntities = canShowEmployees || canShowSuppliers;

  const handleCategoryClick = (category: FinanceCategory) => {
    if (!drillDownCategory) {
      setDrillDownCategory(category);
      setEntityView(null);
      setEntityData([]);
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

  const handleShowEntities = async (type: 'employees' | 'suppliers') => {
    if (!drillDownCategory) return;
    setEntityLoading(true);
    setEntityView(type);

    try {
      if (type === 'suppliers') {
        const stats = getSupplierStats(drillDownCategory.id);
        setEntityData(stats);
      } else {
        const stats = await getEmployeeStats(drillDownCategory.id);
        setEntityData(stats);
      }
    } catch {
      setEntityData([]);
    } finally {
      setEntityLoading(false);
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
        <Tabs value={dataType} onValueChange={(v) => { setDataType(v as 'expense' | 'income'); }}>
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

                {/* Entity drill-down buttons */}
                {canShowEntities && drillDownCategory && (
                  <div className="flex gap-2">
                    {canShowEmployees && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-2"
                        onClick={() => handleShowEntities('employees')}
                      >
                        <Users className="w-4 h-4" />
                        Ver por Funcionário
                      </Button>
                    )}
                    {canShowSuppliers && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-2"
                        onClick={() => handleShowEntities('suppliers')}
                      >
                        <Truck className="w-4 h-4" />
                        Ver por Fornecedor
                      </Button>
                    )}
                  </div>
                )}

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
            {entityLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : entityData.length > 0 ? (
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
                      className="flex items-center gap-3 w-full p-3 rounded-xl bg-card border"
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
