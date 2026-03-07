import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { ProfileDropdown } from './ProfileDropdown';
import { NotificationBell } from './NotificationBell';
import { getRouteTitle } from '@/hooks/useDocumentTitle';

export function DesktopHeader() {
  const location = useLocation();
  const title = useMemo(() => getRouteTitle(location.pathname), [location.pathname]);

  return (
    <header className="hidden lg:flex items-center h-14 px-4 border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-40">
      <SidebarTrigger className="mr-3" />

      <h1 className="text-sm font-semibold text-foreground truncate flex-1">
        {title || 'Garden Gestão'}
      </h1>

      <div className="flex items-center gap-1">
        <ThemeToggle className="w-8 h-8 rounded-lg" />
        <NotificationBell />
        <ProfileDropdown />
      </div>
    </header>
  );
}
