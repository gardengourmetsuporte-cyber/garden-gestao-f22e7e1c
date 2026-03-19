import { useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import gardenLogo from '@/assets/logo.png';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { usePoints } from '@/hooks/usePoints';
import { getRank } from '@/lib/ranks';
import { useUserModules } from '@/hooks/useAccessLevels';
import { getModuleKeyFromRoute } from '@/lib/modules';
import { MODULE_REQUIRED_PLAN, planSatisfies } from '@/lib/plans';
import { NAV_ITEMS, filterNavItems, groupNavItems } from '@/lib/navItems';
import { PointsDisplay } from '@/components/rewards/PointsDisplay';
import { RankedAvatar } from '@/components/profile/RankedAvatar';
import { PromoBanner } from './PromoBanner';
import { useCoinAnimation } from '@/contexts/CoinAnimationContext';
import { preloadRoute } from '@/lib/routePreload';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  const { profile, isAdmin, isSuperAdmin, plan } = useAuth();
  const { activeUnit } = useUnit();
  const { isPulsing } = useCoinAnimation();
  const { earned: earnedPoints } = usePoints();
  const rank = useMemo(() => getRank(earnedPoints), [earnedPoints]);

  const userModules = useUserModules();
  const { allowedModules, isLoading: accessLoading } = userModules;
  const hasAccessLevel = allowedModules !== null && allowedModules !== undefined;

  const isModuleLocked = (href: string): boolean => {
    const moduleKey = getModuleKeyFromRoute(href);
    if (!moduleKey) return false;
    const required = MODULE_REQUIRED_PLAN[moduleKey];
    if (!required) return false;
    return !planSatisfies(plan, required);
  };

  const filteredNavItems = useMemo(() => {
    return filterNavItems(NAV_ITEMS, {
      isSuperAdmin,
      isAdmin,
      hasAccessLevel,
      allowedModules,
      getModuleKeyFromRoute,
    });
  }, [isSuperAdmin, isAdmin, hasAccessLevel, allowedModules]);

  const groupedNav = useMemo(() => groupNavItems(filteredNavItems), [filteredNavItems]);

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      {/* Brand Header */}
      <SidebarHeader className="p-0">
        <div
          className={cn(
            "flex flex-col items-center border-b border-sidebar-border transition-all duration-300 overflow-hidden",
            collapsed ? "py-3 px-2" : "py-5 px-4"
          )}
          style={{
            background: 'linear-gradient(165deg, hsl(var(--sidebar-background)), hsl(var(--sidebar-accent) / 0.6), hsl(var(--sidebar-background)))',
          }}
        >
          <button
            onClick={() => navigate('/')}
            className={cn(
              "rounded-2xl overflow-hidden bg-white dark:bg-white/95 flex items-center justify-center active:scale-95 transition-all duration-300 shrink-0 shadow-lg shadow-primary/20 ring-2 ring-primary/20",
              collapsed ? "w-9 h-9 rounded-full" : "w-14 h-14"
            )}
          >
            <img
              alt="Garden"
              className={cn(
                "object-contain transition-all duration-300",
                collapsed ? "w-6 h-6" : "w-10 h-10"
              )}
              src={activeUnit?.store_info?.logo_url || gardenLogo}
              loading="lazy"
              decoding="async"
            />
          </button>
          {!collapsed && (
            <div className="mt-3 text-center animate-fade-in">
              <p className="text-sm font-extrabold text-sidebar-foreground truncate leading-tight tracking-tight">
                {activeUnit?.name || 'Garden'}
              </p>
              <p className="text-[10px] text-primary/70 font-semibold tracking-widest uppercase mt-0.5">
                Gestão Inteligente
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      {/* Navigation */}
      <SidebarContent>
        {/* Home */}
        <SidebarGroup className="pt-3 pb-1">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={location.pathname === '/'}
                tooltip="Início"
              >
                <Link
                  to="/"
                  onMouseEnter={() => void preloadRoute('/')}
                  className={cn(
                    location.pathname === '/' && "text-sidebar-primary font-semibold"
                  )}
                >
                  <AppIcon name="Home" size={22} fill={1} />
                  <span>Início</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Grouped nav */}
        {groupedNav.map((group) => (
          <SidebarGroup key={group.label} className="py-1">
            <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-[0.15em] text-sidebar-foreground/40">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = location.pathname === item.href;
                  const locked = isModuleLocked(item.href);
                  const targetHref = locked ? '/plans' : item.href;

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.label}
                        className={cn(
                          isActive && "text-sidebar-primary font-semibold bg-sidebar-primary/10",
                          locked && "opacity-50"
                        )}
                      >
                        <Link
                          to={targetHref}
                          onMouseEnter={() => void preloadRoute(targetHref)}
                        >
                          <AppIcon name={item.icon} size={22} fill={1} />
                          <span className="truncate flex-1">{item.label}</span>
                          {item.badge && (
                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-orange-500/15 text-orange-400 shrink-0">
                              {item.badge}
                            </span>
                          )}
                          {locked && <AppIcon name="Lock" size={14} className="text-sidebar-primary/60 shrink-0" />}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {/* Promo Banner */}
        {!collapsed && <PromoBanner />}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter>
        {!collapsed && (
          <div className="px-1 py-1">
            <PointsDisplay isPulsing={isPulsing} showLabel className="scale-90 origin-left" />
          </div>
        )}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
