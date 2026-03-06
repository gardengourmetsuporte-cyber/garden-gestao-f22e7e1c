import { useNavigate } from 'react-router-dom';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import type { DashboardStats } from '@/hooks/useDashboardStats';

interface ContextPillProps {
  icon: string;
  label: string;
  value: number;
  color: string;
  onClick: () => void;
}

function ContextPill({ icon, label, value, color, onClick }: ContextPillProps) {
  if (value <= 0) return null;
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-xl px-3 py-2 min-w-fit",
        "bg-muted/40 backdrop-blur-md border border-border/30",
        "hover:bg-muted/60 active:scale-[0.97] transition-all duration-200"
      )}
    >
      <span
        className="flex items-center justify-center w-7 h-7 rounded-lg"
        style={{ backgroundColor: `${color}20` }}
      >
        <AppIcon name={icon} size={16} style={{ color }} />
      </span>
      <div className="flex flex-col items-start">
        <span className="text-sm font-bold text-foreground leading-tight">{value}</span>
        <span className="text-[10px] text-muted-foreground leading-tight">{label}</span>
      </div>
    </button>
  );
}

interface DashboardContextBarProps {
  firstName: string;
  stats: DashboardStats;
}

export function DashboardContextBar({ firstName, stats }: DashboardContextBarProps) {
  const navigate = useNavigate();

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  })();

  const pills = [
    {
      icon: 'Receipt',
      label: 'contas',
      value: stats.billsDueSoon?.length ?? 0,
      color: 'hsl(var(--warning, 38 92% 50%))',
      path: '/finance',
    },
    {
      icon: 'Checklist',
      label: 'checklists',
      value: stats.pendingClosings,
      color: 'hsl(var(--primary))',
      path: '/checklists',
    },
    {
      icon: 'ShoppingBag',
      label: 'pedidos',
      value: stats.pendingOrders,
      color: 'hsl(210 80% 55%)',
      path: '/orders',
    },
    {
      icon: 'Inventory2',
      label: 'estoque crítico',
      value: stats.criticalItems,
      color: 'hsl(0 72% 51%)',
      path: '/inventory',
    },
  ];

  const hasAnyPill = pills.some(p => p.value > 0);

  return (
    <div className="flex flex-col gap-2">
      <h2
        className="text-base font-extrabold text-foreground font-display"
        style={{ letterSpacing: '-0.03em' }}
      >
        {greeting}, {firstName} <span className="animate-wave-hand">👋</span>
      </h2>

      {hasAnyPill && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
          {pills.map((pill) => (
            <ContextPill
              key={pill.icon}
              icon={pill.icon}
              label={pill.label}
              value={pill.value}
              color={pill.color}
              onClick={() => navigate(pill.path)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
