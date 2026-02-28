import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';

export type MenuTab = 'home' | 'menu' | 'cart' | 'game';

interface Props {
  active: MenuTab;
  onTabChange: (tab: MenuTab) => void;
  cartCount: number;
}

const tabs: { key: MenuTab; icon: string; iconFilled: string; label: string }[] = [
  { key: 'home', icon: 'Storefront', iconFilled: 'Storefront', label: 'Início' },
  { key: 'menu', icon: 'RestaurantMenu', iconFilled: 'RestaurantMenu', label: 'Cardápio' },
  { key: 'cart', icon: 'ShoppingBag', iconFilled: 'ShoppingBag', label: 'Pedido' },
  { key: 'game', icon: 'Casino', iconFilled: 'Casino', label: 'Roleta' },
];

export function MenuBottomNav({ active, onTabChange, cartCount }: Props) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 pointer-events-none" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="mx-4 mb-3 pointer-events-auto">
        <div className="rounded-full shadow-[0_4px_30px_rgba(0,0,0,0.4)]" style={{ background: 'rgba(26,26,26,0.92)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)' }}>
          <div className="flex items-center justify-around h-[64px]">
            {tabs.map(tab => {
              const isActive = active === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => onTabChange(tab.key)}
                  className={cn(
                    'flex flex-col items-center gap-0.5 py-1.5 px-4 rounded-xl transition-all relative',
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground active:scale-95'
                  )}
                >
                  <div className="relative">
                    <AppIcon name={isActive ? tab.iconFilled : tab.icon} size={22} fill={isActive ? 1 : 0} />
                    {tab.key === 'cart' && cartCount > 0 && (
                      <span className="absolute -top-1.5 -right-3 min-w-[18px] h-[18px] bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                        {cartCount > 9 ? '9+' : cartCount}
                      </span>
                    )}
                  </div>
                  <span className={cn('text-[10px]', isActive ? 'font-bold' : 'font-medium')}>
                    {tab.label}
                  </span>
                  {isActive && (
                    <span className="absolute -bottom-0 w-5 h-[3px] rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}