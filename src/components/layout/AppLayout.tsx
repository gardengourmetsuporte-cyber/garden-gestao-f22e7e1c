import { ReactNode, useState, useEffect, useRef } from 'react';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AppIcon } from '@/components/ui/app-icon';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { PointsDisplay } from '@/components/rewards/PointsDisplay';
import { CoinAnimationProvider, useCoinAnimation } from '@/contexts/CoinAnimationContext';
import { CoinAnimationLayer } from '@/components/animations/CoinAnimation';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { getThemeColor } from '@/lib/unitThemes';
import { cn } from '@/lib/utils';
import { PushNotificationPrompt } from '@/components/notifications/PushNotificationPrompt';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationCard } from '@/components/notifications/NotificationCard';
import { useChatUnreadCount } from '@/hooks/useChatUnreadCount';
import { useModuleStatus } from '@/hooks/useModuleStatus';
import { useTimeAlerts } from '@/hooks/useTimeAlerts';

import { RankedAvatar } from '@/components/profile/RankedAvatar';
import { usePoints } from '@/hooks/usePoints';
import { getRank } from '@/lib/ranks';

interface AppLayoutProps {
  children: ReactNode;
}

interface NavItem {
  icon: string; // Material icon name via AppIcon
  label: string;
  href: string;
  adminOnly?: boolean;
  group: string;
  groupLabel: string;
}

// Module icon theme: gradient + shadow for 3D effect
const MODULE_THEMES: Record<string, { gradient: string; shadow: string; iconColor: string }> = {
  '/':             { gradient: 'linear-gradient(135deg, #6366f1, #818cf8)', shadow: '0 4px 14px rgba(99,102,241,0.45)', iconColor: '#fff' },
  '/agenda':       { gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)', shadow: '0 4px 14px rgba(245,158,11,0.45)', iconColor: '#fff' },
  '/finance':      { gradient: 'linear-gradient(135deg, #10b981, #34d399)', shadow: '0 4px 14px rgba(16,185,129,0.45)', iconColor: '#fff' },
  '/inventory':    { gradient: 'linear-gradient(135deg, #f97316, #fb923c)', shadow: '0 4px 14px rgba(249,115,22,0.45)', iconColor: '#fff' },
  '/orders':       { gradient: 'linear-gradient(135deg, #3b82f6, #60a5fa)', shadow: '0 4px 14px rgba(59,130,246,0.45)', iconColor: '#fff' },
  '/checklists':   { gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)', shadow: '0 4px 14px rgba(139,92,246,0.45)', iconColor: '#fff' },
  '/cash-closing': { gradient: 'linear-gradient(135deg, #ec4899, #f472b6)', shadow: '0 4px 14px rgba(236,72,153,0.45)', iconColor: '#fff' },
  '/recipes':      { gradient: 'linear-gradient(135deg, #ef4444, #f87171)', shadow: '0 4px 14px rgba(239,68,68,0.45)', iconColor: '#fff' },
  '/employees':    { gradient: 'linear-gradient(135deg, #06b6d4, #22d3ee)', shadow: '0 4px 14px rgba(6,182,212,0.45)', iconColor: '#fff' },
  '/rewards':      { gradient: 'linear-gradient(135deg, #eab308, #facc15)', shadow: '0 4px 14px rgba(234,179,8,0.45)', iconColor: '#fff' },
  '/chat':         { gradient: 'linear-gradient(135deg, #14b8a6, #2dd4bf)', shadow: '0 4px 14px rgba(20,184,166,0.45)', iconColor: '#fff' },
  '/tablet-admin': { gradient: 'linear-gradient(135deg, #64748b, #94a3b8)', shadow: '0 4px 14px rgba(100,116,139,0.45)', iconColor: '#fff' },
  '/cardapio':     { gradient: 'linear-gradient(135deg, #d946ef, #e879f9)', shadow: '0 4px 14px rgba(217,70,239,0.45)', iconColor: '#fff' },
  '/whatsapp':     { gradient: 'linear-gradient(135deg, #22c55e, #4ade80)', shadow: '0 4px 14px rgba(34,197,94,0.45)', iconColor: '#fff' },
  '/marketing':    { gradient: 'linear-gradient(135deg, #f43f5e, #fb7185)', shadow: '0 4px 14px rgba(244,63,94,0.45)', iconColor: '#fff' },
  '/settings':     { gradient: 'linear-gradient(135deg, #475569, #64748b)', shadow: '0 4px 14px rgba(71,85,105,0.45)', iconColor: '#fff' },
};

