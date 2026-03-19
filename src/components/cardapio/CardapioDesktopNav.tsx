import { useSearchParams } from 'react-router-dom';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', params: {} },
  { id: 'produtos', label: 'Produtos', icon: 'Package', params: { tab: 'produtos' } },
  { id: 'pedidos', label: 'Pedidos', icon: 'Receipt', params: { tab: 'pedidos' } },
  { id: 'config', label: 'Configurações', icon: 'Settings', params: { section: 'config' } },
] as const;

export function CardapioDesktopNav() {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get('section') === 'config'
    ? 'config'
    : searchParams.get('tab') || 'dashboard';

  const handleTab = (tab: typeof TABS[number]) => {
    setSearchParams(tab.params as Record<string, string>);
  };

  return (
    <div className="hidden lg:flex items-center gap-1 px-6 py-2 border-b border-border/40 bg-background/80 backdrop-blur-sm">
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => handleTab(tab)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            activeTab === tab.id
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <AppIcon name={tab.icon} size={16} />
          {tab.label}
        </button>
      ))}
    </div>
  );
}
