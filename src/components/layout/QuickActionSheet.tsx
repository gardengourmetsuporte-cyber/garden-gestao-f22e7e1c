import { useNavigate } from 'react-router-dom';
import { AppIcon } from '@/components/ui/app-icon';
import { useUserModules } from '@/hooks/useAccessLevels';
import { cn } from '@/lib/utils';

interface QuickActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface QuickAction {
  icon: string;
  label: string;
  description: string;
  color: string;
  glow: string;
  action: () => void;
  moduleKey: string;
}

export function QuickActionSheet({ open, onOpenChange }: QuickActionSheetProps) {
  const navigate = useNavigate();
  const { hasAccess } = useUserModules();

  const go = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  const actions: QuickAction[] = [
    {
      icon: 'ArrowUpCircle',
      label: 'Nova Receita',
      description: 'Adicionar entrada financeira',
      color: 'hsl(var(--neon-green))',
      glow: 'hsl(var(--neon-green) / 0.2)',
      action: () => go('/finance?action=income'),
      moduleKey: 'finance',
    },
    {
      icon: 'ArrowDownCircle',
      label: 'Nova Despesa',
      description: 'Registrar saída financeira',
      color: 'hsl(var(--neon-red))',
      glow: 'hsl(var(--neon-red) / 0.2)',
      action: () => go('/finance?action=expense'),
      moduleKey: 'finance',
    },
    {
      icon: 'CalendarDays',
      label: 'Nova Tarefa',
      description: 'Criar tarefa na agenda',
      color: 'hsl(var(--neon-cyan))',
      glow: 'hsl(var(--neon-cyan) / 0.2)',
      action: () => go('/agenda?action=new'),
      moduleKey: 'agenda',
    },
    {
      icon: 'Receipt',
      label: 'Novo Fechamento',
      description: 'Registrar fechamento de caixa',
      color: 'hsl(var(--neon-amber))',
      glow: 'hsl(var(--neon-amber) / 0.2)',
      action: () => go('/cash-closing?action=new'),
      moduleKey: 'cash-closing',
    },
    {
      icon: 'Package',
      label: 'Movimentar Estoque',
      description: 'Entrada ou saída rápida',
      color: 'hsl(var(--neon-purple))',
      glow: 'hsl(var(--neon-purple) / 0.2)',
      action: () => go('/inventory?action=move'),
      moduleKey: 'inventory',
    },
  ];

  const visibleActions = actions.filter(a => hasAccess(a.moduleKey));

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[55] bg-black/40 backdrop-blur-[2px] animate-fade-in"
        onClick={() => onOpenChange(false)}
      />

      {/* Panel above bottom bar */}
      <div
        className="fixed left-0 right-0 z-[58] px-3 animate-[slideUpFade_0.3s_ease-out]"
        style={{ bottom: 'calc(64px + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="bg-card/95 backdrop-blur-xl rounded-2xl border border-border/20 shadow-2xl p-4 max-w-lg mx-auto">
          <h3 className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-wider mb-3 px-1">
            Ação rápida
          </h3>
          <div className="space-y-1.5">
            {visibleActions.map((action, i) => (
              <button
                key={action.label}
                onClick={() => { navigator.vibrate?.(10); action.action(); }}
                className="flex items-center gap-3.5 w-full px-3 py-3 rounded-xl bg-secondary/40 hover:bg-secondary/70 active:scale-[0.98] transition-all group opacity-0 animate-[slideUpFade_0.3s_ease-out_forwards]"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-105"
                  style={{
                    background: `linear-gradient(135deg, ${action.glow}, transparent)`,
                    border: `1px solid ${action.color}25`,
                  }}
                >
                  <AppIcon name={action.icon} size={20} style={{ color: action.color }} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">{action.label}</p>
                  <p className="text-[11px] text-muted-foreground">{action.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
