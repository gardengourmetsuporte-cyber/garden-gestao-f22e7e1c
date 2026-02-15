import { ReactNode, useState, useEffect, useRef, useCallback } from 'react';
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

const navItems: NavItem[] = [
  { icon: 'CalendarDays', label: 'Agenda', href: '/agenda', adminOnly: true, group: 'principal', groupLabel: 'Principal' },
  { icon: 'DollarSign', label: 'Financeiro', href: '/finance', adminOnly: true, group: 'gestao', groupLabel: 'Gestão' },
  { icon: 'Package', label: 'Estoque', href: '/inventory', group: 'gestao', groupLabel: 'Gestão' },
  { icon: 'ShoppingCart', label: 'Pedidos', href: '/orders', adminOnly: true, group: 'gestao', groupLabel: 'Gestão' },
  { icon: 'Megaphone', label: 'Marketing', href: '/marketing', adminOnly: true, group: 'gestao', groupLabel: 'Gestão' },
  { icon: 'ClipboardCheck', label: 'Checklists', href: '/checklists', group: 'operacao', groupLabel: 'Operação' },
  { icon: 'Receipt', label: 'Fechamento', href: '/cash-closing', group: 'operacao', groupLabel: 'Operação' },
  { icon: 'ChefHat', label: 'Fichas Técnicas', href: '/recipes', adminOnly: true, group: 'operacao', groupLabel: 'Operação' },
  { icon: 'BookOpen', label: 'Cardápio', href: '/cardapio', adminOnly: true, group: 'operacao', groupLabel: 'Operação' },
  { icon: 'MessageSquare', label: 'WhatsApp', href: '/whatsapp', adminOnly: true, group: 'operacao', groupLabel: 'Operação' },
  { icon: 'Users', label: 'Funcionários', href: '/employees', group: 'pessoas', groupLabel: 'Pessoas' },
  { icon: 'Gift', label: 'Recompensas', href: '/rewards', group: 'pessoas', groupLabel: 'Pessoas' },
  { icon: 'MessageCircle', label: 'Chat', href: '/chat', group: 'pessoas', groupLabel: 'Pessoas' },
  { icon: 'Monitor', label: 'Tablets', href: '/tablet-admin', adminOnly: true, group: 'producao', groupLabel: 'Produção' },
  { icon: 'Settings', label: 'Configurações', href: '/settings', group: 'config', groupLabel: 'Sistema' },
];

