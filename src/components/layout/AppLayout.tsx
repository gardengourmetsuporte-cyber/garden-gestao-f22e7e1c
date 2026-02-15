import { ReactNode, useState, useEffect, useRef, useCallback } from 'react';
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
import { useUserModules } from '@/hooks/useAccessLevels';
import { getModuleKeyFromRoute } from '@/lib/modules';
import { useTimeAlerts } from '@/hooks/useTimeAlerts';

import { RankedAvatar } from '@/components/profile/RankedAvatar';
import { usePoints } from '@/hooks/usePoints';
import { getRank } from '@/lib/ranks';

interface AppLayoutProps {
  children: ReactNode;
}

interface NavItem {
  icon: string;
  label: string;
  href: string;
  adminOnly?: boolean;
  group: string;
  groupLabel: string;
}

// Monochrome — no per-module colors

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
  const isClosingDrawerRef = useRef(false);
  
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
  const [notifOpen, setNotifOpen] = useState(false);
  const handleNotifOpenChange = useCallback((open: boolean) => {
    setNotifOpen(prev => prev === open ? prev : open);
  }, []);
  const navRef = useRef<HTMLElement>(null);

  const hasBottomNav = location.pathname === '/finance' || location.pathname === '/chat';

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

  const { hasAccess } = useUserModules();
  const filteredNavItems = navItems.filter(item => {
    if (item.adminOnly && !isAdmin) return false;
    const moduleKey = getModuleKeyFromRoute(item.href);
    if (moduleKey && !hasAccess(moduleKey)) return false;
    return true;
  });

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
            <div className="w-10">
              <PointsDisplay isPulsing={isPulsing} showLabel={false} className="scale-75 origin-left" />
            </div>

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
              <Popover open={notifOpen} onOpenChange={handleNotifOpenChange}>
                <PopoverTrigger asChild>
                  <button className="relative p-2 rounded-lg hover:bg-secondary transition-all">
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
      {fabOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[55] bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={() => setFabOpen(false)}
        />
      )}

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
          <button
            onClick={() => { setFabOpen(false); setSidebarOpen(true); }}
            className="fab-action-enter w-11 h-11 rounded-full flex items-center justify-center bg-card/90 backdrop-blur-md border border-border/50 active:scale-90 transition-transform"
            style={{ animationDelay: '0ms', boxShadow: '0 4px 16px hsl(222 50% 3% / 0.5)' }}
          >
            <AppIcon name="Menu" size={20} className="text-foreground" />
          </button>
          <button
            onClick={() => { setFabOpen(false); navigate('/'); }}
            className="fab-action-enter w-11 h-11 rounded-full flex items-center justify-center bg-card/90 backdrop-blur-md border border-border/50 active:scale-90 transition-transform"
            style={{ animationDelay: '80ms', boxShadow: '0 4px 16px hsl(222 50% 3% / 0.5)' }}
          >
            <AppIcon name="Home" size={20} className="text-foreground" />
          </button>
        </div>
      )}

      <button
        onTouchEnd={(e) => {
          e.stopPropagation();
          e.preventDefault();
          if (sidebarOpen) {
            // handled by close button inside drawer
            return;
          } else if (fabOpen) {
            setFabOpen(false);
          } else {
            setFabOpen(true);
          }
        }}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          if (sidebarOpen) {
            return;
          } else if (fabOpen) {
            setFabOpen(false);
          } else {
            setFabOpen(true);
          }
        }}
        className={cn(
          "lg:hidden fixed z-[9999] rounded-full flex items-center justify-center transition-all duration-300 active:scale-95",
          sidebarOpen ? "pointer-events-none opacity-0" : "",
          fabOpen ? "w-16 h-16" : "w-14 h-14 hover:scale-105"
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
        {fabOpen ? (
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
      <Drawer open={sidebarOpen} onOpenChange={(open) => {
        if (!open) {
          isClosingDrawerRef.current = true;
          setTimeout(() => { isClosingDrawerRef.current = false; }, 400);
        }
        setSidebarOpen(open);
      }}>
        <DrawerContent className="border-t-0 max-h-[92vh] rounded-t-3xl overflow-hidden" style={{
          background: 'hsl(var(--background))',
        }}>
          {/* Header: Unit Selector + Handle + Close */}
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            {/* Unit selector compact */}
            <div className="flex-1 relative">
              {units.length > 0 && (
                <button
                  onClick={() => setUnitDropdownOpen(!unitDropdownOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all bg-secondary/60 border border-border/20 max-w-[140px]"
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{
                    background: activeUnit ? getThemeColor(activeUnit.slug) : 'hsl(var(--primary))',
                    boxShadow: activeUnit ? `0 0 6px ${getThemeColor(activeUnit.slug)}80` : undefined,
                  }} />
                  <span className="truncate text-foreground">{activeUnit?.name || 'Unidade'}</span>
                  <AppIcon name="ChevronDown" size={12} className={cn("text-muted-foreground transition-transform duration-200 shrink-0", unitDropdownOpen && "rotate-180")} />
                </button>
              )}
              {unitDropdownOpen && units.length > 0 && (
                <div className="absolute top-full left-0 mt-1.5 z-50 rounded-xl overflow-hidden py-1 bg-card border border-border/40 min-w-[180px]" style={{
                  boxShadow: 'var(--shadow-elevated)',
                }}>
                  {units.map(unit => (
                    <button
                      key={unit.id}
                      onClick={() => { setActiveUnitId(unit.id); setUnitDropdownOpen(false); }}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2.5 text-xs transition-all",
                        unit.id === activeUnit?.id ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                      )}
                    >
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: getThemeColor(unit.slug) }} />
                      <span className="truncate">{unit.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
            <div className="flex-1 flex justify-end">
              <button
                onClick={() => {
                  setSidebarOpen(false);
                  setFabOpen(false);
                  navigate('/');
                }}
                className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-all bg-secondary border border-border/30"
              >
                <AppIcon name="X" size={18} className="text-foreground" />
              </button>
            </div>
          </div>

          {/* Mini Profile Row */}
          <button
            onClick={() => { navigate('/profile/me'); setSidebarOpen(false); }}
            className="flex items-center gap-3 w-full px-4 py-2 border-b border-border/10 active:bg-secondary/40 transition-colors"
          >
            <RankedAvatar avatarUrl={profile?.avatar_url} earnedPoints={earnedPoints} size={32} />
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold text-foreground truncate">
                {profile?.full_name || 'Usuário'}
              </p>
              <p className="text-[10px] font-medium" style={{ color: rank.color }}>
                {rank.title} · {earnedPoints} pts
              </p>
            </div>
            <AppIcon name="ChevronRight" size={16} className="text-muted-foreground shrink-0" />
          </button>

          {/* Navigation Grid — Monochrome Modern */}
          <nav ref={navRef} className="flex-1 overflow-y-auto px-4 pb-8">
            {groupedNav.map((group, gi) => (
              <div key={group.label} className={cn(gi > 0 && "mt-5")}>
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/40 px-1 mb-2.5 block">
                  {group.label}
                </span>
                <div className="grid grid-cols-4 gap-3">
                  {group.items.map((item, idx) => {
                    const isActive = location.pathname === item.href;
                    const showBadge = (item.href === '/' && unreadCount > 0) || (item.href === '/chat' && chatUnreadCount > 0);
                    const badgeCount = item.href === '/chat' ? chatUnreadCount : unreadCount;
                    const moduleStatus = moduleStatuses[item.href];

                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        data-active={isActive}
                        onClick={(e) => {
                          if (isClosingDrawerRef.current) {
                            e.preventDefault();
                            return;
                          }
                          setSidebarOpen(false);
                        }}
                        className={cn(
                          "flex flex-col items-center gap-1.5 py-2 text-center transition-all duration-200 relative active:scale-[0.92] rounded-xl",
                          "animate-fade-in",
                        )}
                        style={{ animationDelay: `${(gi * 4 + idx) * 25}ms` }}
                      >
                        <div className="relative">
                          {/* Icon container — monochrome filled style */}
                          <div
                            className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200",
                              isActive
                                ? "bg-primary shadow-lg shadow-primary/25"
                                : "bg-secondary/80 border border-border/30"
                            )}
                          >
                            <AppIcon
                              name={item.icon}
                              size={22}
                              className={isActive ? "text-primary-foreground" : "text-muted-foreground"}
                              style={{
                                filter: isActive ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' : 'none',
                              }}
                            />
                          </div>

                          {/* Badges */}
                          {showBadge && (
                            <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] rounded-full text-[8px] font-bold flex items-center justify-center animate-pulse bg-destructive text-destructive-foreground" style={{
                              border: '2px solid hsl(var(--background))',
                            }}>
                              {badgeCount > 9 ? '9+' : badgeCount}
                            </span>
                          )}
                          {moduleStatus && moduleStatus.level !== 'ok' && moduleStatus.count > 0 && (
                            <span
                              className={cn(
                                "absolute -top-1 -right-1 min-w-[16px] h-[16px] rounded-full text-[8px] font-bold flex items-center justify-center",
                                (moduleStatus.level === 'critical' || moduleStatus.level === 'warning') && "animate-pulse"
                              )}
                              style={{
                                background: moduleStatus.level === 'critical' ? 'hsl(var(--neon-red))' : 'hsl(var(--neon-amber))',
                                color: moduleStatus.level === 'critical' ? '#fff' : '#000',
                                border: '2px solid hsl(var(--background))',
                              }}
                            >
                              {moduleStatus.count > 9 ? '9+' : moduleStatus.count}
                            </span>
                          )}
                          {moduleStatus && moduleStatus.level === 'ok' && (
                            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full" style={{
                              background: 'hsl(var(--neon-green))',
                              boxShadow: '0 0 6px hsl(var(--neon-green) / 0.5)',
                              border: '1.5px solid hsl(var(--background))',
                            }} />
                          )}
                        </div>
                        <span className={cn(
                          "text-[10px] font-medium leading-tight max-w-full truncate transition-colors",
                          isActive ? "text-foreground" : "text-muted-foreground"
                        )}>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Logout */}
            <div className="mt-6 pt-4 border-t border-border/15">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-xs transition-all active:scale-[0.97] text-muted-foreground hover:text-foreground hover:bg-secondary/40"
              >
                <AppIcon name="LogOut" size={16} />
                <span className="font-medium">Sair da conta</span>
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
