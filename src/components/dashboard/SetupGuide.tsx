import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppIcon } from '@/components/ui/app-icon';
import { Progress } from '@/components/ui/progress';
import { useSetupProgress } from '@/hooks/useSetupProgress';
import { cn } from '@/lib/utils';

const DISMISSED_KEY = 'bosst-setup-guide-dismissed';

export function SetupGuide() {
  const navigate = useNavigate();
  const { steps, completedCount, totalCount, allCompleted, progress, isLoading } = useSetupProgress();
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISSED_KEY) === 'true');

  if (dismissed || isLoading || totalCount === 0) return null;

  if (allCompleted) {
    return (
      <div className="card-command p-5 animate-slide-up stagger-2">
        <div className="flex items-center gap-3">
          <div className="icon-glow icon-glow-md" style={{ backgroundColor: 'hsl(var(--neon-green) / 0.12)', borderColor: 'hsl(var(--neon-green) / 0.3)', color: 'hsl(var(--neon-green))' }}>
            <AppIcon name="PartyPopper" size={22} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Configuração completa! 🎉</p>
            <p className="text-[11px] text-muted-foreground">Seu sistema está pronto para uso.</p>
          </div>
          <button
            onClick={() => { localStorage.setItem(DISMISSED_KEY, 'true'); setDismissed(true); }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Dispensar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card-command p-5 animate-slide-up stagger-2">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AppIcon name="Rocket" size={18} className="text-primary" />
          <span className="text-sm font-semibold text-foreground">Guia de Configuração</span>
        </div>
        <span className="text-[11px] font-medium text-muted-foreground">{completedCount}/{totalCount}</span>
      </div>

      <Progress value={progress} className="h-2 mb-4 bg-secondary" />

      <div className="space-y-2">
        {steps.map(step => (
          <button
            key={step.key}
            onClick={() => !step.completed && navigate(step.route)}
            disabled={step.completed}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all",
              step.completed
                ? "opacity-50"
                : "hover:bg-secondary/50 active:scale-[0.98]"
            )}
          >
            <div className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center shrink-0 border",
              step.completed
                ? "bg-primary/15 border-primary/30 text-primary"
                : "bg-secondary border-border/50 text-muted-foreground"
            )}>
              {step.completed ? (
                <AppIcon name="Check" size={14} />
              ) : (
                <AppIcon name={step.icon} size={14} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn("text-xs font-medium", step.completed ? "line-through text-muted-foreground" : "text-foreground")}>
                {step.label}
              </p>
              {!step.completed && (
                <p className="text-[10px] text-muted-foreground">{step.description}</p>
              )}
            </div>
            {!step.completed && (
              <AppIcon name="ChevronRight" size={14} className="text-muted-foreground shrink-0" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
