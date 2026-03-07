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
          className="flex items-center gap-2.5 px-3 h-14 border-b border-sidebar-border"
          style={{
            background: 'linear-gradient(145deg, hsl(var(--sidebar-background)), hsl(var(--sidebar-accent)))',
          }}
        >
          <button
            onClick={() => navigate('/')}
            className="w-8 h-8 rounded-lg overflow-hidden bg-white flex items-center justify-center active:scale-95 transition-transform shrink-0 shadow-sm"
          >
            <img alt="Garden" className="w-6 h-6 object-contain" src={gardenLogo} loading="lazy" decoding="async" />
          </button>
          {!collapsed && (
            <div className="flex-1 min-w-0 animate-fade-in">
              <p className="text-[13px] font-bold text-sidebar-foreground truncate leading-tight">
                {activeUnit?.name || 'Garden'}
              </p>
              <p className="text-[10px] text-sidebar-foreground/40 font-medium tracking-wide">Gestão Inteligente</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* User card */}
      {!collapsed && (
        <div className="px-2 pt-2">
          <button
            onClick={() => navigate('/profile/me')}
            className="flex items-center gap-3 px-2 py-2 w-full rounded-lg hover:bg-sidebar-accent transition-colors"
          >
            <RankedAvatar avatarUrl={profile?.avatar_url} earnedPoints={earnedPoints} size={32} />
            <div className="text-left min-w-0 flex-1">
              <p className="text-sm font-semibold text-sidebar-foreground truncate">{profile?.full_name || 'Usuário'}</p>
              <p className="text-[11px] font-medium" style={{ color: rank.color }}>{rank.title} · {earnedPoints} pts</p>
            </div>
          </button>
        </div>
      )}

      <SidebarSeparator />

      {/* Navigation */}
      <SidebarContent>
        {/* Home */}
        <SidebarGroup className="py-1">
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
                  <AppIcon name="Home" size={20} fill={location.pathname === '/' ? 1 : 0} />
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
                          <AppIcon name={item.icon} size={20} fill={isActive ? 1 : 0} />
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
