import { useState, useRef, useEffect, useCallback, forwardRef } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { useUserModules } from '@/hooks/useAccessLevels';
import { useFabContext } from '@/contexts/FabActionContext';
import { MoreDrawer } from './MoreDrawer';
import { QuickActionSheet } from './QuickActionSheet';
import { preloadRoute } from '@/lib/routePreload';

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
  { key: 'finance', icon: 'DollarSign', label: 'Financeiro', path: '/finance', moduleKey: 'finance' },
];

const FALLBACK_TABS: TabDef[] = [
  { key: 'inventory', icon: 'Package', label: 'Estoque', path: '/inventory', moduleKey: 'inventory' },
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
  const { fabAction } = useFabContext();
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
                onClick={() => navigate(tab.path)}
              />
            ))}

            {/* Center FAB — context-aware */}
            <div className="flex items-center justify-center" style={{ width: '20%' }}>
              {/* Subtle indigo glow ring behind FAB */}
              <div
                className="absolute -top-8 w-[68px] h-[68px] rounded-full"
                style={{
                  background: 'radial-gradient(circle, hsl(var(--primary) / 0.35) 0%, hsl(var(--primary) / 0.1) 50%, transparent 70%)',
                  filter: 'blur(8px)',
                }}
              />
              <button
                onClick={() => {
                  navigator.vibrate?.(10);
                  if (fabAction) {
                    fabAction.onClick();
                  } else {
                    setQuickOpen(true);
                  }
                }}
                className={cn(
                  "absolute -top-7 w-[60px] h-[60px] rounded-full flex items-center justify-center transition-all duration-200",
                  "hover:scale-[1.08] active:scale-[0.92]"
                )}
                style={{
                  background: 'hsl(0 0% 100%)',
                  boxShadow: '0 4px 20px hsl(0 0% 0% / 0.5), 0 8px 32px hsl(0 0% 0% / 0.3), 0 0 0 1px hsl(0 0% 100% / 0.15)',
                }}
              >
                <AppIcon
                  name={fabAction?.icon || 'Plus'}
                  size={26}
                  className="relative z-10"
                  style={{ color: 'hsl(240 6% 10%)' }}
                />
              </button>
            </div>

            {/* Right tabs */}
            {rightTabs.map(tab => (
              <TabButton
                key={tab.key}
                ref={(el) => { tabRefs.current[tab.key] = el; }}
                tab={tab}
                active={isActive(tab.path)}
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
    onClick: () => void;
  }
>(({ tab, active, onClick }, ref) => {
  const [bouncing, setBouncing] = useState(false);

  const handleTap = () => {
    navigator.vibrate?.(10);
    setBouncing(true);
    onClick();
    setTimeout(() => setBouncing(false), 160);
  };

  return (
    <button
      ref={ref}
      onClick={handleTap}
      onMouseEnter={() => void preloadRoute(tab.path)}
      onTouchStart={() => void preloadRoute(tab.path)}
      className={cn(
        "flex flex-col items-center justify-center h-full gap-0.5 relative z-10",
        active ? "text-primary" : "text-muted-foreground"
      )}
      style={{ width: '20%' }}
    >
      <div
        className="relative"
        style={{
          transform: bouncing ? 'scale(0.85)' : (active ? 'scale(1.1)' : 'scale(1)'),
          transition: bouncing ? 'transform 60ms ease-in' : 'transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          ...(active ? { filter: 'drop-shadow(0 0 8px hsl(var(--primary) / 0.6))' } : {}),
        }}
      >
        <AppIcon
          name={tab.icon}
          size={22}
          fill={active ? 1 : 0}
          weight={active ? 600 : 400}
        />
      </div>
      <span className={cn("text-[10px]", active ? "font-semibold" : "font-normal")}>{tab.label}</span>
    </button>
  );
});

TabButton.displayName = 'TabButton';
