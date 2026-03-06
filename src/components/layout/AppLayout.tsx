import gardenLogo from '@/assets/logo.png';
import { ReactNode, useState, useMemo, useRef, useEffect } from 'react';
import { PageLoader } from '@/components/PageLoader';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { PageTransition } from './PageTransition';
import { AppIcon } from '@/components/ui/app-icon';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { PointsDisplay } from '@/components/rewards/PointsDisplay';
import { CoinAnimationProvider, useCoinAnimation } from '@/contexts/CoinAnimationContext';
import { CoinAnimationLayer } from '@/components/animations/CoinAnimation';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { cn } from '@/lib/utils';
import { PushNotificationPrompt } from '@/components/notifications/PushNotificationPrompt';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationCard } from '@/components/notifications/NotificationCard';
import { useUserModules } from '@/hooks/useAccessLevels';
import { getModuleKeyFromRoute } from '@/lib/modules';
import { MODULE_REQUIRED_PLAN, planSatisfies } from '@/lib/plans';
import type { PlanTier } from '@/lib/plans';
import { RankedAvatar } from '@/components/profile/RankedAvatar';
import { usePoints } from '@/hooks/usePoints';
import { getRank } from '@/lib/ranks';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useIsMobile } from '@/hooks/use-mobile';
import { preloadRoute, preloadRoutes } from '@/lib/routePreload';
import { lazy, Suspense, memo } from 'react';
import { NAV_ITEMS, filterNavItems, groupNavItems } from '@/lib/navItems';
import { getRouteTitle } from '@/hooks/useDocumentTitle';

// Lazy-load BottomTabBar — only used on mobile
const LazyBottomTabBar = lazy(() => import('./BottomTabBar').then(m => ({ default: m.BottomTabBar })));

interface AppLayoutProps {
  children: ReactNode;
}

