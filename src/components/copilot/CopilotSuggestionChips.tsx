import { AppIcon } from '@/components/ui/app-icon';

const SUGGESTIONS = [
  { label: 'Resumo do dia', icon: 'BarChart3' as const },
  { label: 'Despesas pendentes', icon: 'Clock' as const },
  { label: 'Estoque baixo', icon: 'AlertTriangle' as const },
  { label: 'Tarefas de hoje', icon: 'CheckSquare' as const },
  { label: 'Boletos vencendo', icon: 'FileText' as const },
  { label: 'Criar tarefa', icon: 'Plus' as const },
];

interface CopilotSuggestionChipsProps {
  onChipClick: (text: string) => void;
}

export default function CopilotSuggestionChips({ onChipClick }: CopilotSuggestionChipsProps) {
  return (
    <div className="flex flex-wrap gap-2 pt-2">
      {SUGGESTIONS.map((s) => (
        <button
          key={s.label}
          onClick={() => onChipClick(s.label)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-secondary/70 hover:bg-secondary text-foreground border border-border/30 transition-colors"
        >
          <AppIcon name={s.icon} size={12} className="text-primary" />
          {s.label}
        </button>
      ))}
    </div>
  );
}
