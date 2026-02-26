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
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Outer glow wrapper */}
        <div
          className="mx-3 mb-3 rounded-[26px] p-[1px] nav-bar-neon-glow"
        >
          {/* Inner bar */}
          <div
            className="rounded-[25px] relative overflow-hidden"
            style={{
              background: 'hsl(228 25% 8% / 0.95)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
            }}
          >
            <div ref={containerRef} className="flex items-center h-[68px] max-w-lg mx-auto relative">
              {/* Highlight pill */}
              {pillStyle && (
                <div
                  className="absolute nav-highlight-pill rounded-[12px]"
                  style={{
                    background: 'hsl(var(--primary) / 0.15)',
                    border: '1px solid hsl(var(--primary) / 0.25)',
                    width: pillStyle.width,
                    height: '40px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    left: pillStyle.left,
                    willChange: 'left',
                  }}
                />
              )}

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

              {/* Center FAB "+" */}
              <div className="flex items-center justify-center" style={{ width: '20%' }}>
                <button
                  onClick={() => { navigator.vibrate?.(10); setQuickOpen(true); }}
                  className={cn(
                    "absolute -top-5 w-[54px] h-[54px] rounded-[16px] flex items-center justify-center transition-all duration-300",
                    "hover:scale-105 active:scale-90"
                  )}
                  style={{
                    background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(262 80% 55%))',
                    boxShadow: '0 0 20px hsl(var(--primary) / 0.5), 0 0 40px hsl(262 80% 55% / 0.3), 0 4px 16px hsl(0 0% 0% / 0.4)',
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
        active ? "text-foreground" : "text-muted-foreground"
      )}
      style={{ width: '20%' }}
    >
      <div className={cn("relative transition-transform duration-300", active && "scale-110")}>
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
              border: '2px solid hsl(228 25% 8%)',
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
