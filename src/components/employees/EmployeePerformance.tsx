import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { AppIcon } from '@/components/ui/app-icon';
import { Progress } from '@/components/ui/progress';
import { RankedAvatar } from '@/components/profile/RankedAvatar';
import { cn } from '@/lib/utils';
import { calculateEarnedPoints } from '@/lib/points';
import { Skeleton } from '@/components/ui/skeleton';

interface PerformanceEntry {
  employee_id: string;
  full_name: string;
  avatar_url: string | null;
  user_id: string | null;
  checklistsCompleted: number;
  earnedPoints: number;
  cashClosings: number;
  redemptions: number;
  score: number;
}

export function EmployeePerformance() {
  const { activeUnitId } = useUnit();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['employee-performance', activeUnitId],
    queryFn: async () => {
      if (!activeUnitId) return [];

      const [
        { data: employees },
        { data: profiles },
        { data: completions },
        { data: closings },
        { data: redemptions },
      ] = await Promise.all([
        supabase.from('employees').select('id, full_name, user_id').eq('unit_id', activeUnitId).eq('is_active', true),
        supabase.from('profiles').select('user_id, avatar_url'),
        supabase.from('checklist_completions').select('completed_by, points_awarded, awarded_points').eq('unit_id', activeUnitId),
        supabase.from('cash_closings').select('user_id, status').eq('unit_id', activeUnitId),
        supabase.from('reward_redemptions').select('user_id, status').eq('unit_id', activeUnitId),
      ]);

      const avatarMap = new Map<string, string | null>();
      profiles?.forEach(p => avatarMap.set(p.user_id, p.avatar_url));

      const completionsByUser = new Map<string, Array<{ points_awarded: number; awarded_points?: boolean }>>();
      completions?.forEach(c => {
        const list = completionsByUser.get(c.completed_by) || [];
        list.push({ points_awarded: c.points_awarded, awarded_points: c.awarded_points });
        completionsByUser.set(c.completed_by, list);
      });

      const closingsByUser = new Map<string, number>();
      closings?.filter(c => c.status === 'approved').forEach(c => {
        closingsByUser.set(c.user_id, (closingsByUser.get(c.user_id) || 0) + 1);
      });

      const redemptionsByUser = new Map<string, number>();
      redemptions?.filter(r => r.status === 'approved' || r.status === 'delivered').forEach(r => {
        redemptionsByUser.set(r.user_id, (redemptionsByUser.get(r.user_id) || 0) + 1);
      });

      const result: PerformanceEntry[] = (employees || [])
        .filter(e => e.user_id)
        .map(emp => {
          const uid = emp.user_id!;
          const userCompletions = completionsByUser.get(uid) || [];
          const checklistsCompleted = userCompletions.length;
          const earnedPoints = calculateEarnedPoints(userCompletions);
          const cashClosings = closingsByUser.get(uid) || 0;
          const reds = redemptionsByUser.get(uid) || 0;

          // Score = weighted sum
          const score = earnedPoints * 1 + cashClosings * 5 + reds * 2;

          return {
            employee_id: emp.id,
            full_name: emp.full_name,
            avatar_url: avatarMap.get(uid) || null,
            user_id: uid,
            checklistsCompleted,
            earnedPoints,
            cashClosings,
            redemptions: reds,
            score,
          };
        })
        .sort((a, b) => b.score - a.score);

      return result;
    },
    enabled: !!activeUnitId,
  });

  const maxScore = entries[0]?.score || 1;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <AppIcon name="BarChart3" size={28} className="text-primary" />
        </div>
        <h3 className="font-semibold text-foreground mb-1">Sem dados de performance</h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Vincule funcionários a usuários do sistema para ver suas métricas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'hsl(var(--primary) / 0.15)' }}>
          <AppIcon name="BarChart3" size={18} className="text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">Performance da Equipe</h3>
          <span className="text-[10px] text-muted-foreground">Score baseado em checklists, pontos e fechamentos</span>
        </div>
      </div>

      {entries.map((entry, idx) => (
        <div
          key={entry.employee_id}
          className="card-command p-4 space-y-3"
        >
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-muted-foreground w-5 text-center">{idx + 1}º</span>
            <RankedAvatar avatarUrl={entry.avatar_url} earnedPoints={entry.earnedPoints} size={36} />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold text-foreground truncate block">{entry.full_name}</span>
              <span className="text-[10px] text-muted-foreground">Score: {entry.score}</span>
            </div>
          </div>

          {/* Progress bar */}
          <Progress value={(entry.score / maxScore) * 100} className="h-1.5" />

          {/* Metrics grid */}
          <div className="grid grid-cols-4 gap-2">
            <MetricChip icon="CheckSquare" label="Checklists" value={entry.checklistsCompleted} />
            <MetricChip icon="Star" label="Pontos" value={entry.earnedPoints} />
            <MetricChip icon="Receipt" label="Caixas" value={entry.cashClosings} />
            <MetricChip icon="Gift" label="Resgates" value={entry.redemptions} />
          </div>
        </div>
      ))}
    </div>
  );
}

function MetricChip({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <div className="text-center p-1.5 rounded-lg bg-secondary/40">
      <AppIcon name={icon} size={12} className="text-muted-foreground mx-auto mb-0.5" />
      <span className="text-xs font-bold text-foreground block">{value}</span>
      <span className="text-[8px] text-muted-foreground">{label}</span>
    </div>
  );
}
