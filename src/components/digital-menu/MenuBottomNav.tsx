import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';

export type MenuTab = 'menu' | 'search' | 'cart' | 'game';

interface Props {
  active: MenuTab;
  onTabChange: (tab: MenuTab) => void;
  cartCount: number;
}

const tabs: { key: MenuTab; icon: string; label: string }[] = [
  { key: 'menu', icon: 'UtensilsCrossed', label: 'Cardápio' },
  { key: 'search', icon: 'Search', label: 'Busca' },
  { key: 'cart', icon: 'ShoppingBag', label: 'Pedido' },
  { key: 'game', icon: 'Dices', label: 'Roleta' },
];

export function MenuBottomNav({ active, onTabChange, cartCount }: Props) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-card/90 backdrop-blur-xl border-t border-border/50 safe-area-pb">
      <div className="flex items-center justify-around max-w-lg mx-auto h-14">
        {tabs.map(tab => {
          const isActive = active === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={cn(
                'flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-colors relative',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <div className="relative">
                <AppIcon name={tab.icon} size={22} />
                {tab.key === 'cart' && cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
