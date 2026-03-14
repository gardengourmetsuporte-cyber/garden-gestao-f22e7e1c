import { useNavigate } from 'react-router-dom';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { hapticLight } from '@/lib/native';

const actions = [
  { icon: 'point_of_sale', label: 'Fechar Caixa', route: '/cash-closing' },
  { icon: 'receipt_long', label: 'Novo Pedido', route: '/orders' },
  { icon: 'checklist', label: 'Checklist', route: '/checklists' },
  { icon: 'storefront', label: 'Minha Loja', route: '/settings?tab=units' },
] as const;

export function QuickActionsRow() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-4 gap-2">
      {actions.map((action) => (
        <button
          key={action.route}
          onClick={() => { hapticLight(); navigate(action.route); }}
          className={cn(
            "flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl",
            "bg-card/70 border border-border/30",
            "hover:bg-muted/50 active:scale-[0.95] transition-all duration-200",
            "touch-manipulation"
          )}
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <AppIcon name={action.icon} size={20} className="text-primary" />
          </div>
          <span className="text-[10px] font-medium text-muted-foreground leading-tight text-center">
            {action.label}
          </span>
        </button>
      ))}
    </div>
  );
}