function AppLayoutContent({ children }: AppLayoutProps) {
  const [launcherOpen, setLauncherOpen] = useState(false);
  const [unitDropdownOpen, setUnitDropdownOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

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

  const hasBottomNav = location.pathname === '/finance' || location.pathname === '/chat';

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

  // Close launcher on route change
  useEffect(() => {
    setLauncherOpen(false);
  }, [location.pathname]);

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

      {/* ======= FAB (Launcher Trigger) ======= */}
      <button
        onClick={() => setLauncherOpen(!launcherOpen)}
        className={cn(
          "lg:hidden fixed z-[9999] rounded-full flex items-center justify-center transition-all duration-300 active:scale-90",
          launcherOpen ? "w-14 h-14 rotate-0" : "w-14 h-14 hover:scale-105"
        )}
        style={{
          bottom: hasBottomNav
            ? 'calc(env(safe-area-inset-bottom) + 84px)'
            : 'calc(env(safe-area-inset-bottom) + 24px)',
          right: '20px',
          background: launcherOpen
            ? 'hsl(var(--destructive))'
            : 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--neon-cyan)))',
          boxShadow: launcherOpen
            ? '0 4px 24px hsl(var(--destructive) / 0.4)'
            : '0 4px 24px hsl(var(--primary) / 0.4), 0 0 40px hsl(var(--neon-cyan) / 0.15)',
        }}
      >
        {launcherOpen ? (
          <AppIcon name="X" size={24} className="text-destructive-foreground" />
        ) : (
          <>
            <AppIcon name="Grip" size={24} className="text-primary-foreground" />
            {activeUnit && (
              <span
                className="absolute top-1 right-1 w-3 h-3 rounded-full border-2"
                style={{
                  borderColor: 'hsl(var(--primary))',
                  background: getThemeColor(activeUnit.slug),
                  boxShadow: `0 0 8px ${getThemeColor(activeUnit.slug)}80`,
                }}
              />
            )}
          </>
        )}
      </button>

      {/* ======= App Launcher Overlay ======= */}
      {launcherOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[9998] flex flex-col launcher-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setLauncherOpen(false);
          }}
        >
          {/* Scrollable content */}
          <div
            className="flex-1 overflow-y-auto px-5 launcher-content"
            style={{
              paddingTop: 'calc(env(safe-area-inset-top) + 80px)',
              paddingBottom: 'calc(env(safe-area-inset-bottom) + 100px)',
            }}
          >
            {/* Home Button */}
            <div className="flex justify-center mb-6 launcher-item" style={{ animationDelay: '0ms' }}>
              <button
                onClick={() => { navigate('/'); setLauncherOpen(false); }}
                className="flex flex-col items-center gap-2 active:scale-90 transition-transform"
              >
                <div
                  className="w-16 h-16 rounded-[20px] flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--neon-cyan)))',
                    boxShadow: '0 4px 20px hsl(var(--primary) / 0.4), 0 0 30px hsl(var(--neon-cyan) / 0.15)',
                  }}
                >
                  <AppIcon name="Home" size={28} className="text-primary-foreground" />
                </div>
                <span className="text-xs font-semibold text-foreground">Home</span>
              </button>
            </div>

            {/* Unit Selector */}
            {units.length > 1 && (
              <div className="flex justify-center mb-6 launcher-item" style={{ animationDelay: '40ms' }}>
                <div className="relative">
                  <button
                    onClick={() => setUnitDropdownOpen(!unitDropdownOpen)}
                    className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-card/80 backdrop-blur-xl border border-border/30 active:scale-95 transition-transform"
                  >
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{
                      background: activeUnit ? getThemeColor(activeUnit.slug) : 'hsl(var(--primary))',
                      boxShadow: activeUnit ? `0 0 8px ${getThemeColor(activeUnit.slug)}80` : undefined,
                    }} />
                    <span className="text-sm font-medium text-foreground">{activeUnit?.name || 'Unidade'}</span>
                    <AppIcon name="ChevronDown" size={14} className={cn("text-muted-foreground transition-transform", unitDropdownOpen && "rotate-180")} />
                  </button>
                  {unitDropdownOpen && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 rounded-2xl overflow-hidden py-1 bg-card/95 backdrop-blur-xl border border-border/40 min-w-[200px]" style={{
                      boxShadow: 'var(--shadow-elevated)',
                    }}>
                      {units.map(unit => (
                        <button
                          key={unit.id}
                          onClick={() => { setActiveUnitId(unit.id); setUnitDropdownOpen(false); }}
                          className={cn(
                            "w-full flex items-center gap-2.5 px-4 py-3 text-sm transition-all",
                            unit.id === activeUnit?.id ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                          )}
                        >
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: getThemeColor(unit.slug) }} />
                          <span className="truncate">{unit.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* App Grid by Group */}
            {groupedNav.map((group, gi) => (
              <div key={group.label} className={cn("mb-6 launcher-item")} style={{ animationDelay: `${(gi + 1) * 60 + 40}ms` }}>
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50 px-1 mb-3 block text-center">
                  {group.label}
                </span>
                <div className="grid grid-cols-4 gap-x-4 gap-y-5">
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.href;
                    const showBadge = (item.href === '/' && unreadCount > 0) || (item.href === '/chat' && chatUnreadCount > 0);
                    const badgeCount = item.href === '/chat' ? chatUnreadCount : unreadCount;
                    const moduleStatus = moduleStatuses[item.href];

                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={() => setLauncherOpen(false)}
                        className="flex flex-col items-center gap-1.5 active:scale-90 transition-all duration-150"
                      >
                        <div className="relative">
                          <div
                            className={cn(
                              "w-14 h-14 rounded-[16px] flex items-center justify-center transition-all duration-200",
                              isActive
                                ? "bg-primary shadow-lg shadow-primary/30"
                                : "bg-card/90 border border-border/40"
                            )}
                            style={{
                              boxShadow: isActive ? undefined : 'var(--shadow-card)',
                            }}
                          >
                            <AppIcon
                              name={item.icon}
                              size={24}
                              className={isActive ? "text-primary-foreground" : "text-muted-foreground"}
                              style={{
                                filter: isActive ? 'drop-shadow(0 1px 3px rgba(0,0,0,0.3))' : 'none',
                              }}
                            />
                          </div>

                          {/* Badges */}
                          {showBadge && (
                            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse bg-destructive text-destructive-foreground" style={{
                              border: '2px solid hsl(var(--background))',
                            }}>
                              {badgeCount > 9 ? '9+' : badgeCount}
                            </span>
                          )}
                          {moduleStatus && moduleStatus.level !== 'ok' && moduleStatus.count > 0 && (
                            <span
                              className={cn(
                                "absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full text-[9px] font-bold flex items-center justify-center",
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
                          "text-[11px] font-medium leading-tight max-w-full truncate transition-colors",
                          isActive ? "text-foreground" : "text-muted-foreground/80"
                        )}>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Profile + Logout */}
            <div className="launcher-item mt-2 mb-4" style={{ animationDelay: `${(groupedNav.length + 1) * 60 + 40}ms` }}>
              <div className="rounded-2xl bg-card/80 backdrop-blur-xl border border-border/30 overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
                <button
                  onClick={() => { navigate('/profile/me'); setLauncherOpen(false); }}
                  className="flex items-center gap-3 w-full px-4 py-3 active:bg-secondary/40 transition-colors"
                >
                  <RankedAvatar avatarUrl={profile?.avatar_url} earnedPoints={earnedPoints} size={36} />
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
                <div className="h-px bg-border/20" />
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2.5 w-full px-4 py-3 text-sm transition-all active:bg-secondary/40 text-muted-foreground"
                >
                  <AppIcon name="LogOut" size={18} />
                  <span className="font-medium">Sair da conta</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======= Main Content ======= */}
      <main
        className={cn(
          "min-h-screen animate-page-enter transition-all duration-300",
          launcherOpen && "pointer-events-none"
        )}
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 3.75rem)' }}
      >
        {children}
      </main>

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