const navItems: NavItem[] = [
  { icon: 'LayoutDashboard', label: 'Dashboard', href: '/', group: 'principal', groupLabel: 'Principal' },
  { icon: 'CalendarDays', label: 'Agenda', href: '/agenda', adminOnly: true, group: 'principal', groupLabel: 'Principal' },
  { icon: 'DollarSign', label: 'Financeiro', href: '/finance', adminOnly: true, group: 'gestao', groupLabel: 'Gestão' },
  { icon: 'Package', label: 'Estoque', href: '/inventory', group: 'gestao', groupLabel: 'Gestão' },
  { icon: 'ShoppingCart', label: 'Pedidos', href: '/orders', adminOnly: true, group: 'gestao', groupLabel: 'Gestão' },
  { icon: 'ClipboardCheck', label: 'Checklists', href: '/checklists', group: 'operacao', groupLabel: 'Operação' },
  { icon: 'Receipt', label: 'Fechamento', href: '/cash-closing', group: 'operacao', groupLabel: 'Operação' },
  { icon: 'ChefHat', label: 'Fichas Técnicas', href: '/recipes', adminOnly: true, group: 'operacao', groupLabel: 'Operação' },
  { icon: 'Users', label: 'Funcionários', href: '/employees', group: 'pessoas', groupLabel: 'Pessoas' },
  { icon: 'Gift', label: 'Recompensas', href: '/rewards', group: 'pessoas', groupLabel: 'Pessoas' },
  { icon: 'MessageCircle', label: 'Chat', href: '/chat', group: 'pessoas', groupLabel: 'Pessoas' },
  { icon: 'Monitor', label: 'Tablets', href: '/tablet-admin', adminOnly: true, group: 'producao', groupLabel: 'Em Produção' },
  { icon: 'BookOpen', label: 'Cardápio', href: '/cardapio', adminOnly: true, group: 'operacao', groupLabel: 'Operação' },
  { icon: 'MessageSquare', label: 'WhatsApp', href: '/whatsapp', adminOnly: true, group: 'operacao', groupLabel: 'Operação' },
  { icon: 'Megaphone', label: 'Marketing', href: '/marketing', adminOnly: true, group: 'gestao', groupLabel: 'Gestão' },
  { icon: 'Settings', label: 'Configurações', href: '/settings', group: 'config', groupLabel: 'Sistema' },
];

