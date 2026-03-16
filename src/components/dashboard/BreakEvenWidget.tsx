import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { formatCurrency } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import { AppIcon } from '@/components/ui/app-icon';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';

export function BreakEvenWidget() {
  const { activeUnit } = useUnit();
  const unitId = activeUnit?.id;
  const [guideOpen, setGuideOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ['break-even', unitId],
    queryFn: async () => {
      const now = new Date();
      const start = format(startOfMonth(now), 'yyyy-MM-dd');
      const end = format(endOfMonth(now), 'yyyy-MM-dd');

      const { data: closings } = await supabase
        .from('cash_closings')
        .select('total_amount')
        .eq('unit_id', unitId!)
        .gte('date', start)
        .lte('date', end);

      const revenue = closings?.reduce((s, c) => s + Number(c.total_amount || 0), 0) || 0;

      const { data: expenses } = await supabase
        .from('finance_transactions')
        .select('amount, type')
        .eq('unit_id', unitId!)
        .eq('type', 'expense')
        .eq('is_paid', true)
        .gte('date', start)
        .lte('date', end);

      const totalExpenses = expenses?.reduce((s, e) => s + Number(e.amount || 0), 0) || 0;

      const cmvPercent = revenue > 0 ? Math.min((totalExpenses / revenue) * 0.5, 0.6) : 0.3;
      const fixedCosts = totalExpenses * 0.7;
      const breakEven = cmvPercent < 1 ? fixedCosts / (1 - cmvPercent) : 0;

      return { revenue, totalExpenses, breakEven, fixedCosts, cmvPercent, reachedPct: breakEven > 0 ? (revenue / breakEven) * 100 : 0 };
    },
    enabled: !!unitId,
  });

  if (!data || data.breakEven === 0) return null;

  const reached = data.reachedPct >= 100;

  return (
    <>
      <Card className="border-border/50">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Ponto de Equilíbrio (Estimativa)</h3>
            <button
              onClick={() => setGuideOpen(true)}
              className="w-6 h-6 rounded-full bg-muted/60 hover:bg-muted flex items-center justify-center transition-colors"
            >
              <AppIcon name="HelpCircle" size={14} className="text-muted-foreground" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Break-even</p>
              <p className="text-lg font-bold">{formatCurrency(data.breakEven)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Receita Atual</p>
              <p className="text-lg font-bold">{formatCurrency(data.revenue)}</p>
            </div>
          </div>
          <div className="mt-3 w-full bg-muted/50 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${reached ? 'bg-primary' : 'bg-amber-500'}`}
              style={{ width: `${Math.min(data.reachedPct, 100)}%` }}
            />
          </div>
          <p className={`text-xs font-medium mt-1 ${reached ? 'text-primary' : 'text-amber-500'}`}>
            {reached ? '✅ Meta atingida!' : `${data.reachedPct.toFixed(0)}% do break-even`}
          </p>
        </CardContent>
      </Card>

      <Sheet open={guideOpen} onOpenChange={setGuideOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[85vh] rounded-t-3xl overflow-y-auto">
          <SheetHeader className="text-left pb-4">
            <SheetTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-md" style={{ background: 'linear-gradient(135deg, #F59E0B, #F97316)' }}>
                <AppIcon name="TrendingUp" size={16} className="text-white" />
              </div>
              O que é o Ponto de Equilíbrio?
            </SheetTitle>
            <SheetDescription>Entenda como funciona essa métrica essencial</SheetDescription>
          </SheetHeader>

          <div className="space-y-4 pb-6">
            <div className="card-surface rounded-xl p-4 space-y-2">
              <h4 className="text-sm font-semibold text-foreground">📌 Conceito</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                O <strong className="text-foreground">Ponto de Equilíbrio</strong> (break-even) é o valor mínimo de receita que seu restaurante precisa faturar no mês para cobrir todos os custos. Abaixo desse valor, você está no prejuízo; acima, está lucrando.
              </p>
            </div>

            <div className="card-surface rounded-xl p-4 space-y-2">
              <h4 className="text-sm font-semibold text-foreground">🧮 Como é calculado?</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                O sistema pega suas <strong className="text-foreground">despesas pagas do mês</strong> e estima quais são custos fixos (aluguel, salários, contas) e quais são variáveis (insumos, embalagens). A fórmula é:
              </p>
              <div className="bg-muted/40 rounded-lg p-3 text-center">
                <p className="text-xs font-mono text-foreground">
                  Break-even = Custos Fixos ÷ (1 - % Custos Variáveis)
                </p>
              </div>
              <p className="text-[11px] text-muted-foreground">
                ⚠️ É uma <strong>estimativa</strong> — quanto mais despesas cadastradas, mais preciso fica.
              </p>
            </div>

            <div className="card-surface rounded-xl p-4 space-y-2">
              <h4 className="text-sm font-semibold text-foreground">📊 A barra de progresso</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Mostra quanto da meta você já atingiu. Começa <strong className="text-amber-500">amarela</strong> e fica <strong className="text-primary">verde</strong> quando você supera o break-even — ou seja, está lucrando!
              </p>
            </div>

            <div className="card-surface rounded-xl p-4 space-y-2">
              <h4 className="text-sm font-semibold text-foreground">💡 Como melhorar?</h4>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span><strong className="text-foreground">Reduza custos fixos:</strong> renegocie aluguel, contratos</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span><strong className="text-foreground">Melhore o CMV:</strong> negocie com fornecedores, evite desperdício</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span><strong className="text-foreground">Aumente receita:</strong> promoções, delivery, combos</span>
                </li>
              </ul>
            </div>

            <div className="card-surface rounded-xl p-4 space-y-2">
              <h4 className="text-sm font-semibold text-foreground">🔢 Seus números atuais</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-muted-foreground">Despesas do mês</p>
                  <p className="text-sm font-bold text-foreground">{formatCurrency(data.totalExpenses)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Custos fixos (est.)</p>
                  <p className="text-sm font-bold text-foreground">{formatCurrency(data.fixedCosts)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">% Variável (est.)</p>
                  <p className="text-sm font-bold text-foreground">{(data.cmvPercent * 100).toFixed(0)}%</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Progresso</p>
                  <p className={`text-sm font-bold ${reached ? 'text-primary' : 'text-amber-500'}`}>{data.reachedPct.toFixed(0)}%</p>
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export default BreakEvenWidget;
