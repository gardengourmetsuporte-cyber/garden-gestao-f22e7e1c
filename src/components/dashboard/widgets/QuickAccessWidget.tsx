import { useNavigate } from 'react-router-dom';
import {
  Wallet, ChefHat, CalendarDays, Package, ClipboardCheck, Receipt, Gift, Settings
} from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const adminItems = [
  { to: '/finance', icon: Wallet, label: 'Financeiro', sub: 'Receitas e despesas', bg: 'bg-success/10', color: 'text-success' },
  { to: '/recipes', icon: ChefHat, label: 'Fichas', sub: '', bg: 'bg-purple-500/10', color: 'text-purple-500' },
  { to: '/agenda', icon: CalendarDays, label: 'Agenda', sub: 'Tarefas', bg: 'bg-primary/10', color: 'text-primary' },
  { to: '/inventory', icon: Package, label: 'Estoque', sub: '', bg: 'bg-primary/10', color: 'text-primary' },
  { to: '/checklists', icon: ClipboardCheck, label: 'Checklists', sub: 'Tarefas diárias', bg: 'bg-success/10', color: 'text-success' },
  { to: '/cash-closing', icon: Receipt, label: 'Fechamento', sub: '', bg: 'bg-primary/10', color: 'text-primary' },
  { to: '/rewards', icon: Gift, label: 'Recompensas', sub: '', bg: 'bg-warning/10', color: 'text-warning' },
  { to: '/settings', icon: Settings, label: 'Config.', sub: '', bg: 'bg-secondary', color: 'text-secondary-foreground' },
];

const employeeItems = [
  { to: '/checklists', icon: ClipboardCheck, label: 'Checklists', sub: 'Ganhe pontos', bg: 'bg-success/10', color: 'text-success' },
  { to: '/cash-closing', icon: Receipt, label: 'Caixa', sub: 'Fechamento', bg: 'bg-primary/10', color: 'text-primary' },
  { to: '/rewards', icon: Gift, label: 'Recompensas', sub: 'Troque', bg: 'bg-warning/10', color: 'text-warning' },
  { to: '/inventory', icon: Package, label: 'Estoque', sub: 'Ver itens', bg: 'bg-primary/10', color: 'text-primary' },
];

export function QuickAccessWidget() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { stats } = useDashboardStats();
  const items = isAdmin ? adminItems : employeeItems;

  return (
    <div>
      {isAdmin && <h3 className="section-label mb-2">Acesso Rápido</h3>}
      <div className="grid grid-cols-3 gap-2.5">
        {items.map((item, idx) => {
          let sub = item.sub;
          if (isAdmin) {
            if (item.to === '/recipes') sub = `${stats.recipesCount} receitas`;
            if (item.to === '/inventory') sub = `${stats.itemsCount} itens`;
            if (item.to === '/cash-closing') sub = stats.pendingClosings > 0 ? `${stats.pendingClosings} pendentes` : 'Caixas';
            if (item.to === '/rewards') sub = stats.pendingRedemptions > 0 ? `${stats.pendingRedemptions} pendentes` : 'Prêmios';
            if (item.to === '/settings') sub = `${stats.usersCount} usuários`;
          }
          return (
            <div
              key={item.to}
              onClick={() => navigate(item.to)}
              className="card-command-info p-4 flex flex-col items-center text-center cursor-pointer hover:scale-[1.02] active:scale-[0.97] transition-all"
            >
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-2", item.bg)}>
                <item.icon className={cn("w-5 h-5", item.color)} />
              </div>
              <p className="font-semibold text-xs text-foreground">{item.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