function AppLayoutContent({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unitDropdownOpen, setUnitDropdownOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  
  
  const location = useLocation();
  const navigate = useNavigate();

  // Edge swipe to open menu (from right edge)
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (sidebarOpen) return;
      const touch = e.touches[0];
      if (touch.clientX > window.innerWidth - 20) {
        touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
      }
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (sidebarOpen || !touchStartRef.current) return;
      const touch = e.touches[0];
      const dx = touchStartRef.current.x - touch.clientX;
      const dy = Math.abs(touch.clientY - touchStartRef.current.y);
      if (dx > 30 && dy < 50) {
        setSidebarOpen(true);
        touchStartRef.current = null;
      }
    };
    const handleTouchEnd = () => {
      if (!sidebarOpen) touchStartRef.current = null;
    };
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [sidebarOpen]);

  const { profile, isAdmin, signOut } = useAuth();
  const { units, activeUnit, setActiveUnitId, isTransitioning } = useUnit();
  const { isPulsing } = useCoinAnimation();
  const { unreadCount } = useNotifications();
  const { earned: earnedPoints } = usePoints();
  const rank = getRank(earnedPoints);
  const chatUnreadCount = useChatUnreadCount();
  const moduleStatuses = useModuleStatus();
  useTimeAlerts();
  const navRef = useRef<HTMLElement>(null);

  // Pages with bottom navigation bars that conflict with the FAB
  const hasBottomNav = location.pathname === '/finance';

  // Scroll sidebar nav to active item when opened
  useEffect(() => {
    if (sidebarOpen && navRef.current) {
      const activeLink = navRef.current.querySelector('[data-active="true"]');
      if (activeLink) {
        setTimeout(() => {
          activeLink.scrollIntoView({ block: 'center', behavior: 'instant' });
        }, 50);
      }
    }
  }, [sidebarOpen]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const filteredNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

  // Group nav items by group
  const groupedNav: { label: string; items: typeof filteredNavItems }[] = [];
  const seenGroups = new Set<string>();
  filteredNavItems.forEach(item => {
    if (!seenGroups.has(item.group)) {
      seenGroups.add(item.group);
      groupedNav.push({
        label: item.groupLabel,
        items: filteredNavItems.filter(i => i.group === item.group),
      });
    }
  });

  return (
    <div className="min-h-screen bg-background">
      

      {/* ======= Mobile Header ======= */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="bg-card backdrop-blur-xl border-b border-border/20">
          <div className="flex items-center justify-between h-14 px-3">
            <div className="w-10" />

            <button
              onClick={() => navigate('/')}
              className="absolute left-1/2 -translate-x-1/2 w-10 h-10 rounded-xl overflow-hidden bg-white/10 backdrop-blur-sm border border-border/20 active:scale-95 transition-transform"
              style={{ boxShadow: '0 0 12px hsl(var(--primary) / 0.15)' }}
            >
              <img alt="Logo" className="w-full h-full object-contain" src="/lovable-uploads/de20fd02-0c1c-4431-a4da-9c4611d2eb0e.jpg" />
            </button>

            <div className="flex items-center gap-1">
              <button
                onClick={() => navigate('/chat')}
                className="relative p-2 rounded-lg hover:bg-secondary transition-all"
              >
                <AppIcon name="MessageCircle" size={22} className="text-muted-foreground" style={{ filter: 'drop-shadow(0 0 4px hsl(215 20% 50% / 0.3))' }} />
                {chatUnreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-destructive text-destructive-foreground text-[7px] font-bold flex items-center justify-center">
                    {chatUnreadCount > 9 ? '9+' : chatUnreadCount}
                  </span>
                )}
              </button>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className="relative p-2 rounded-lg hover:bg-secondary transition-all"
                  >
                    <AppIcon name="Bell" size={22} className="text-muted-foreground" style={{ filter: 'drop-shadow(0 0 4px hsl(215 20% 50% / 0.3))' }} />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-destructive text-destructive-foreground text-[7px] font-bold flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-[340px] p-0 rounded-2xl border-border/50 bg-card max-h-[70vh] overflow-y-auto" sideOffset={8}>
                  <NotificationCard />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        </div>
      </header>

      {/* ======= Expandable FAB ======= */}
      {/* Overlay when FAB is open */}
      {fabOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[55] bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={() => setFabOpen(false)}
        />
      )}

      {/* FAB sub-actions */}
      {fabOpen && !sidebarOpen && (
        <div
          className="lg:hidden fixed z-[60] flex flex-col-reverse items-center gap-3"
          style={{
            bottom: hasBottomNav
              ? 'calc(env(safe-area-inset-bottom) + 100px)'
              : 'calc(env(safe-area-inset-bottom) + 40px)',
            right: '23px',
            paddingBottom: '64px',
          }}
        >
          {/* Menu button */}
          <button
            onClick={() => { setFabOpen(false); setSidebarOpen(true); }}
            className="fab-action-enter w-11 h-11 rounded-full flex items-center justify-center bg-card/90 backdrop-blur-md border border-border/50 active:scale-90 transition-transform"
            style={{ animationDelay: '0ms', boxShadow: '0 4px 16px hsl(222 50% 3% / 0.5)' }}
          >
            <AppIcon name="Menu" size={20} className="text-foreground" />
          </button>

          {/* Home button */}
          {(
            <button
              onClick={() => { setFabOpen(false); navigate('/'); }}
              className="fab-action-enter w-11 h-11 rounded-full flex items-center justify-center bg-card/90 backdrop-blur-md border border-border/50 active:scale-90 transition-transform"
              style={{ animationDelay: '80ms', boxShadow: '0 4px 16px hsl(222 50% 3% / 0.5)' }}
            >
              <AppIcon name="Home" size={20} className="text-foreground" />
            </button>
          )}
        </div>
      )}

      {/* Main FAB button */}
      <button
        onClick={() => {
          if (sidebarOpen) {
            setSidebarOpen(false);
          } else {
            setFabOpen(prev => !prev);
          }
        }}
        className={cn(
          "lg:hidden fixed z-[60] w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 active:scale-90",
          (fabOpen || sidebarOpen) ? "rotate-180 scale-90" : "hover:scale-105"
        )}
        style={{
          bottom: hasBottomNav
            ? 'calc(env(safe-area-inset-bottom) + 84px)'
            : 'calc(env(safe-area-inset-bottom) + 24px)',
          right: '20px',
          background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--neon-cyan)))',
          boxShadow: '0 4px 24px hsl(var(--primary) / 0.4), 0 0 40px hsl(var(--neon-cyan) / 0.15)',
        }}
      >
        {(fabOpen || sidebarOpen) ? (
          <AppIcon name="X" size={24} className="text-primary-foreground" />
        ) : (
          <AppIcon name="Grip" size={24} className="text-primary-foreground" />
        )}
        {!fabOpen && !sidebarOpen && activeUnit && (
          <span
            className="absolute top-1 right-1 w-3 h-3 rounded-full border-2"
            style={{
              borderColor: 'hsl(var(--primary))',
              background: getThemeColor(activeUnit.slug),
              boxShadow: `0 0 8px ${getThemeColor(activeUnit.slug)}80`,
            }}
          />
        )}
      </button>

      {/* ======= Main Content ======= */}
      <main
        className={cn("min-h-screen animate-page-enter", "transition-all duration-300")}
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 3.75rem)' }}
      >
        {children}
      </main>

      {/* ======= Bottom Sheet Menu (Drawer) ======= */}
      <Drawer open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <DrawerContent className="bg-background/95 backdrop-blur-2xl border-t border-border/30 max-h-[88vh] rounded-t-3xl">
          {/* Handle bar */}
          <div className="flex justify-center pt-2 pb-1">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>

          {/* Compact header row: logo + unit + avatar */}
          <div className="flex items-center gap-2.5 px-4 py-2 shrink-0">
            {/* Logo */}
            <div
              className="w-8 h-8 rounded-lg overflow-hidden border border-primary/30 shrink-0"
              style={{ boxShadow: '0 0 10px hsl(var(--primary) / 0.15)' }}
            >
              <img alt="Logo" className="w-full h-full object-contain" src="/lovable-uploads/f33aaa21-284f-4287-9fbe-9f15768b7d65.jpg" />
            </div>

            {/* Unit selector - inline */}
            {units.length > 0 ? (
              <div className="flex-1 min-w-0 relative">
                <button
                  onClick={() => setUnitDropdownOpen(!unitDropdownOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all w-full"
                  style={{
                    background: 'hsl(var(--secondary) / 0.6)',
                    border: '1px solid hsl(var(--border) / 0.3)',
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: activeUnit ? getThemeColor(activeUnit.slug) : 'hsl(var(--primary))' }}
                  />
                  <span className="flex-1 text-left truncate text-foreground text-xs">
                    {activeUnit?.name || 'Unidade'}
                  </span>
                  <AppIcon name="ChevronDown" size={12} className={cn(
                    "text-muted-foreground transition-transform duration-200",
                    unitDropdownOpen && "rotate-180"
                  )} />
                </button>
                {unitDropdownOpen && (
                  <div
                    className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xl overflow-hidden py-1"
                    style={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border) / 0.4)',
                      boxShadow: '0 8px 32px hsl(222 50% 3% / 0.6)',
                    }}
                  >
                    {units.map(unit => (
                      <button
                        key={unit.id}
                        onClick={() => {
                          setActiveUnitId(unit.id);
                          setUnitDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2 text-xs transition-all",
                          unit.id === activeUnit?.id
                            ? "text-primary bg-primary/10"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                        )}
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: getThemeColor(unit.slug) }}
                        />
                        <span className="truncate">{unit.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1">
                <h1 className="font-bold text-sm text-foreground">Garden</h1>
              </div>
            )}

            {/* User avatar - compact */}
            <button
              onClick={() => { navigate('/profile/me'); setSidebarOpen(false); }}
              className="shrink-0 active:scale-90 transition-transform"
            >
              <RankedAvatar avatarUrl={profile?.avatar_url} earnedPoints={earnedPoints} size={34} />
            </button>
          </div>

          <div className="mx-4 h-px bg-gradient-to-r from-transparent via-border/30 to-transparent" />

          {/* Navigation Grid - Colorful 3D Icons */}
          <nav ref={navRef} className="flex-1 overflow-y-auto px-4 pt-3 pb-6 space-y-4">
            {groupedNav.map((group) => (
              <div key={group.label}>
                <div className="mb-2 px-1">
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/50">
                    {group.label}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.href;
                    const showBadge = (item.href === '/' && unreadCount > 0) || (item.href === '/chat' && chatUnreadCount > 0);
                    const badgeCount = item.href === '/chat' ? chatUnreadCount : unreadCount;
                    const moduleStatus = moduleStatuses[item.href];
                    const theme = MODULE_THEMES[item.href] || MODULE_THEMES['/'];

                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        data-active={isActive}
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          "flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-2xl text-center transition-all duration-200 relative active:scale-[0.92]",
                          isActive
                            ? "text-foreground bg-secondary/60"
                            : "text-muted-foreground"
                        )}
                      >
                        <div className="relative">
                          <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200"
                            style={{
                              background: theme.gradient,
                              boxShadow: isActive ? theme.shadow : theme.shadow.replace('0.45', '0.25'),
                              transform: isActive ? 'scale(1.05)' : undefined,
                            }}
                          >
                            <AppIcon
                              name={item.icon}
                              size={22}
                              style={{ color: theme.iconColor, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
                            />
                          </div>
                          {/* Shine/gloss overlay for 3D effect */}
                          <div
                            className="absolute inset-0 rounded-2xl pointer-events-none"
                            style={{
                              background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.05) 40%, transparent 60%)',
                              width: '3rem',
                              height: '3rem',
                            }}
                          />
                          {showBadge && (
                            <span className="absolute -top-1 -right-1 w-4.5 h-4.5 min-w-[18px] rounded-full bg-destructive text-destructive-foreground text-[8px] font-bold flex items-center justify-center animate-pulse border-2 border-background">
                              {badgeCount > 9 ? '9+' : badgeCount}
                            </span>
                          )}
                          {moduleStatus && moduleStatus.level !== 'ok' && moduleStatus.count > 0 && (
                            <span
                              className={cn(
                                "absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full text-[8px] font-bold flex items-center justify-center border-2 border-background",
                                (moduleStatus.level === 'critical' || moduleStatus.level === 'warning') && "animate-pulse"
                              )}
                              style={{
                                background: moduleStatus.level === 'critical' ? 'hsl(var(--neon-red))' : 'hsl(var(--neon-amber))',
                                color: moduleStatus.level === 'critical' ? '#fff' : '#000',
                              }}
                            >
                              {moduleStatus.count > 9 ? '9+' : moduleStatus.count}
                            </span>
                          )}
                          {moduleStatus && moduleStatus.level === 'ok' && (
                            <div
                              className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-background"
                              style={{
                                background: 'hsl(var(--neon-green))',
                                boxShadow: '0 0 6px hsl(var(--neon-green) / 0.5)',
                              }}
                            />
                          )}
                        </div>
                        <span className="text-[10px] font-medium leading-tight max-w-full truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Logout */}
            <div className="pt-1">
              <div className="h-px bg-gradient-to-r from-transparent via-border/30 to-transparent mb-2" />
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all active:scale-[0.98]"
              >
                <AppIcon name="LogOut" size={16} />
                <span className="font-medium">Sair</span>
              </button>
            </div>
          </nav>
        </DrawerContent>
      </Drawer>


      {/* Unit transition overlay */}
      {isTransitioning && (
        <div
          className="fixed inset-0 z-[100] pointer-events-none animate-unit-flash"
          style={{ background: 'hsl(var(--primary) / 0.12)' }}
        />
      )}

      <CoinAnimationLayer />
      <PushNotificationPrompt />
    </div>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <CoinAnimationProvider>
      <AppLayoutContent>{children}</AppLayoutContent>
    </CoinAnimationProvider>
  );
}
