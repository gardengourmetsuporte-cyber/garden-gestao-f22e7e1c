import { useState } from 'react';
import { useSalesGoals } from '@/hooks/useSalesGoals';
import { useDashboardAnalytics } from '@/hooks/useDashboardAnalytics';
import { formatCurrency } from '@/lib/format';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppIcon } from '@/components/ui/app-icon';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';

export function SalesGoalWidget() {
  const { goal, isLoading: goalLoading, upsertGoal } = useSalesGoals();
  const { data: analytics } = useDashboardAnalytics(1);
  const { isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [dailyInput, setDailyInput] = useState('');
  const [monthlyInput, setMonthlyInput] = useState('');

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayRevenue = analytics?.dailyRevenue.find(d => d.date === todayStr)?.total ?? 0;
  const monthRevenue = analytics?.totalPeriod ?? 0;

  const dailyGoal = goal?.daily_goal ?? 0;
  const monthlyGoal = goal?.monthly_goal ?? 0;

  const dailyPct = dailyGoal > 0 ? Math.min(100, (todayRevenue / dailyGoal) * 100) : 0;
  const monthlyPct = monthlyGoal > 0 ? Math.min(100, (monthRevenue / monthlyGoal) * 100) : 0;

  const handleSave = () => {
    upsertGoal.mutate({
      dailyGoal: parseFloat(dailyInput) || 0,
      monthlyGoal: parseFloat(monthlyInput) || 0,
    }, { onSuccess: () => setOpen(false) });
  };

  if (goalLoading) return null;

  // If no goals set and not admin, don't show
  if (!goal && !isAdmin) return null;

  return (
    <Card className="border-border/50">
      <CardContent className="pt-4 pb-4 px-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AppIcon name="Target" size={16} className="text-primary" />
            <h3 className="text-sm font-semibold">Metas de Vendas</h3>
          </div>
          {isAdmin && (
            <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (v) { setDailyInput(String(dailyGoal || '')); setMonthlyInput(String(monthlyGoal || '')); } }}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <AppIcon name="Settings" size={14} />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-2xl">
                <SheetHeader>
                  <SheetTitle>Definir Metas — {format(new Date(), 'MMMM yyyy', { locale: ptBR })}</SheetTitle>
                </SheetHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>Meta Diária (R$)</Label>
                    <Input type="number" value={dailyInput} onChange={e => setDailyInput(e.target.value)} placeholder="Ex: 3000" />
                  </div>
                  <div>
                    <Label>Meta Mensal (R$)</Label>
                    <Input type="number" value={monthlyInput} onChange={e => setMonthlyInput(e.target.value)} placeholder="Ex: 80000" />
                  </div>
                  <Button onClick={handleSave} disabled={upsertGoal.isPending} className="w-full">
                    {upsertGoal.isPending ? 'Salvando...' : 'Salvar Metas'}
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>

        {dailyGoal > 0 || monthlyGoal > 0 ? (
          <div className="space-y-4">
            {dailyGoal > 0 && (
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Hoje</span>
                  <span className="font-medium">{formatCurrency(todayRevenue)} / {formatCurrency(dailyGoal)}</span>
                </div>
                <Progress value={dailyPct} className="h-2.5" />
                <p className="text-[10px] text-muted-foreground mt-1">{dailyPct.toFixed(0)}% da meta diária</p>
              </div>
            )}
            {monthlyGoal > 0 && (
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">{format(new Date(), 'MMMM', { locale: ptBR })}</span>
                  <span className="font-medium">{formatCurrency(monthRevenue)} / {formatCurrency(monthlyGoal)}</span>
                </div>
                <Progress value={monthlyPct} className="h-2.5" />
                <p className="text-[10px] text-muted-foreground mt-1">{monthlyPct.toFixed(0)}% da meta mensal</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-xs text-muted-foreground mb-2">Nenhuma meta definida para este mês</p>
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="text-xs">
                Definir Metas
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
