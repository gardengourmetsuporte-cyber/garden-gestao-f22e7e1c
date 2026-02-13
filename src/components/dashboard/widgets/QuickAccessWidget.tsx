import { useNavigate } from 'react-router-dom';
import {
  Wallet, ChefHat, CalendarDays, Package, ClipboardCheck, Receipt, Gift, Settings
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const adminItems = [
  { to: '/finance', icon: Wallet, label: 'Financeiro', bg: 'bg-success/10', color: 'text-success' },
  { to: '/recipes', icon: ChefHat, label: 'Fichas', bg: 'bg-purple-500/10', color: 'text-purple-500' },
  { to: '/agenda', icon: CalendarDays, label: 'Agenda', bg: 'bg-primary/10', color: 'text-primary' },
  { to: '/inventory', icon: Package, label: 'Estoque', bg: 'bg-primary/10', color: 'text-primary' },
];

const employeeItems = [
  { to: '/checklists', icon: ClipboardCheck, label: 'Checklists', bg: 'bg-success/10', color: 'text-success' },
  { to: '/cash-closing', icon: Receipt, label: 'Caixa', bg: 'bg-primary/10', color: 'text-primary' },
  { to: '/rewards', icon: Gift, label: 'Prêmios', bg: 'bg-warning/10', color: 'text-warning' },
  { to: '/inventory', icon: Package, label: 'Estoque', bg: 'bg-primary/10', color: 'text-primary' },
];

export function QuickAccessWidget() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const items = isAdmin ? adminItems : employeeItems;

  return (
    <div className="card-command p-3 h-full flex flex-col">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">Atalhos</p>
      <div className="grid grid-cols-2 gap-2 flex-1">
        {items.map((item) => (
          <div
            key={item.to}
            onClick={() => navigate(item.to)}
            className="flex flex-col items-center justify-center cursor-pointer hover:scale-[1.02] active:scale-[0.97] transition-all rounded-xl bg-secondary/30"
          >
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-1", item.bg)}>
              <item.icon className={cn("w-4 h-4", item.color)} />
            </div>
            <p className="font-medium text-[10px] text-foreground">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
