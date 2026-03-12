import { useState } from 'react';
import { useSalesGoals } from '@/hooks/useSalesGoals';
import { useDashboardAnalytics } from '@/hooks/useDashboardAnalytics';
import { formatCurrency } from '@/lib/format';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
  if (!goal && !isAdmin) return null;

  return (
    <div className="card-base p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center">
            <AppIcon name="Target" size={14} className="text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Metas de Vendas</h3>
        </div>
        {isAdmin && (
          <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (v) { setDailyInput(String(dailyGoal || '')); setMonthlyInput(String(monthlyGoal || '')); } }}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-muted/30">
                <AppIcon name="Settings" size={14} className="text-muted-foreground" />
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
                <span className="font-semibold text-foreground tabular-nums">
                  {formatCurrency(todayRevenue)} / {formatCurrency(dailyGoal)}
                </span>
              </div>
              <Progress value={dailyPct} className="h-2" />
              <p className="text-[10px] text-muted-foreground mt-1 tabular-nums">{dailyPct.toFixed(0)}% da meta diária</p>
            </div>
          )}
          {monthlyGoal > 0 && (
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">{format(new Date(), 'MMMM', { locale: ptBR })}</span>
                <span className="font-semibold text-foreground tabular-nums">
                  {formatCurrency(monthRevenue)} / {formatCurrency(monthlyGoal)}
                </span>
              </div>
              <Progress value={monthlyPct} className="h-2" />
              <p className="text-[10px] text-muted-foreground mt-1 tabular-nums">{monthlyPct.toFixed(0)}% da meta mensal</p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center py-4 gap-1.5">
          <p className="text-xs text-muted-foreground">Nenhuma meta definida para este mês</p>
          {isAdmin && (
            <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="text-xs mt-1">
              Definir Metas
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
