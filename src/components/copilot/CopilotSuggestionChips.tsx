import { AppIcon } from '@/components/ui/app-icon';
import type { CopilotContextStats } from '@/hooks/useManagementAI';

const DEFAULT_CHIPS = [
  { label: 'Resumo do dia', icon: 'BarChart3' as const, badge: undefined as number | undefined },
  { label: 'Despesas pendentes', icon: 'Clock' as const, badge: undefined as number | undefined },
  { label: 'Estoque baixo', icon: 'AlertTriangle' as const, badge: undefined as number | undefined },
  { label: 'Tarefas de hoje', icon: 'ListChecks' as const, badge: undefined as number | undefined },
  { label: 'Boletos vencendo', icon: 'FileText' as const, badge: undefined as number | undefined },
  { label: 'Criar tarefa', icon: 'Plus' as const, badge: undefined as number | undefined },
];

interface CopilotSuggestionChipsProps {
  onChipClick: (text: string) => void;
  contextStats?: CopilotContextStats | null;
}

export default function CopilotSuggestionChips({ onChipClick, contextStats }: CopilotSuggestionChipsProps) {
  const chips = contextStats ? buildDynamicChips(contextStats) : DEFAULT_CHIPS;

  return (
    <div className="flex flex-wrap gap-2 pt-2">
      {chips.map((s) => (
        <button
          key={s.label}
          onClick={() => onChipClick(s.label)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-secondary/70 hover:bg-secondary text-foreground border border-border/30 transition-colors"
        >
          <AppIcon name={s.icon} size={12} className="text-primary" />
          {s.label}
          {s.badge !== undefined && s.badge > 0 && (
            <span className="ml-0.5 bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none">
              {s.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function buildDynamicChips(stats: CopilotContextStats) {
  const chips: { label: string; icon: any; badge?: number }[] = [];

  chips.push({ label: 'Resumo do dia', icon: 'BarChart3' });

  if (stats.pendingExpensesCount > 0) {
    chips.push({ label: 'Despesas pendentes', icon: 'Clock', badge: stats.pendingExpensesCount });
  } else {
    chips.push({ label: 'Despesas pendentes', icon: 'Clock' });
  }

  if (stats.lowStockCount > 0) {
    chips.push({ label: 'Estoque baixo', icon: 'AlertTriangle', badge: stats.lowStockCount });
  }

  if (stats.pendingTasksCount > 0) {
    chips.push({ label: 'Tarefas de hoje', icon: 'ListChecks', badge: stats.pendingTasksCount });
  } else {
    chips.push({ label: 'Criar tarefa', icon: 'Plus' });
  }

  if (stats.upcomingInvoicesCount > 0) {
    chips.push({ label: 'Boletos vencendo', icon: 'FileText', badge: stats.upcomingInvoicesCount });
  }

  if (stats.checklistPct > 0 && stats.checklistPct < 100) {
    chips.push({ label: `Checklist ${stats.checklistPct}% feito`, icon: 'CheckSquare' });
  }

  if (chips.length < 4) {
    chips.push({ label: 'Criar tarefa', icon: 'Plus' });
  }

  return chips.slice(0, 6);
}
