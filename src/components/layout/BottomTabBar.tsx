import { useState, useRef, useEffect, useCallback, forwardRef } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { useUserModules } from '@/hooks/useAccessLevels';
import { useBottomBarTabs } from '@/hooks/useBottomBarTabs';
import { useFabContext } from '@/contexts/FabActionContext';
import { MoreDrawer } from './MoreDrawer';
import { QuickActionSheet } from './QuickActionSheet';
import { preloadRoute } from '@/lib/routePreload';
import { MODULE_REQUIRED_PLAN, planSatisfies } from '@/lib/plans';
import { useAuth } from '@/contexts/AuthContext';
import { getModuleKeyFromRoute, ALL_MODULES } from '@/lib/modules';
import { useUnit } from '@/contexts/UnitContext';

interface TabDef {
  key: string;
  icon: string;
  label: string;
  path: string;
  moduleKey: string;
}

const HOME_TAB: TabDef = { key: 'home', icon: 'Home', label: 'Início', path: '/', moduleKey: 'dashboard' };

// Custom tabs when inside CardapioHub
const CARDAPIO_TABS: TabDef[] = [
  HOME_TAB,
  { key: 'cardapio', icon: 'BookOpen', label: 'Cardápio', path: '/cardapio', moduleKey: 'cardapio' },
  { key: 'pedidos', icon: 'ShoppingBag', label: 'Pedidos', path: '/cardapio?tab=pedidos', moduleKey: 'cardapio' },
];

const HIDDEN_ROUTES = ['/finance', '/personal-finance'];

// Modules to use as fallback when pinned tabs aren't accessible
const FALLBACK_MODULE_KEYS = ['checklists', 'finance', 'ranking', 'inventory', 'employees', 'agenda', 'rewards'];

