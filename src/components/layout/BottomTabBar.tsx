import { useState, useRef, useEffect, useCallback, forwardRef } from 'react';
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
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [pillStyle, setPillStyle] = useState<{ left: number; width: number } | null>(null);

  const isHidden = HIDDEN_ROUTES.some(r => location.pathname.startsWith(r)) || location.pathname.startsWith('/tablet');

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

  const activeKey = resolvedTabs.find(t => isActive(t.path))?.key ?? null;

  const updatePill = useCallback(() => {
    if (!activeKey || !containerRef.current) {
      setPillStyle(null);
      return;
    }
    const activeEl = tabRefs.current[activeKey];
    if (!activeEl) { setPillStyle(null); return; }
    const containerRect = containerRef.current.getBoundingClientRect();
    const tabRect = activeEl.getBoundingClientRect();
    setPillStyle({
      left: tabRect.left - containerRect.left + (tabRect.width - 48) / 2,
      width: 48,
    });
  }, [activeKey]);

  useEffect(() => {
    updatePill();
    const t = setTimeout(updatePill, 100);
    window.addEventListener('resize', updatePill);
    return () => { window.removeEventListener('resize', updatePill); clearTimeout(t); };
  }, [updatePill]);

  if (isHidden) return null;

  return createPortal(
    <>
      <MoreDrawer open={moreOpen} onOpenChange={setMoreOpen} />
      <QuickActionSheet open={quickOpen} onOpenChange={setQuickOpen} />

      <nav
        className="fixed bottom-0 left-0 right-0 lg:hidden z-50"
      >
        {/* Top neon glow line — only on top edge */}
        <div
          className="absolute top-0 left-[8%] right-[8%] h-[1px]"
          style={{
            background: 'linear-gradient(90deg, transparent, hsl(var(--primary) / 0.9), hsl(var(--accent) / 0.7), hsl(var(--primary) / 0.9), transparent)',
          }}
        />
        <div
          className="absolute -top-[1px] left-[3%] right-[3%] h-[4px] blur-[6px]"
          style={{
            background: 'linear-gradient(90deg, transparent, hsl(var(--primary) / 0.6), hsl(var(--accent) / 0.4), hsl(var(--primary) / 0.6), transparent)',
          }}
        />
        <div
          className="absolute -top-[3px] left-[12%] right-[12%] h-[8px] blur-[12px]"
          style={{
            background: 'linear-gradient(90deg, transparent, hsl(var(--primary) / 0.35), hsl(var(--accent) / 0.25), hsl(var(--primary) / 0.35), transparent)',
          }}
        />

        {/* Bar background — full width, edge to edge */}
        <div
          className="relative"
          style={{
            background: 'hsl(var(--background))',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          <div ref={containerRef} className="flex items-center h-[68px] max-w-lg mx-auto relative">
            {/* No pill — active state is icon glow only */}

            {/* Left tabs */}
            {leftTabs.map(tab => (
              <TabButton
                key={tab.key}
                ref={(el) => { tabRefs.current[tab.key] = el; }}
                tab={tab}
                active={isActive(tab.path)}
                moduleStatus={moduleStatuses[tab.path]}
                onClick={() => navigate(tab.path)}
              />
            ))}

            {/* Center FAB "+" — round */}
            <div className="flex items-center justify-center" style={{ width: '20%' }}>
              <button
                onClick={() => { navigator.vibrate?.(10); setQuickOpen(true); }}
                className={cn(
                  "absolute -top-7 w-[56px] h-[56px] rounded-full flex items-center justify-center transition-all duration-300",
                  "hover:scale-105 active:scale-90"
                )}
                style={{
                  background: 'var(--gradient-brand)',
                  boxShadow: '0 0 24px hsl(220 85% 58% / 0.5), 0 0 48px hsl(262 70% 55% / 0.25), 0 4px 12px hsl(0 0% 0% / 0.5)',
                }}
              >
                <AppIcon name="Plus" size={28} className="relative z-10 text-primary-foreground" />
              </button>
            </div>

            {/* Right tabs */}
            {rightTabs.map(tab => (
              <TabButton
                key={tab.key}
                ref={(el) => { tabRefs.current[tab.key] = el; }}
                tab={tab}
                active={isActive(tab.path)}
                moduleStatus={moduleStatuses[tab.path]}
                onClick={() => navigate(tab.path)}
              />
            ))}

            {/* "Mais" tab */}
            <button
              onClick={() => { navigator.vibrate?.(10); setMoreOpen(true); }}
              className="flex flex-col items-center justify-center h-full gap-0.5 transition-all relative z-10"
              style={{ width: '20%' }}
            >
              <AppIcon name="Menu" size={22} fill={0} className="text-muted-foreground transition-colors" />
              <span className="text-[10px] font-normal text-muted-foreground">Mais</span>
            </button>
          </div>
        </div>
      </nav>
    </>,
    document.body
  );
}

const TabButton = forwardRef<
  HTMLButtonElement,
  {
    tab: TabDef;
    active: boolean;
    moduleStatus?: { level: string; count: number } | null;
    onClick: () => void;
  }
>(({ tab, active, moduleStatus, onClick }, ref) => {
  return (
    <button
      ref={ref}
      onClick={() => {
        navigator.vibrate?.(10);
        onClick();
      }}
      className={cn(
        "flex flex-col items-center justify-center h-full gap-0.5 transition-all relative z-10",
        active ? "text-primary" : "text-muted-foreground"
      )}
      style={{ width: '20%' }}
    >
      <div className={cn("relative transition-transform duration-300", active && "scale-110")}
        style={active ? { filter: 'drop-shadow(0 0 8px hsl(220 85% 58% / 0.6))' } : undefined}
      >
        <AppIcon
          name={tab.icon}
          size={22}
          fill={active ? 1 : 0}
          weight={active ? 600 : 400}
        />
        {moduleStatus && moduleStatus.level !== 'ok' && moduleStatus.count > 0 && (
          <span
            className={cn(
              "absolute -top-1.5 -right-2.5 min-w-[16px] h-[16px] rounded-full text-[9px] font-bold flex items-center justify-center",
              (moduleStatus.level === 'critical' || moduleStatus.level === 'warning') && "animate-pulse"
            )}
            style={{
              background: moduleStatus.level === 'critical' ? 'hsl(var(--neon-red))' : 'hsl(var(--neon-amber))',
              color: moduleStatus.level === 'critical' ? '#fff' : '#000',
              border: '2px solid hsl(225 30% 6%)',
            }}
          >
            {moduleStatus.count > 9 ? '9+' : moduleStatus.count}
          </span>
        )}
      </div>
      <span className={cn("text-[10px]", active ? "font-semibold" : "font-normal")}>{tab.label}</span>
    </button>
  );
});

TabButton.displayName = 'TabButton';
