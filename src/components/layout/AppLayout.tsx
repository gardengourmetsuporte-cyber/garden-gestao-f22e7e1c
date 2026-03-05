import gardenLogo from '@/assets/logo.png';
import gardenIcon from '@/assets/garden-icon.png';
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
        className="lg:hidden fixed top-0 left-0 right-0 z-50 border-b border-emerald-500/10"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          background: 'linear-gradient(145deg, #031208 0%, #082618 50%, #031208 100%)',
        }}
      >
        {/* Premium gradient brand bar */}
        <div
          className="relative overflow-hidden backdrop-blur-3xl"
          style={{
            background: 'linear-gradient(145deg, rgba(3,18,8,0.92) 0%, rgba(8,38,24,0.92) 50%, rgba(3,18,8,0.92) 100%)',
          }}
        >
          {/* Animated ambient glow */}
          <div className="absolute inset-0 pointer-events-none header-ambient-glow" />
          <div className="flex items-center justify-between h-14 px-3 relative z-10">
            {/* Left: Back button (on module pages) or spacer */}
            <div className="w-10 flex items-center">
              {!isDashboard && (
                <button
                  onClick={() => navigate('/')}
                  className="p-2 rounded-lg hover:bg-white/10 transition-all active:scale-90"
                >
                  <AppIcon name="ChevronLeft" size={20} className="text-white/70" />
                </button>
              )}
            </div>

            {/* Center: Logo on dashboard, Module name on other pages */}
            <div className="flex-1 flex items-center justify-center min-w-0">
              {isDashboard ? (
                <button
                  onClick={() => navigate('/')}
                  className="active:scale-95 transition-transform relative"
                >
                  <div className="absolute inset-0 m-auto w-10 h-10 rounded-full header-icon-glow" />
                  <img alt="Garden Gestão" className="w-10 h-10 object-contain relative z-10 drop-shadow-lg" src={gardenIcon} />
                </button>
              ) : (
                <span className="text-sm font-bold text-white truncate font-display" style={{ letterSpacing: '-0.01em' }}>
                  {moduleTitle || activeUnit?.name || 'Garden'}
                </span>
              )}
            </div>

            {/* Right: Notifications + Avatar */}
            <div className="flex items-center gap-1">
              <Drawer open={notifOpen} onOpenChange={setNotifOpen}>
                <DrawerTrigger asChild>
                  <button className="relative p-2.5 rounded-lg hover:bg-white/10 transition-all">
                    <AppIcon name="Bell" size={22} className="text-white/70" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-destructive text-destructive-foreground text-[11px] font-bold flex items-center justify-center">
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
                className="p-1 rounded-full active:scale-90 transition-transform"
              >
                <Avatar className="w-8 h-8 border-2 border-white/20">
                  {profile?.avatar_url ? (
                    <AvatarImage src={profile.avatar_url} alt={profile?.full_name || 'Avatar'} />
                  ) : null}
                  <AvatarFallback className="text-[11px] font-bold bg-white/15 text-white">
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
