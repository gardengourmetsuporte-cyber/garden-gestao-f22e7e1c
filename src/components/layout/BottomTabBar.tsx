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

// Routes where the global bottom tab bar should be hidden
const HIDDEN_ROUTES = ['/finance', '/personal-finance', '/chat'];

export function BottomTabBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasAccess } = useUserModules();
  const moduleStatuses = useModuleStatus();
  const [moreOpen, setMoreOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);

  // Hide on routes that have their own bottom nav
  if (HIDDEN_ROUTES.some(r => location.pathname.startsWith(r))) return null;
  // Hide on tablet/public routes
  if (location.pathname.startsWith('/tablet')) return null;

  // Build visible tabs — replace inaccessible default tabs with fallbacks
  const resolvedTabs: TabDef[] = [];
  const usedKeys = new Set<string>();

  for (const tab of DEFAULT_TABS) {
    if (hasAccess(tab.moduleKey)) {
      resolvedTabs.push(tab);
      usedKeys.add(tab.key);
    } else {
      // Find first available fallback
      const fallback = FALLBACK_TABS.find(f => !usedKeys.has(f.key) && hasAccess(f.moduleKey));
      if (fallback) {
        resolvedTabs.push(fallback);
        usedKeys.add(fallback.key);
      }
    }
  }

  // Left tabs (before +), Right tabs (after +)
  const leftTabs = resolvedTabs.slice(0, 2);
  const rightTabs = resolvedTabs.slice(2);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  // Calculate pill position
  const allSlots = [...leftTabs, { key: '__plus__' } as any, ...rightTabs, { key: '__more__' } as any];
  const activeIdx = allSlots.findIndex(t => t.path && isActive(t.path));
  const slotCount = allSlots.length;

  return createPortal(
    <>
      <MoreDrawer open={moreOpen} onOpenChange={setMoreOpen} />
      <QuickActionSheet open={quickOpen} onOpenChange={setQuickOpen} />

      <nav
        className="fixed bottom-0 left-0 right-0 lg:hidden z-50 bg-card/95 backdrop-blur-2xl border-t border-border/15"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Top glow line */}
        <div className="h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent" />

        <div className="flex items-center justify-around h-16 max-w-lg mx-auto relative">
          {/* Animated pill indicator */}
          {activeIdx >= 0 && (
            <div
              className="absolute bottom-1 h-[3px] rounded-full nav-pill-indicator"
              style={{
                background: 'hsl(var(--primary))',
                boxShadow: '0 0 14px hsl(var(--primary) / 0.5), 0 0 28px hsl(var(--primary) / 0.2)',
                width: '24px',
                left: `calc(${((activeIdx + 0.5) / slotCount) * 100}% - 12px)`,
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
                "absolute -top-5 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300",
                "hover:scale-105 active:scale-90"
              )}
            >
              <div className="absolute inset-0 rounded-full fab-neon-border opacity-60" />
              <div className="absolute inset-[2px] rounded-full bg-card" />
              <AppIcon name="Plus" size={28} className="relative z-10 text-primary" />
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
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all",
              "text-muted-foreground hover:text-foreground"
            )}
          >
            <AppIcon name="Menu" size={24} />
            <span className="text-[10px] font-medium">Mais</span>
          </button>
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
        "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <div className={cn("relative", active && "nav-icon-active")}>
        <AppIcon
          name={tab.icon}
          size={24}
          style={active ? { filter: 'drop-shadow(0 0 6px hsl(var(--primary) / 0.6))' } : undefined}
        />
        {/* Module status badge */}
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
      <span className="text-[10px] font-medium">{tab.label}</span>
    </button>
  );
}
