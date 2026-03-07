import { ReactNode, useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import gardenLogo from '@/assets/logo.png';
import { PageLoader } from '@/components/PageLoader';
import { PageTransition } from './PageTransition';
import { AppIcon } from '@/components/ui/app-icon';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { CoinAnimationProvider, useCoinAnimation } from '@/contexts/CoinAnimationContext';
import { CoinAnimationLayer } from '@/components/animations/CoinAnimation';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { DesktopHeader } from './DesktopHeader';
import { NotificationBell } from './NotificationBell';
import { ProfileDropdown } from './ProfileDropdown';

import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { cn } from '@/lib/utils';
import { PushNotificationPrompt } from '@/components/notifications/PushNotificationPrompt';
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
  const { isTransitioning } = useUnit();
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
        <PageLoader />
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background overflow-x-hidden">
        {/* Desktop Sidebar — hidden on mobile via shadcn Sidebar internals */}
        <AppSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          {/* ======= Mobile Header ======= */}
          <header
            className="lg:hidden fixed top-0 left-0 right-0 z-50 border-b border-border/30"
            style={{
              paddingTop: 'env(safe-area-inset-top)',
              background: 'hsl(var(--background))',
            }}
          >
            <div className="relative overflow-hidden">
              <div className="flex items-center justify-between h-14 px-3 relative z-10">
                {/* Left: Logo pill */}
                <div className="flex items-center gap-1 relative" style={{ minWidth: '2.5rem' }}>
                  <button
                    onClick={() => navigate('/')}
                    className={cn(
                      "flex items-center rounded-full overflow-hidden shrink-0 active:scale-95 transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]",
                      !isScrolled
                        ? "h-9 bg-card border border-border/50 shadow-sm pl-2 pr-3.5 gap-2.5"
                        : "h-8 w-8 bg-transparent p-0 justify-center"
                    )}
                  >
                    <div className={cn(
                      "rounded-full overflow-hidden flex items-center justify-center shrink-0 transition-all duration-300",
                      !isScrolled ? "w-6 h-6" : "w-8 h-8"
                    )}>
                      <img alt="Garden Gestão" className="w-full h-full object-contain" src={gardenLogo} fetchPriority="high" decoding="async" />
                    </div>
                    <span
                      className={cn(
                        "text-xs font-semibold text-foreground whitespace-nowrap transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] overflow-hidden",
                        !isScrolled ? "max-w-[10rem] opacity-100" : "max-w-0 opacity-0"
                      )}
                      style={{ letterSpacing: '-0.01em' }}
                    >
                      {isDashboard ? 'Garden Gestão' : (moduleTitle || 'Garden Gestão')}
                    </span>
                  </button>
                </div>

                {/* Right: Notifications + Profile dropdown */}
                <div className="flex items-center gap-0.5">
                  <NotificationBell />
                  <ProfileDropdown />
                </div>
              </div>
            </div>
          </header>

          {/* ======= Desktop Header ======= */}
          <DesktopHeader />

          {/* ======= Main Content ======= */}
          <main
            className="flex-1 lg:pt-0"
            style={{ paddingTop: 'calc(env(safe-area-inset-top) + 3.5rem)' }}
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
