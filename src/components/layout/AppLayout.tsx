import { ReactNode, useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import gardenLogo from '@/assets/logo.png';
import { PageLoader } from '@/components/PageLoader';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { PageTransition } from './PageTransition';
import { AppIcon } from '@/components/ui/app-icon';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { CoinAnimationProvider, useCoinAnimation } from '@/contexts/CoinAnimationContext';
import { CoinAnimationLayer } from '@/components/animations/CoinAnimation';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { NotificationBell } from './NotificationBell';
import { ProfileDropdown } from './ProfileDropdown';

import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { cn } from '@/lib/utils';
import { PushNotificationPrompt } from '@/components/notifications/PushNotificationPrompt';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { useIsMobile } from '@/hooks/use-mobile';
import { getRouteTitle } from '@/hooks/useDocumentTitle';

// Lazy-load BottomTabBar — only used on mobile
const LazyBottomTabBar = lazy(() => import('./BottomTabBar').then(m => ({ default: m.BottomTabBar })));

interface AppLayoutProps {
  children: ReactNode;
}

function AppLayoutContent({ children }: AppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { isTransitioning, activeUnit } = useUnit();
  const customLogo = activeUnit?.store_info?.logo_url;
  const isMobile = useIsMobile();
  const isDashboard = location.pathname === '/';
  const moduleTitle = useMemo(() => getRouteTitle(location.pathname), [location.pathname]);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLgScreen, setIsLgScreen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

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

  const initials = useMemo(() => {
    const name = profile?.full_name || 'U';
    return name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
  }, [profile?.full_name]);

  if (isSigningOut) {
    return (
      <div className="animate-fade-in">
        <PageLoader logoUrl={customLogo} />
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background overflow-x-hidden">
        {/* Desktop Sidebar — hidden on mobile via shadcn Sidebar internals */}
        <AppSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          {/* ======= Unified Header (Mobile + Desktop) ======= */}
          <header
            className="fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out lg:sticky lg:top-0 lg:left-auto lg:right-auto"
            style={{
              paddingTop: isLgScreen ? '0' : 'env(safe-area-inset-top)',
              background: isDashboard
                ? (isScrolled ? 'hsl(var(--background) / 0.85)' : 'transparent')
                : 'hsl(var(--background) / 0.85)',
              backdropFilter: isScrolled || !isDashboard ? 'blur(20px) saturate(1.4)' : 'none',
              WebkitBackdropFilter: isScrolled || !isDashboard ? 'blur(20px) saturate(1.4)' : 'none',
              borderBottom: isScrolled ? '1px solid hsl(var(--border))' : '1px solid transparent',
              transition: 'background 0.4s ease, backdrop-filter 0.4s ease, border-color 0.4s ease',
            }}
          >
            <div className="relative overflow-hidden">
              <div className="flex items-center justify-between h-12 px-3.5 relative z-10">
                {/* Left: Logo pill (mobile) / Sidebar trigger + title (desktop) */}
                <div className="flex items-center gap-1 relative" style={{ minWidth: '2.5rem' }}>
                  {/* Desktop: sidebar trigger */}
                  <SidebarTrigger className="hidden lg:flex mr-1 text-foreground/70 hover:text-foreground" />

                  {/* Logo pill */}
                  <button
                    onClick={() => navigate('/')}
                    className={cn(
                      "flex items-center rounded-full overflow-hidden shrink-0 active:scale-95 transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)]",
                      !isScrolled
                        ? "h-9 bg-foreground/[0.08] backdrop-blur-xl pl-1.5 pr-3 gap-2"
                        : "h-8 w-8 bg-transparent p-0 justify-center"
                    )}
                  >
                    <div className={cn(
                      "rounded-full overflow-hidden flex items-center justify-center shrink-0 transition-all duration-500",
                      !isScrolled ? "w-6 h-6" : "w-8 h-8"
                    )}>
                      <div className="w-full h-full rounded-full overflow-hidden bg-card dark:bg-foreground flex items-center justify-center border border-border/30 dark:border-0">
                        <img alt="Garden Gestão" className="w-[85%] h-[85%] object-contain" src={customLogo || gardenLogo} fetchPriority="high" decoding="async" />
                      </div>
                    </div>
                    <span
                      className={cn(
                        "text-[13px] font-bold text-foreground whitespace-nowrap transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] overflow-hidden",
                        !isScrolled ? "max-w-[10rem] opacity-100" : "max-w-0 opacity-0"
                      )}
                      style={{ letterSpacing: '-0.01em' }}
                    >
                      {isDashboard ? 'Garden' : (moduleTitle || 'Garden')}
                    </span>
                  </button>
                </div>

                {/* Right: Theme toggle (desktop) + Notifications + Profile */}
                <div className="flex items-center gap-0.5">
                  <NotificationBell />
                  <ProfileDropdown />
                </div>
              </div>
            </div>
          </header>

          {/* ======= Main Content ======= */}
          <main
            className="flex-1"
            style={{ paddingTop: isLgScreen ? '0' : 'calc(env(safe-area-inset-top) + 3rem)' }}
          >
            <PageTransition>
              {children}
            </PageTransition>
          </main>
        </div>

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
        <OfflineBanner />
      </div>
    </SidebarProvider>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <CoinAnimationProvider>
      <AppLayoutContent>{children}</AppLayoutContent>
    </CoinAnimationProvider>
  );
}
