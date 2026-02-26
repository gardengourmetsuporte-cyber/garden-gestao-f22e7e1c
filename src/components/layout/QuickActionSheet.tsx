import { useNavigate } from 'react-router-dom';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { AppIcon } from '@/components/ui/app-icon';
import { useUserModules } from '@/hooks/useAccessLevels';

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
      icon: 'CalendarPlus',
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
      icon: 'PackagePlus',
      label: 'Movimentar Estoque',
      description: 'Entrada ou saída rápida',
      color: 'hsl(var(--neon-purple))',
      glow: 'hsl(var(--neon-purple) / 0.2)',
      action: () => go('/inventory?action=move'),
      moduleKey: 'inventory',
    },
  ];

  const visibleActions = actions.filter(a => hasAccess(a.moduleKey));

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="px-4 pb-8 pt-2">
        <h3 className="text-sm font-bold text-muted-foreground/60 uppercase tracking-wider mb-3 px-1 font-display">
          Ação rápida
        </h3>
        <div className="space-y-2">
          {visibleActions.map(action => (
            <button
              key={action.label}
              onClick={action.action}
              className="flex items-center gap-4 w-full px-4 py-3.5 rounded-2xl bg-secondary/50 hover:bg-secondary active:scale-[0.98] transition-all group"
            >
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-shadow duration-200"
                style={{
                  background: `linear-gradient(135deg, ${action.glow}, transparent)`,
                  border: `1px solid ${action.color}25`,
                  boxShadow: `0 0 0 0 ${action.color}00`,
                }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 0 16px ${action.color}20`)}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = `0 0 0 0 ${action.color}00`)}
              >
                <AppIcon name={action.icon} size={22} style={{ color: action.color }} />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">{action.label}</p>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>
            </button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
