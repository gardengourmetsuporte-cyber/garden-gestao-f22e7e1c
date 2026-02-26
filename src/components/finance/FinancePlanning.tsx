import { useState, useMemo } from 'react';
import { MonthSelector } from './MonthSelector';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useBudgets } from '@/hooks/useBudgets';
import { FinanceCategory, FinanceTransaction } from '@/types/finance';
import { cn } from '@/lib/utils';
import { CashFlowProjection } from './CashFlowProjection';

interface FinancePlanningProps {
  selectedMonth: Date;
  onMonthChange: (date: Date) => void;
  totalBalance?: number;
  categories: FinanceCategory[];
  transactions: FinanceTransaction[];
}

export function FinancePlanning({ selectedMonth, onMonthChange, totalBalance = 0, categories, transactions }: FinancePlanningProps) {
  const month = selectedMonth.getMonth() + 1;
  const year = selectedMonth.getFullYear();
  const { budgets, isLoading: budgetsLoading, upsertBudget, deleteBudget } = useBudgets(month, year);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<FinanceCategory | null>(null);
  const [amount, setAmount] = useState('');

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  // Calculate spent per category (expense only, paid)
  const spentByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    const parentLookup: Record<string, string> = {};

    // Build parent lookup from all categories
    categories.forEach(cat => {
      cat.subcategories?.forEach(sub => {
        parentLookup[sub.id] = cat.id;
      });
    });

    transactions
      .filter(t => (t.type === 'expense' || t.type === 'credit_card') && t.is_paid && t.category_id)
      .forEach(t => {
        const parentId = parentLookup[t.category_id!] || t.category_id!;
        map[parentId] = (map[parentId] || 0) + Number(t.amount);
      });
    return map;
  }, [transactions, categories]);

  const expenseCategories = categories.filter(c => c.type === 'expense');

  // Budget items with spent data
  const budgetItems = useMemo(() => {
    return budgets.map(b => {
      const spent = b.category_id ? (spentByCategory[b.category_id] || 0) : 0;
      const percent = b.planned_amount > 0 ? (spent / b.planned_amount) * 100 : 0;
      return { ...b, spent, percent };
    }).sort((a, b) => (b.percent) - (a.percent));
  }, [budgets, spentByCategory]);

  const totalBudget = budgetItems.reduce((s, b) => s + b.planned_amount, 0);
  const totalSpent = budgetItems.reduce((s, b) => s + b.spent, 0);
  const totalPercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // Categories not yet budgeted
  const unbugdetedCategories = expenseCategories.filter(
    c => !budgets.find(b => b.category_id === c.id)
  );

  const handleSaveBudget = async () => {
    if (!selectedCategory || !amount) return;
    const parsed = parseFloat(amount.replace(/\./g, '').replace(',', '.'));
    if (isNaN(parsed) || parsed <= 0) return;
    await upsertBudget(selectedCategory.id, parsed);
    setSheetOpen(false);
    setSelectedCategory(null);
    setAmount('');
  };

  const handleEditBudget = (budget: typeof budgetItems[0]) => {
    const cat = expenseCategories.find(c => c.id === budget.category_id);
    if (cat) {
      setSelectedCategory(cat);
      setAmount(String(budget.planned_amount));
      setSheetOpen(true);
    }
  };

  return (
    <div className="space-y-4">
      {/* Month Selector */}
      <div className="px-4 pt-4">
        <MonthSelector selectedMonth={selectedMonth} onMonthChange={onMonthChange} />
      </div>

      {/* Total Summary */}
      <div className="px-4">
        <div className="card-command p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'hsl(var(--primary) / 0.15)' }}>
                <AppIcon name="Target" size={18} className="text-primary" />
              </div>
              <div>
                <span className="text-sm font-bold text-foreground">Orçamento Total</span>
                <span className="text-[10px] text-muted-foreground block">{budgetItems.length} categoria(s)</span>
              </div>
            </div>
            <span className={cn(
              "text-xs font-bold px-2 py-0.5 rounded-full",
              totalPercent > 100 ? "bg-destructive/15 text-destructive" :
              totalPercent > 80 ? "bg-warning/15 text-warning" :
              "bg-success/15 text-success"
            )}>
              {totalPercent.toFixed(0)}%
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">
                {formatCurrency(totalSpent)} de {formatCurrency(totalBudget)}
              </span>
              <span className={cn(
                "font-semibold",
                totalSpent > totalBudget ? "text-destructive" : "text-success"
              )}>
                {totalSpent > totalBudget ? 'Excedido' : `Resta ${formatCurrency(totalBudget - totalSpent)}`}
              </span>
            </div>
            <Progress
              value={Math.min(totalPercent, 100)}
              className="h-2"
            />
          </div>
        </div>
      </div>

      {/* Budget Items */}
      <div className="px-4 space-y-2">
        {budgetItems.map(item => (
          <button
            key={item.id}
            onClick={() => handleEditBudget(item)}
            className="card-command p-3 w-full text-left space-y-2 transition-all hover:scale-[1.005] active:scale-[0.98]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: `${item.category?.color}20` }}
                >
                  <AppIcon
                    name={(item.category?.icon as any) || 'Tag'}
                    size={14}
                    style={{ color: item.category?.color }}
                  />
                </div>
                <span className="text-sm font-medium text-foreground">{item.category?.name || 'Categoria'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                  item.percent > 100 ? "bg-destructive/15 text-destructive" :
                  item.percent > 80 ? "bg-warning/15 text-warning" :
                  "bg-success/15 text-success"
                )}>
                  {item.percent.toFixed(0)}%
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">
                  {formatCurrency(item.spent)} / {formatCurrency(item.planned_amount)}
                </span>
                {item.percent > 100 && (
                  <span className="text-destructive font-semibold flex items-center gap-0.5">
                    <AppIcon name="AlertTriangle" size={10} />
                    Excedido em {formatCurrency(item.spent - item.planned_amount)}
                  </span>
                )}
                {item.percent > 80 && item.percent <= 100 && (
                  <span className="text-warning font-semibold">Atenção</span>
                )}
              </div>
              <Progress
                value={Math.min(item.percent, 100)}
                className="h-1.5"
              />
            </div>
          </button>
        ))}

        {budgetItems.length === 0 && !budgetsLoading && (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <AppIcon name="Target" size={28} className="text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Nenhum orçamento definido</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
              Defina metas de gastos por categoria para acompanhar seus limites mensais.
            </p>
          </div>
        )}

        {/* Add Budget Button */}
        {unbugdetedCategories.length > 0 && (
          <Button
            variant="outline"
            className="w-full gap-2 border-dashed"
            onClick={() => {
              setSelectedCategory(null);
              setAmount('');
              setSheetOpen(true);
            }}
          >
            <AppIcon name="Plus" size={16} />
            Adicionar Orçamento
          </Button>
        )}
      </div>


      {/* Cash Flow Projection */}
      <div className="pb-32">
        <CashFlowProjection totalBalance={totalBalance} />
      </div>

      {/* Add/Edit Budget Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl px-4 pb-8">
          <SheetHeader className="pb-4">
            <SheetTitle>{selectedCategory ? 'Editar Orçamento' : 'Novo Orçamento'}</SheetTitle>
          </SheetHeader>

          <div className="space-y-4">
            {/* Category Selection */}
            {!selectedCategory && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Categoria</label>
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  {unbugdetedCategories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat)}
                      className="flex items-center gap-2 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors text-left"
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `${cat.color}20` }}
                      >
                        <AppIcon name={(cat.icon as any) || 'Tag'} size={14} style={{ color: cat.color }} />
                      </div>
                      <span className="text-xs font-medium truncate">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedCategory && (
              <>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: `${selectedCategory.color}20` }}
                  >
                    <AppIcon name={(selectedCategory.icon as any) || 'Tag'} size={16} style={{ color: selectedCategory.color }} />
                  </div>
                  <span className="font-medium text-foreground">{selectedCategory.name}</span>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Valor planejado (R$)</label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={amount}
                    onChange={e => {
                      const raw = e.target.value.replace(/[^\d,\.]/g, '');
                      setAmount(raw);
                    }}
                    className="text-lg"
                  />
                </div>

                <div className="flex gap-2">
                  {budgets.find(b => b.category_id === selectedCategory.id) && (
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={async () => {
                        const existing = budgets.find(b => b.category_id === selectedCategory.id);
                        if (existing) {
                          await deleteBudget(existing.id);
                          setSheetOpen(false);
                        }
                      }}
                    >
                      Remover
                    </Button>
                  )}
                  <Button
                    className="flex-1"
                    onClick={handleSaveBudget}
                    disabled={!amount || !amount.replace(/[^\d]/g, '')}
                  >
                    Salvar
                  </Button>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
