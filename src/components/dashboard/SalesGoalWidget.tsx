import { useState } from 'react';
import { useSalesGoals } from '@/hooks/useSalesGoals';
import { useDashboardAnalytics } from '@/hooks/useDashboardAnalytics';
import { formatCurrency } from '@/lib/format';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppIcon } from '@/components/ui/app-icon';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';

function GoalRing({ pct, size = 56, stroke = 5 }: { pct: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;
  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={pct >= 100 ? 'hsl(var(--success))' : 'hsl(var(--primary))'}
        strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        className="transition-all duration-700 ease-out"
      />
    </svg>
  );
}

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

  const settingsSheet = isAdmin && (
    <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (v) { setDailyInput(String(dailyGoal || '')); setMonthlyInput(String(monthlyGoal || '')); } }}>
      <SheetTrigger asChild>
        <button className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted/50 transition-colors">
          <AppIcon name="Settings" size={13} className="text-muted-foreground" />
        </button>
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
  );

  const hasGoals = dailyGoal > 0 || monthlyGoal > 0;

  if (!hasGoals) {
    return (
      <div className="card-surface p-5">
        <div className="flex flex-col items-center py-4 gap-2">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <AppIcon name="Target" size={24} className="text-primary/50" />
          </div>
          <p className="text-sm font-medium text-foreground">Sem metas ainda</p>
          <p className="text-xs text-muted-foreground text-center max-w-[200px]">
            Defina metas diárias e mensais para acompanhar seu progresso.
          </p>
          {isAdmin && (
            <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="text-xs mt-1 h-8">
              Definir Metas
            </Button>
          )}
        </div>
        {settingsSheet}
      </div>
    );
  }

  return (
    <div className="card-surface p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AppIcon name="Target" size={15} className="text-primary" />
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Metas</h3>
        </div>
        {settingsSheet}
      </div>

      {/* Goal cards */}
      <div className="grid grid-cols-2 gap-3">
        {dailyGoal > 0 && (
          <div className="flex items-center gap-3 rounded-2xl bg-secondary/50 p-4">
            <div className="relative shrink-0">
              <GoalRing pct={dailyPct} size={52} stroke={4} />
              <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-foreground tabular-nums">
                {dailyPct.toFixed(0)}%
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Hoje</p>
              <p className="text-base font-bold text-foreground tabular-nums leading-tight truncate">
                {formatCurrency(todayRevenue)}
              </p>
              <p className="text-[10px] text-muted-foreground tabular-nums mt-0.5">
                de {formatCurrency(dailyGoal)}
              </p>
            </div>
          </div>
        )}

        {monthlyGoal > 0 && (
          <div className="flex items-center gap-3 rounded-2xl bg-secondary/50 p-4">
            <div className="relative shrink-0">
              <GoalRing pct={monthlyPct} size={52} stroke={4} />
              <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-foreground tabular-nums">
                {monthlyPct.toFixed(0)}%
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">
                {format(new Date(), 'MMM', { locale: ptBR }).toUpperCase()}
              </p>
              <p className="text-base font-bold text-foreground tabular-nums leading-tight truncate">
                {formatCurrency(monthRevenue)}
              </p>
              <p className="text-[10px] text-muted-foreground tabular-nums mt-0.5">
                de {formatCurrency(monthlyGoal)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