export function BottomTabBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeUnit } = useUnit();
  const { hasAccess } = useUserModules();
  const { pinnedTabs } = useBottomBarTabs();
  const { fabAction } = useFabContext();
  const { plan } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isHidden = HIDDEN_ROUTES.some(r => location.pathname.startsWith(r)) || location.pathname.startsWith('/tablet');

  const isCardapioRoute = location.pathname.startsWith('/cardapio');

  // Build resolved tabs — always exactly 4 tabs (Home + 3 pinned)
  const resolvedTabs: TabDef[] = [];

  if (isCardapioRoute) {
    resolvedTabs.push(...CARDAPIO_TABS);
  } else {
    resolvedTabs.push(HOME_TAB);
    // Add pinned tabs (always show them, regardless of access — locked state handled visually)
    for (const pt of pinnedTabs) {
      if (resolvedTabs.length < 3) {
        resolvedTabs.push(pt);
      }
    }
    // Fill remaining slots with fallback modules to guarantee 4 tabs
    if (resolvedTabs.length < 3) {
      for (const key of FALLBACK_MODULE_KEYS) {
        if (resolvedTabs.length >= 3) break;
        if (resolvedTabs.some(t => t.moduleKey === key)) continue;
        const mod = ALL_MODULES.find(m => m.key === key);
        if (!mod) continue;
        resolvedTabs.push({
          key: mod.key,
          icon: mod.icon,
          label: mod.label,
          path: mod.route,
          moduleKey: mod.key,
        });
      }
    }
  }

  // Split tabs: first 2 on left of FAB, rest on right
  const leftTabs = resolvedTabs.slice(0, 2);
  const rightTabs = resolvedTabs.slice(2);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    if (path.includes('?')) {
      const [basePath, query] = path.split('?');
      const params = new URLSearchParams(query);
      const tabParam = params.get('tab');
      return location.pathname.startsWith(basePath) && new URLSearchParams(location.search).get('tab') === tabParam;
    }
    if (isCardapioRoute && path === '/cardapio') {
      return location.pathname.startsWith('/cardapio') && !new URLSearchParams(location.search).get('tab');
    }
    return location.pathname.startsWith(path);
  };

  const isTabLocked = (path: string): boolean => {
    const basePath = path.split('?')[0];
    const moduleKey = getModuleKeyFromRoute(basePath);
    if (!moduleKey) return false;
    const required = MODULE_REQUIRED_PLAN[moduleKey];
    if (!required) return false;
    return !planSatisfies(plan, required);
  };

  if (isHidden) return null;

  // Total slots: leftTabs.length + FAB(1) + rightTabs.length + More(1)
  const totalSlots = leftTabs.length + 1 + rightTabs.length + 1;
  const slotWidth = `${100 / totalSlots}%`;

  return createPortal(
    <>
      <MoreDrawer open={moreOpen} onOpenChange={setMoreOpen} />
      <QuickActionSheet open={quickOpen} onOpenChange={setQuickOpen} />

      <nav
        className="fixed bottom-0 left-0 right-0 lg:hidden z-50"
      >
        {/* Subtle top separator */}
        <div className="absolute top-0 left-0 right-0 h-px bg-border/15" />

        {/* Bar background */}
        <div
          className="relative bg-background/90 backdrop-blur-[32px]"
          style={{
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
        {/* Animated ambient glow */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
            <div className="absolute inset-0 tabbar-ambient-glow opacity-60 mix-blend-screen" />
          </div>

          {/* FAB floating above the notch */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-[30px] z-20">
            <div className="fab-cradle-ring">
              <button
                aria-label={fabAction?.label || 'Ação rápida'}
                onClick={() => {
                  navigator.vibrate?.(10);
                  if (fabAction) {
                    fabAction.onClick();
                  } else {
                    setQuickOpen(true);
                  }
                }}
                className={cn(
                  "w-[44px] h-[44px] rounded-full flex items-center justify-center transition-all duration-200 fab-gradient",
                  "hover:scale-[1.08] active:scale-[0.92]"
                )}
                style={{
                  boxShadow: '0 2px 12px rgba(16,185,129,0.3)',
                }}
              >
                <AppIcon
                  name={fabAction?.icon || 'Plus'}
                  size={20}
                  className="relative z-10 text-white"
                />
              </button>
            </div>
          </div>

          <div ref={containerRef} className="flex items-center h-[68px] max-w-lg mx-auto relative z-10 tabbar-notch-shell">
            {/* Left tabs */}
            {leftTabs.map(tab => (
              <TabButton
                key={tab.key}
                tab={tab}
                active={isActive(tab.path)}
                locked={isTabLocked(tab.path)}
                moreOpen={moreOpen}
                slotWidth={slotWidth}
                onClick={() => { setMoreOpen(false); isTabLocked(tab.path) ? navigate('/plans') : navigate(tab.path); }}
              />
            ))}

            {/* Center spacer for notch */}
            <div style={{ width: slotWidth }} />

            {/* Right tabs */}
            {rightTabs.map(tab => (
              <TabButton
                key={tab.key}
                tab={tab}
                active={isActive(tab.path)}
                locked={isTabLocked(tab.path)}
                moreOpen={moreOpen}
                slotWidth={slotWidth}
                onClick={() => { setMoreOpen(false); isTabLocked(tab.path) ? navigate('/plans') : navigate(tab.path); }}
              />
            ))}

            {/* "Mais" tab — always far right */}
            {isCardapioRoute ? (
              <button
                onClick={() => { navigator.vibrate?.(10); navigate('/cardapio?section=config'); }}
                aria-label="Configurações"
                className="flex flex-col items-center justify-center h-full gap-0.5 transition-all relative z-10"
                style={{ width: slotWidth }}
              >
                <span className="material-symbols-rounded text-muted-foreground transition-colors" style={{ fontSize: 22 }}>settings</span>
                <span className="text-[10px] font-normal text-muted-foreground">Config</span>
              </button>
            ) : (
              <button
                onClick={() => { navigator.vibrate?.(10); setMoreOpen(!moreOpen); }}
                aria-label="Mais opções"
                className="flex flex-col items-center justify-center h-full gap-0.5 transition-all relative z-10"
                style={{ width: slotWidth }}
              >
                <div
                  style={{
                    transform: moreOpen ? 'scale(1.15)' : 'scale(1)',
                    transition: 'transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                >
                  <AppIcon name="Menu" size={22} fill={moreOpen ? 1 : 0} weight={moreOpen ? 600 : 400} className={moreOpen ? 'tab-icon-galaxy' : 'text-muted-foreground transition-colors'} />
                </div>
                <span className={cn("text-[10px]", moreOpen ? "font-semibold tab-icon-galaxy-text" : "font-normal text-muted-foreground")}>Mais</span>
              </button>
            )}
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
    locked?: boolean;
    moreOpen?: boolean;
    slotWidth: string;
    onClick: () => void;
  }
>(({ tab, active: routeActive, locked, moreOpen, slotWidth, onClick }, ref) => {
  const active = routeActive && !moreOpen;
  const [bouncing, setBouncing] = useState(false);
  const handledByPointer = useRef(false);

  const handleTap = () => {
    navigator.vibrate?.(10);
    setBouncing(true);
    if (moreOpen) {
      onClick();
    } else if (active) {
      const scrollable = document.querySelector('[data-scroll-container]')
        || document.querySelector('.flex-1.overflow-y-auto')
        || document.querySelector('main');
      if (scrollable && scrollable.scrollTop > 0) {
        scrollable.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      onClick();
    }
    setTimeout(() => setBouncing(false), 160);
  };

  return (
    <button
      ref={ref}
      onPointerDown={(e) => {
        if (e.pointerType === 'mouse') return;
        e.preventDefault();
        handledByPointer.current = true;
        handleTap();
      }}
      onClick={() => {
        if (handledByPointer.current) {
          handledByPointer.current = false;
          return;
        }
        handleTap();
      }}
      onMouseEnter={() => void preloadRoute(tab.path)}
      onTouchStart={() => void preloadRoute(tab.path)}
      aria-label={tab.label}
      className={cn(
        "flex flex-col items-center justify-center h-full gap-0.5 relative z-10",
        "text-muted-foreground"
      )}
      style={{ width: slotWidth }}
    >
      <div
        className="relative"
        style={{
          transform: bouncing ? 'scale(0.85)' : (active ? 'scale(1.15)' : 'scale(1)'),
          transition: bouncing ? 'transform 80ms cubic-bezier(0.2, 0, 0, 1)' : 'transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <AppIcon
          name={tab.icon}
          size={22}
          fill={active ? 1 : 0}
          weight={active ? 600 : 400}
          className={active ? 'tab-icon-galaxy' : ''}
        />
        {locked && (
          <AppIcon name="Gem" size={9} className="absolute -top-1 -right-2" style={{ color: 'hsl(45 90% 55%)' }} />
        )}
      </div>
      <span className={cn("text-[10px]", active ? "font-semibold tab-icon-galaxy-text" : "font-normal")}>{tab.label}</span>
    </button>
  );
});

TabButton.displayName = 'TabButton';
