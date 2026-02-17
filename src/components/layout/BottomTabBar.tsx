import { useLocation, useNavigate } from 'react-router-dom';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';

interface TabItem {
  icon: string;
  label: string;
  href: string;
  /** If true, this tab triggers the launcher instead of navigating */
  isLauncher?: boolean;
}

const tabs: TabItem[] = [
  { icon: 'Home', label: 'Início', href: '/' },
  { icon: 'ClipboardCheck', label: 'Checklists', href: '/checklists' },
  { icon: 'DollarSign', label: 'Financeiro', href: '/finance' },
  { icon: 'Grip', label: 'Mais', href: '', isLauncher: true },
];

interface BottomTabBarProps {
  onOpenLauncher: () => void;
}

export function BottomTabBar({ onOpenLauncher }: BottomTabBarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  // Don't show on pages that have their own bottom nav
  const hiddenPaths = ['/finance', '/chat'];
  if (hiddenPaths.includes(location.pathname)) return null;

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-[9997] bg-card/95 backdrop-blur-xl border-t border-border/30"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const isActive = !tab.isLauncher && location.pathname === tab.href;

          return (
            <button
              key={tab.label}
              onClick={() => {
                if (tab.isLauncher) {
                  onOpenLauncher();
                } else {
                  navigate(tab.href);
                }
              }}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <AppIcon
                name={tab.icon}
                size={20}
                className={cn(isActive && "drop-shadow-[0_0_6px_hsl(var(--primary)/0.5)]")}
              />
              <span className="text-[10px] font-medium leading-none">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
