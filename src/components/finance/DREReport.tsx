import { useMemo } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { FinanceTransaction, FinanceCategory } from '@/types/finance';

interface DREReportProps {
  transactions: FinanceTransaction[];
  categories: FinanceCategory[];
}

interface DRELine {
  label: string;
  value: number;
  isTotal?: boolean;
  isNegative?: boolean;
  indent?: boolean;
}

export function DREReport({ transactions, categories }: DREReportProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  // Build category name lookup (including subcategories)
  const categoryNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach(cat => {
      map[cat.id] = cat.name;
      cat.subcategories?.forEach(sub => {
        map[sub.id] = sub.name;
      });
    });
    return map;
  }, [categories]);

  // Identify cost categories (Matéria-prima, Folha de Pagamento)
  const costCategoryIds = useMemo(() => {
    const ids = new Set<string>();
    const costNames = ['Matéria-prima', 'matéria-prima', 'materia-prima', 'CMV'];
    categories.forEach(cat => {
      if (costNames.some(n => cat.name.toLowerCase().includes(n.toLowerCase()))) {
        ids.add(cat.id);
        cat.subcategories?.forEach(sub => ids.add(sub.id));
      }
    });
    return ids;
  }, [categories]);

  const laborCategoryIds = useMemo(() => {
    const ids = new Set<string>();
    const laborNames = ['Folha de Pagamento', 'Pró-labore'];
    categories.forEach(cat => {
      if (laborNames.some(n => cat.name.toLowerCase().includes(n.toLowerCase()))) {
        ids.add(cat.id);
        cat.subcategories?.forEach(sub => ids.add(sub.id));
      }
    });
    return ids;
  }, [categories]);

  const dre = useMemo(() => {
    const paidTxns = transactions.filter(t => t.is_paid);

    const grossRevenue = paidTxns
      .filter(t => t.type === 'income')
      .reduce((s, t) => s + Number(t.amount), 0);

    const directCosts = paidTxns
      .filter(t => (t.type === 'expense' || t.type === 'credit_card') && t.category_id && costCategoryIds.has(t.category_id))
      .reduce((s, t) => s + Number(t.amount), 0);

    const grossProfit = grossRevenue - directCosts;

    const laborCosts = paidTxns
      .filter(t => (t.type === 'expense' || t.type === 'credit_card') && t.category_id && laborCategoryIds.has(t.category_id))
      .reduce((s, t) => s + Number(t.amount), 0);

    const otherExpenses = paidTxns
      .filter(t => (t.type === 'expense' || t.type === 'credit_card') && t.category_id && !costCategoryIds.has(t.category_id) && !laborCategoryIds.has(t.category_id))
      .reduce((s, t) => s + Number(t.amount), 0);

    // Expenses without category
    const uncategorizedExpenses = paidTxns
      .filter(t => (t.type === 'expense' || t.type === 'credit_card') && !t.category_id)
      .reduce((s, t) => s + Number(t.amount), 0);

    const totalOpex = laborCosts + otherExpenses + uncategorizedExpenses;
    const netResult = grossProfit - totalOpex;

    const lines: DRELine[] = [
      { label: 'Receita Bruta', value: grossRevenue },
      { label: '(-) Custos Diretos (CMV)', value: -directCosts, isNegative: true, indent: true },
      { label: '= Lucro Bruto', value: grossProfit, isTotal: true },
      { label: '(-) Folha de Pagamento', value: -laborCosts, isNegative: true, indent: true },
      { label: '(-) Outras Despesas Operacionais', value: -(otherExpenses + uncategorizedExpenses), isNegative: true, indent: true },
      { label: '= Resultado Líquido', value: netResult, isTotal: true },
    ];

    const grossMargin = grossRevenue > 0 ? (grossProfit / grossRevenue) * 100 : 0;
    const netMargin = grossRevenue > 0 ? (netResult / grossRevenue) * 100 : 0;

    return { lines, grossMargin, netMargin, netResult };
  }, [transactions, costCategoryIds, laborCategoryIds]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 px-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'hsl(var(--primary) / 0.15)' }}>
          <AppIcon name="FileBarChart" size={18} className="text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">DRE Simplificado</h3>
          <span className="text-[10px] text-muted-foreground">Demonstrativo de Resultados</span>
        </div>
      </div>

      {/* DRE Table */}
      <div className="mx-4 rounded-xl border border-border overflow-hidden">
        {dre.lines.map((line, idx) => (
          <div
            key={idx}
            className={cn(
              "flex items-center justify-between px-4 py-3 text-sm",
              line.isTotal && "bg-secondary/50 font-bold",
              !line.isTotal && "border-b border-border/50",
              line.indent && "pl-6"
            )}
          >
            <span className={cn(
              "text-foreground",
              line.isNegative && "text-muted-foreground",
              line.isTotal && (line.value >= 0 ? "text-success" : "text-destructive")
            )}>
              {line.label}
            </span>
            <span className={cn(
              line.isTotal && (line.value >= 0 ? "text-success" : "text-destructive"),
              line.isNegative && "text-destructive/80"
            )}>
              {formatCurrency(Math.abs(line.value))}
            </span>
          </div>
        ))}
      </div>

      {/* Margins */}
      <div className="px-4 grid grid-cols-2 gap-3">
        <div className="card-command p-3 text-center">
          <span className="text-[10px] text-muted-foreground block mb-1">Margem Bruta</span>
          <span className={cn("text-lg font-bold", dre.grossMargin >= 0 ? "text-success" : "text-destructive")}>
            {dre.grossMargin.toFixed(1)}%
          </span>
        </div>
        <div className="card-command p-3 text-center">
          <span className="text-[10px] text-muted-foreground block mb-1">Margem Líquida</span>
          <span className={cn("text-lg font-bold", dre.netMargin >= 0 ? "text-success" : "text-destructive")}>
            {dre.netMargin.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}
