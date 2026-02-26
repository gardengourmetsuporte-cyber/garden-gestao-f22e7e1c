import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { useUserModules } from '@/hooks/useAccessLevels';
import { useModuleStatus } from '@/hooks/useModuleStatus';
import { MoreDrawer } from './MoreDrawer';
import { QuickActionSheet } from './QuickActionSheet';

interface TabDef {
  key: string;
  icon: string;
  label: string;
  path: string;
  moduleKey: string;
}

const DEFAULT_TABS: TabDef[] = [
  { key: 'home', icon: 'Home', label: 'Início', path: '/', moduleKey: 'dashboard' },
  { key: 'checklists', icon: 'ClipboardCheck', label: 'Checklists', path: '/checklists', moduleKey: 'checklists' },
  // center slot is the "+" button — not in this array
  { key: 'inventory', icon: 'Package', label: 'Estoque', path: '/inventory', moduleKey: 'inventory' },
];

const FALLBACK_TABS: TabDef[] = [
  { key: 'finance', icon: 'DollarSign', label: 'Financeiro', path: '/finance', moduleKey: 'finance' },
  { key: 'agenda', icon: 'CalendarDays', label: 'Agenda', path: '/agenda', moduleKey: 'agenda' },
  { key: 'employees', icon: 'Users', label: 'Equipe', path: '/employees', moduleKey: 'employees' },
  { key: 'recipes', icon: 'ChefHat', label: 'Fichas', path: '/recipes', moduleKey: 'recipes' },
  { key: 'cash-closing', icon: 'Receipt', label: 'Fechamento', path: '/cash-closing', moduleKey: 'cash-closing' },
];

const HIDDEN_ROUTES = ['/finance', '/personal-finance', '/chat'];

export function BottomTabBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasAccess } = useUserModules();
  const moduleStatuses = useModuleStatus();
  const [moreOpen, setMoreOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);

  if (HIDDEN_ROUTES.some(r => location.pathname.startsWith(r))) return null;
  if (location.pathname.startsWith('/tablet')) return null;

  const resolvedTabs: TabDef[] = [];
  const usedKeys = new Set<string>();

  for (const tab of DEFAULT_TABS) {
    if (hasAccess(tab.moduleKey)) {
      resolvedTabs.push(tab);
      usedKeys.add(tab.key);
    } else {
      const fallback = FALLBACK_TABS.find(f => !usedKeys.has(f.key) && hasAccess(f.moduleKey));
      if (fallback) {
        resolvedTabs.push(fallback);
        usedKeys.add(fallback.key);
      }
    }
  }

  const leftTabs = resolvedTabs.slice(0, 2);
  const rightTabs = resolvedTabs.slice(2);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const allSlots = [...leftTabs, { key: '__plus__' } as any, ...rightTabs, { key: '__more__' } as any];
  const activeIdx = allSlots.findIndex(t => t.path && isActive(t.path));
  const slotCount = allSlots.length;

  return createPortal(
    <>
      <MoreDrawer open={moreOpen} onOpenChange={setMoreOpen} />
      <QuickActionSheet open={quickOpen} onOpenChange={setQuickOpen} />

      <nav
        className="fixed bottom-0 left-0 right-0 lg:hidden z-50"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div
          className="mx-4 mb-3 rounded-[28px] glass-border"
          style={{
            background: 'hsl(var(--card) / 0.7)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            boxShadow: 'var(--shadow-floating)',
          }}
        >
          <div className="flex items-center justify-around h-[60px] max-w-lg mx-auto relative px-2">
            {/* Highlight pill behind active tab */}
            {activeIdx >= 0 && (
              <div
                className="absolute nav-highlight-pill rounded-2xl"
                style={{
                  background: 'hsl(var(--primary) / 0.1)',
                  border: '1px solid hsl(var(--primary) / 0.15)',
                  width: '48px',
                  height: '40px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  left: `calc(${((activeIdx + 0.5) / slotCount) * 100}% - 24px)`,
                }}
              />
            )}

            {/* Left tabs */}
            {leftTabs.map(tab => (
              <TabButton
                key={tab.key}
                tab={tab}
                active={isActive(tab.path)}
                moduleStatus={moduleStatuses[tab.path]}
                onClick={() => navigate(tab.path)}
              />
            ))}

            {/* Center FAB "+" */}
            <div className="flex-1 flex items-center justify-center">
              <button
                onClick={() => { navigator.vibrate?.(10); setQuickOpen(true); }}
                className={cn(
                  "absolute -top-4 w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300",
                  "hover:scale-105 active:scale-90"
                )}
                style={{
                  background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))',
                  boxShadow: '0 4px 16px hsl(var(--primary) / 0.35)',
                }}
              >
                <AppIcon name="Plus" size={26} className="relative z-10 text-primary-foreground" />
              </button>
            </div>

            {/* Right tabs */}
            {rightTabs.map(tab => (
              <TabButton
                key={tab.key}
                tab={tab}
                active={isActive(tab.path)}
                moduleStatus={moduleStatuses[tab.path]}
                onClick={() => navigate(tab.path)}
              />
            ))}

            {/* "Mais" tab */}
            <button
              onClick={() => { navigator.vibrate?.(10); setMoreOpen(true); }}
              className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-all text-muted-foreground hover:text-foreground"
            >
              <AppIcon name="Menu" size={22} />
            </button>
          </div>
        </div>
      </nav>
    </>,
    document.body
  );
}

function TabButton({
  tab,
  active,
  moduleStatus,
  onClick,
}: {
  tab: TabDef;
  active: boolean;
  moduleStatus?: { level: string; count: number } | null;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-all relative z-10",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <div className={cn("relative", active && "nav-icon-active")}>
        <AppIcon name={tab.icon} size={22} />
        {moduleStatus && moduleStatus.level !== 'ok' && moduleStatus.count > 0 && (
          <span
            className={cn(
              "absolute -top-1.5 -right-2.5 min-w-[16px] h-[16px] rounded-full text-[9px] font-bold flex items-center justify-center",
              (moduleStatus.level === 'critical' || moduleStatus.level === 'warning') && "animate-pulse"
            )}
            style={{
              background: moduleStatus.level === 'critical' ? 'hsl(var(--neon-red))' : 'hsl(var(--neon-amber))',
              color: moduleStatus.level === 'critical' ? '#fff' : '#000',
              border: '2px solid hsl(var(--card))',
            }}
          >
            {moduleStatus.count > 9 ? '9+' : moduleStatus.count}
          </span>
        )}
      </div>
      {active && <span className="text-[10px] font-semibold">{tab.label}</span>}
    </button>
  );
}