function AppLayoutContent({ children }: AppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const { user, profile, isAdmin, isSuperAdmin, signOut, plan } = useAuth();
  const { units, activeUnit, setActiveUnitId, isTransitioning } = useUnit();
  const { isPulsing } = useCoinAnimation();
  const { unreadCount } = useNotifications();
  const { earned: earnedPoints } = usePoints();
  const rank = useMemo(() => getRank(earnedPoints), [earnedPoints]);
  const isDashboard = location.pathname === '/';
  const moduleTitle = useMemo(() => getRouteTitle(location.pathname), [location.pathname]);
  const [isLgScreen, setIsLgScreen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)');
    const onChange = () => setIsLgScreen(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  const { leaderboard } = useLeaderboard();
  const myPosition = useMemo(() => leaderboard.find(e => e.user_id === user?.id)?.rank, [leaderboard, user?.id]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    navigate('/auth');
  };

  const userModules = useUserModules();

  const isModuleLocked = (href: string): boolean => {
    const moduleKey = getModuleKeyFromRoute(href);
    if (!moduleKey) return false;
    const required = MODULE_REQUIRED_PLAN[moduleKey];
    if (!required) return false;
    return !planSatisfies(plan, required);
  };

  const { hasAccess, allowedModules, isLoading: accessLoading } = userModules;
  const hasAccessLevel = allowedModules !== null && allowedModules !== undefined;

  const lastNavRef = useRef(NAV_ITEMS);

  const filteredNavItems = useMemo(() => {
    if (accessLoading && lastNavRef.current.length > 0) {
      return lastNavRef.current;
    }
    const result = filterNavItems(NAV_ITEMS, {
      isSuperAdmin,
      isAdmin,
      hasAccessLevel,
      allowedModules,
      getModuleKeyFromRoute,
    });
    lastNavRef.current = result;
    return result;
  }, [isSuperAdmin, isAdmin, hasAccessLevel, allowedModules, accessLoading]);

  useEffect(() => {
    const preloadPaths = filteredNavItems.map(item => item.href).slice(0, 8);
    if (preloadPaths.length === 0) return;

    const browserWindow = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (browserWindow.requestIdleCallback) {
      const idleId = browserWindow.requestIdleCallback(() => preloadRoutes(preloadPaths), { timeout: 1200 });
      return () => browserWindow.cancelIdleCallback?.(idleId);
    }

    const timeoutId = window.setTimeout(() => preloadRoutes(preloadPaths), 350);
    return () => window.clearTimeout(timeoutId);
  }, [filteredNavItems]);

  const groupedNav = useMemo(() => groupNavItems(filteredNavItems), [filteredNavItems]);

  // Get user initials for avatar fallback
  const initials = useMemo(() => {
    const name = profile?.full_name || 'U';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }, [profile?.full_name]);

  if (isSigningOut) {
    return (
      <div className="animate-fade-in">
        <PageLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">

      {/* ======= Mobile Header with Navy Brand Strip ======= */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 z-50 border-b border-border/30"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          background: 'hsl(var(--background))',
        }}
      >
        <div className="relative overflow-hidden">
          <div className="flex items-center justify-between h-14 px-3 relative z-10">
            {/* Left: Back button + Logo — always rendered, orchestrated entrance */}
            <div className="flex items-center gap-1 relative" style={{ minWidth: '2.5rem' }}>
              {/* Back chevron — slides in first (fastest) */}
              <button
                onClick={() => navigate('/')}
                className={cn(
                  "p-1.5 -ml-1 rounded-lg hover:bg-muted/50 active:scale-90 transition-all ease-[cubic-bezier(0.25,0.1,0.25,1)]",
                  isDashboard
                    ? "opacity-0 -translate-x-3 pointer-events-none w-0 p-0 -ml-0 duration-200"
                    : "opacity-100 translate-x-0 duration-300 delay-[50ms]"
                )}
                tabIndex={isDashboard ? -1 : 0}
              >
                <AppIcon name="ChevronLeft" size={20} className="text-foreground/70" />
              </button>

              {/* Logo — morphs between expanded pill (dashboard) and compact icon (modules) */}
              <button
                onClick={() => navigate('/')}
                className={cn(
                  "flex items-center rounded-full overflow-hidden shrink-0 active:scale-95 transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]",
                  isDashboard && !isScrolled
                    ? "h-9 bg-card border border-border/50 shadow-sm pl-2 pr-3.5 gap-2.5"
                    : "h-8 w-8 bg-transparent p-0 justify-center"
                )}
              >
                <div className={cn(
                  "rounded-full overflow-hidden flex items-center justify-center shrink-0 transition-all duration-300",
                  isDashboard && !isScrolled ? "w-6 h-6" : "w-8 h-8"
                )}>
                  <img alt="Garden Gestão" className="w-full h-full object-contain" src={gardenLogo} />
                </div>
                <span
                  className={cn(
                    "text-xs font-semibold text-foreground whitespace-nowrap transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] overflow-hidden",
                    isDashboard && !isScrolled ? "max-w-[7rem] opacity-100" : "max-w-0 opacity-0"
                  )}
                  style={{ letterSpacing: '-0.01em' }}
                >
                  Garden Gestão
                </span>
              </button>
            </div>

            {/* Center: Module title — fades in AFTER logo settles (staggered delay) */}
            <div className="flex-1 flex items-center justify-center min-w-0">
              <span
                className={cn(
                  "text-sm font-bold text-foreground truncate font-display ease-[cubic-bezier(0.25,0.1,0.25,1)]",
                  isDashboard
                    ? "opacity-0 translate-y-3 scale-95 pointer-events-none transition-all duration-150"
                    : "opacity-100 translate-y-0 scale-100 transition-all duration-400 delay-[200ms]"
                )}
                style={{ letterSpacing: '-0.01em' }}
              >
                {moduleTitle || 'Garden'}
              </span>
            </div>

            {/* Right: Notifications + Avatar */}
            <div className="flex items-center gap-0.5">
              <Drawer open={notifOpen} onOpenChange={setNotifOpen}>
                <DrawerTrigger asChild>
                  <button className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted/40 transition-colors active:scale-90">
                    <AppIcon name="Bell" size={21} className="text-foreground/60" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center shadow-sm">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                </DrawerTrigger>
                <DrawerContent className="px-4 pb-8 pt-4 max-h-[70vh] overflow-y-auto">
                  <div className="mx-auto w-12 h-1.5 rounded-full bg-muted mb-4" />
                  {notifOpen && <NotificationCard />}
                </DrawerContent>
              </Drawer>

              <button
                onClick={() => navigate('/profile/me')}
                className="w-10 h-10 flex items-center justify-center rounded-full active:scale-90 transition-transform"
              >
                <Avatar className="w-[34px] h-[34px] ring-2 ring-border/30 ring-offset-1 ring-offset-background">
                  {profile?.avatar_url ? (
                    <AvatarImage src={profile.avatar_url} alt={profile?.full_name || 'Avatar'} className="object-cover" />
                  ) : null}
                  <AvatarFallback className="text-[11px] font-bold bg-muted text-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ======= Desktop Sidebar ======= */}
      <aside className="hidden lg:flex fixed top-0 left-0 bottom-0 w-[260px] z-50 flex-col bg-card/60 backdrop-blur-3xl border-r border-emerald-500/10">
        {/* Premium brand header */}
        <div
          className="relative overflow-hidden shrink-0 border-b border-emerald-500/10"
          style={{
            background: 'linear-gradient(145deg, rgba(3,18,8,0.7) 0%, rgba(8,38,24,0.7) 50%, rgba(3,18,8,0.7) 100%)',
          }}
        >
          <div className="flex items-center gap-3 px-4 h-16 relative z-10">
            <button
              onClick={() => navigate('/')}
              className="w-9 h-9 rounded-xl overflow-hidden bg-white flex items-center justify-center active:scale-95 transition-transform shrink-0 shadow-sm"
            >
              <img alt="Garden Gestão" className="w-7 h-7 object-contain" src={gardenLogo} />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{activeUnit?.name || 'Garden'}</p>
              <p className="text-[10px] text-emerald-400/50 font-medium tracking-wide">Gestão Inteligente</p>
            </div>
          </div>
        </div>

        {/* User card */}
        <button
          onClick={() => navigate('/profile/me')}
          className="flex items-center gap-3 px-4 py-3 hover:bg-emerald-500/5 transition-colors border-b border-emerald-500/10"
        >
          <RankedAvatar avatarUrl={profile?.avatar_url} earnedPoints={earnedPoints} size={36} />
          <div className="text-left min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground truncate">{profile?.full_name || 'Usuário'}</p>
            <p className="text-[11px] font-medium" style={{ color: rank.color }}>{rank.title} · {earnedPoints} pts</p>
          </div>
        </button>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4 scrollbar-thin">
          {/* Home */}
          <Link
            to="/"
            onMouseEnter={() => void preloadRoute('/')}
            onTouchStart={() => void preloadRoute('/')}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all",
              location.pathname === '/'
                ? "bg-emerald-500/12 text-emerald-400"
                : "text-muted-foreground hover:text-foreground hover:bg-emerald-500/5"
            )}
          >
            <AppIcon name="Home" size={20} />
            <span>Início</span>
          </Link>

          {groupedNav.map((group) => (
            <div key={group.label}>
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/40 px-3 mb-1 block">
                {group.label}
              </span>
              {group.items.map((item) => {
                const isActive = location.pathname === item.href;
                const locked = isModuleLocked(item.href);
                const targetHref = locked ? '/plans' : item.href;

                return (
                  <Link
                    key={item.href}
                    to={targetHref}
                    onMouseEnter={() => void preloadRoute(targetHref)}
                    onTouchStart={() => void preloadRoute(targetHref)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all relative overflow-hidden group",
                     isActive
                        ? "bg-emerald-500/12 text-emerald-400 shadow-sm ring-1 ring-emerald-500/20"
                        : locked
                          ? "text-muted-foreground/50 hover:text-muted-foreground hover:bg-emerald-500/5"
                          : "text-muted-foreground hover:text-foreground hover:bg-emerald-500/5"
                    )}
                  >
                    {!isActive && !locked && (
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out pointer-events-none" />
                    )}
                    <AppIcon name={item.icon} size={20} style={{ opacity: locked ? 0.5 : 1 }} className="relative z-10" />
                    <span className="truncate flex-1 relative z-10">{item.label}</span>
                    {locked && <AppIcon name="Lock" size={14} className="text-emerald-500/60 shrink-0 relative z-10" />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="px-3 py-3 border-t border-emerald-500/10 space-y-1 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5">
            <PointsDisplay isPulsing={isPulsing} showLabel className="scale-90 origin-left" />
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-emerald-500/5 transition-all"
          >
            <AppIcon name="LogOut" size={18} />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* ======= Main Content ======= */}
      <main
        className="min-h-screen lg:ml-[260px] lg:pt-0"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 3.5rem)' }}
      >
        <PageTransition>
          {children}
        </PageTransition>
      </main>

      {/* ======= Global Bottom Tab Bar (mobile only, lazy-loaded) ======= */}
      {!isLgScreen && (
        <Suspense fallback={null}>
          <LazyBottomTabBar />
        </Suspense>
      )}

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
