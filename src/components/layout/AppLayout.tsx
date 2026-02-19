import { ReactNode, useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { ThemeToggle } from '@/components/ui/theme-toggle';

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
  { icon: 'Wallet', label: 'Finanças Pessoais', href: '/personal-finance', group: 'principal', groupLabel: 'Principal' },
  { icon: 'DollarSign', label: 'Financeiro', href: '/finance', adminOnly: true, group: 'gestao', groupLabel: 'Gestão' },
  { icon: 'Package', label: 'Estoque', href: '/inventory', group: 'gestao', groupLabel: 'Gestão' },
  { icon: 'ShoppingCart', label: 'Pedidos', href: '/orders', adminOnly: true, group: 'gestao', groupLabel: 'Gestão' },
  { icon: 'ClipboardCheck', label: 'Checklists', href: '/checklists', group: 'operacao', groupLabel: 'Operação' },
  { icon: 'Receipt', label: 'Fechamento', href: '/cash-closing', group: 'operacao', groupLabel: 'Operação' },
  { icon: 'ChefHat', label: 'Fichas Técnicas', href: '/recipes', adminOnly: true, group: 'operacao', groupLabel: 'Operação' },
  { icon: 'Users', label: 'Funcionários', href: '/employees', group: 'pessoas', groupLabel: 'Pessoas' },
  { icon: 'Gift', label: 'Recompensas', href: '/rewards', group: 'pessoas', groupLabel: 'Pessoas' },
  { icon: 'MessageCircle', label: 'Chat', href: '/chat', group: 'pessoas', groupLabel: 'Pessoas' },
  { icon: 'Settings', label: 'Configurações', href: '/settings', group: 'config', groupLabel: 'Sistema' },
  { icon: 'Monitor', label: 'Tablets', href: '/tablet-admin', adminOnly: true, group: 'em_producao', groupLabel: 'Em Produção' },
  { icon: 'Megaphone', label: 'Marketing', href: '/marketing', adminOnly: true, group: 'em_producao', groupLabel: 'Em Produção' },
  { icon: 'BookOpen', label: 'Cardápio', href: '/cardapio', adminOnly: true, group: 'em_producao', groupLabel: 'Em Produção' },
  { icon: 'MessageSquare', label: 'WhatsApp', href: '/whatsapp', adminOnly: true, group: 'em_producao', groupLabel: 'Em Produção' },
];

function AppLayoutContent({ children }: AppLayoutProps) {
  const [launcherOpen, setLauncherOpen] = useState(false);
  const [unitDropdownOpen, setUnitDropdownOpen] = useState(false);

  // Pull-to-refresh state
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const isPulling = useRef(false);
  const mainRef = useRef<HTMLElement>(null);
  const PULL_THRESHOLD = 60;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isRefreshing) return;
    const scrollTop = mainRef.current?.scrollTop ?? window.scrollY;
    if (scrollTop <= 0) {
      touchStartY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling.current || isRefreshing) return;
    const diff = e.touches[0].clientY - touchStartY.current;
    if (diff > 0) {
      // Direct DOM update for 60fps fluidity — skip React state during drag
      const distance = Math.min(diff * 0.5, 100);
      const indicator = mainRef.current?.querySelector('[data-pull-indicator]') as HTMLElement;
      if (indicator) {
        indicator.style.height = `${distance}px`;
        indicator.style.opacity = `${Math.min(distance / PULL_THRESHOLD, 1)}`;
        const spinner = indicator.firstElementChild as HTMLElement;
        if (spinner) spinner.style.transform = `rotate(${(distance / PULL_THRESHOLD) * 360}deg)`;
      }
      setPullDistance(distance);
    } else {
      isPulling.current = false;
      setPullDistance(0);
    }
  }, [isRefreshing]);

  const handleTouchEnd = useCallback(() => {
    if (!isPulling.current) return;
    isPulling.current = false;
    if (pullDistance >= PULL_THRESHOLD) {
      setIsRefreshing(true);
      setPullDistance(PULL_THRESHOLD * 0.6);
      window.location.reload();
    } else {
      setPullDistance(0);
    }
  }, [pullDistance]);

  const location = useLocation();
  const navigate = useNavigate();

  const { user, profile, isAdmin, signOut } = useAuth();
  const { units, activeUnit, setActiveUnitId, isTransitioning } = useUnit();
  const { isPulsing } = useCoinAnimation();
  const { unreadCount } = useNotifications();
  const { earned: earnedPoints } = usePoints();
  const rank = useMemo(() => getRank(earnedPoints), [earnedPoints]);
  const chatUnreadCount = useChatUnreadCount();
  const moduleStatuses = useModuleStatus();
  useTimeAlerts();
  const { leaderboard } = useLeaderboard();
  const myPosition = useMemo(() => leaderboard.find(e => e.user_id === user?.id)?.rank, [leaderboard, user?.id]);
  const [notifOpen, setNotifOpen] = useState(false);

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

  useEffect(() => {
    setLauncherOpen(false);
  }, [location.pathname]);

  const fabBottom = hasBottomNav
    ? 'calc(env(safe-area-inset-bottom) + 84px)'
    : 'calc(env(safe-area-inset-bottom) + 24px)';

  return (
    <div className="min-h-screen bg-background">

      {/* ======= Mobile Header ======= */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="bg-card backdrop-blur-xl border-b border-border/20">
          <div className="flex items-center justify-between h-14 px-3">
            <div className="flex items-center gap-1">
              <ThemeToggle className="p-1.5" />
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
                onClick={() => navigate('/ranking')}
                className="relative p-2 rounded-lg hover:bg-secondary transition-all"
              >
                <AppIcon name="Trophy" size={22} className="text-muted-foreground" style={{ filter: 'drop-shadow(0 0 4px hsl(var(--neon-amber) / 0.4))' }} />
                {myPosition && myPosition <= 3 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[16px] h-[16px] rounded-full text-[11px] font-bold flex items-center justify-center" style={{
                    background: 'hsl(var(--neon-amber) / 0.2)',
                    color: 'hsl(var(--neon-amber))',
                    border: '1.5px solid hsl(var(--card))',
                  }}>
                    #{myPosition}
                  </span>
                )}
              </button>
              <button
                onClick={() => navigate('/chat')}
                className="relative p-2 rounded-lg hover:bg-secondary transition-all"
              >
                <AppIcon name="MessageCircle" size={22} className="text-muted-foreground" style={{ filter: 'drop-shadow(0 0 4px hsl(215 20% 50% / 0.3))' }} />
                {chatUnreadCount > 0 && (
                   <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-destructive text-destructive-foreground text-[11px] font-bold flex items-center justify-center">
                    {chatUnreadCount > 9 ? '9+' : chatUnreadCount}
                  </span>
                )}
              </button>
              <Popover open={notifOpen} onOpenChange={setNotifOpen}>
                <PopoverTrigger asChild>
                  <button className="relative p-2 rounded-lg hover:bg-secondary transition-all">
                    <AppIcon name="Bell" size={22} className="text-muted-foreground" style={{ filter: 'drop-shadow(0 0 4px hsl(215 20% 50% / 0.3))' }} />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-destructive text-destructive-foreground text-[11px] font-bold flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-[calc(100vw-32px)] max-w-[340px] p-0 rounded-2xl border-border/50 bg-card max-h-[70vh] overflow-y-auto" sideOffset={8}>
                  <NotificationCard />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        </div>
      </header>

      {/* ======= Home button above FAB ======= */}
      {launcherOpen && (
        <button
          onClick={() => { navigate('/'); setLauncherOpen(false); }}
          className="lg:hidden fixed z-[9999] w-14 h-14 rounded-full flex items-center justify-center active:scale-90 transition-all duration-200 launcher-home-btn"
          style={{
            bottom: `calc(${hasBottomNav ? 'env(safe-area-inset-bottom) + 84px' : 'env(safe-area-inset-bottom) + 24px'} + 70px)`,
            right: '20px',
            background: 'linear-gradient(135deg, hsl(var(--neon-cyan)), hsl(var(--primary)))',
            boxShadow: '0 4px 20px hsl(var(--primary) / 0.4), 0 0 24px hsl(var(--neon-cyan) / 0.25)',
          }}
        >
          <AppIcon name="Home" size={24} className="text-primary-foreground" />
        </button>
      )}

      {/* ======= FAB (Launcher Trigger) ======= */}
      <button
        onClick={() => setLauncherOpen(!launcherOpen)}
        className={cn(
          "lg:hidden fixed z-[9999] rounded-full flex items-center justify-center transition-all duration-300",
          launcherOpen
            ? "w-14 h-14 fab-close-spin"
            : "w-14 h-14 hover:scale-110 active:scale-90 fab-idle-glow"
        )}
        style={{
          bottom: fabBottom,
          right: '20px',
          background: launcherOpen
            ? 'hsl(var(--destructive))'
            : 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--neon-cyan)))',
          boxShadow: launcherOpen
            ? '0 4px 24px hsl(var(--destructive) / 0.5)'
            : '0 4px 24px hsl(var(--primary) / 0.4), 0 0 40px hsl(var(--neon-cyan) / 0.2), 0 0 80px hsl(var(--neon-cyan) / 0.08)',
        }}
      >
        {launcherOpen ? (
          <AppIcon name="X" size={26} className="text-destructive-foreground" />
        ) : (
          <>
            {/* Rotating neon ring */}
            <div className="absolute inset-[-3px] rounded-full fab-neon-border opacity-60" />
            <AppIcon name="Grip" size={24} className="text-primary-foreground relative z-10" />
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
          <div
            className="flex-1 overflow-y-auto px-5 launcher-content"
            style={{
              paddingTop: 'calc(env(safe-area-inset-top) + 80px)',
              paddingBottom: 'calc(env(safe-area-inset-bottom) + 120px)',
            }}
          >
            {/* ===== Unit Selector (top-left corner) ===== */}
            {units.length > 0 && (
              <div className="absolute left-4 launcher-item" style={{ top: 'calc(env(safe-area-inset-top) + 20px)', animationDelay: '0ms', zIndex: 10000 }}>
                <button
                  className="relative p-2 rounded-xl hover:bg-white/10 transition-all"
                  onClick={() => setUnitDropdownOpen(prev => !prev)}
                >
                  <AppIcon name="Building2" size={24} className="text-white/80" style={{ filter: 'drop-shadow(0 0 6px hsl(215 20% 50% / 0.4))' }} />
                  <span
                    className="absolute top-1 right-1 w-3 h-3 rounded-full"
                    style={{
                      background: activeUnit ? getThemeColor(activeUnit.slug) : 'transparent',
                      boxShadow: activeUnit ? `0 0 6px ${getThemeColor(activeUnit.slug)}80` : 'none',
                      border: activeUnit ? '1.5px solid hsl(var(--card))' : 'none',
                      opacity: activeUnit ? 1 : 0,
                    }}
                  />
                </button>
                {unitDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-[220px] p-1 rounded-2xl border border-border/50 bg-card shadow-xl" style={{ zIndex: 10001 }}>
                    <div className="px-3 py-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/50">Unidade</span>
                    </div>
                    {units.map(unit => (
                      <button
                        key={unit.id}
                        onClick={() => { setActiveUnitId(unit.id); setUnitDropdownOpen(false); }}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all",
                          unit.id === activeUnit?.id ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                        )}
                      >
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: getThemeColor(unit.slug), boxShadow: `0 0 6px ${getThemeColor(unit.slug)}60` }} />
                        <span className="truncate font-medium">{unit.name}</span>
                        {unit.id === activeUnit?.id && <AppIcon name="Check" size={16} className="text-primary ml-auto shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ===== User Profile Card (top) ===== */}
            <div className="launcher-item mb-6" style={{ animationDelay: '0ms' }}>
              <button
                onClick={() => { navigate('/profile/me'); setLauncherOpen(false); }}
                className="flex flex-col items-center gap-3 w-full py-4 active:scale-95 transition-transform"
              >
                <div className="relative">
                  <RankedAvatar avatarUrl={profile?.avatar_url} earnedPoints={earnedPoints} size={72} userName={profile?.full_name || 'Usuário'} userId={user?.id} />
                  {/* Glow ring behind avatar */}
                  <div
                    className="absolute inset-[-4px] rounded-full -z-10"
                    style={{
                      background: `conic-gradient(from 0deg, hsl(var(--primary)), hsl(var(--neon-cyan)), hsl(var(--neon-purple)), hsl(var(--primary)))`,
                      filter: 'blur(8px)',
                      opacity: 0.4,
                    }}
                  />
                </div>
                <div className="text-center">
                  <p className="text-base font-bold" style={{ color: '#fff' }}>
                    {profile?.full_name || 'Usuário'}
                  </p>
                  <p className="text-xs font-semibold mt-0.5" style={{ color: rank.color }}>
                    {rank.title} · {earnedPoints} pts
                  </p>
                </div>
              </button>
            </div>

            {/* ===== App Grid by Group ===== */}
            {groupedNav.map((group, gi) => (
              <div key={group.label} className="mb-6 launcher-item" style={{ animationDelay: `${(gi + 1) * 60}ms` }}>
                <span className="text-xs font-bold uppercase tracking-[0.15em] px-1 mb-3 block text-center" style={{ color: 'hsl(220 20% 65%)' }}>
                  {group.label}
                </span>
                <div className="flex flex-wrap justify-center gap-x-6 gap-y-6">
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.href;
                    const showBadge = (item.href === '/' && unreadCount > 0) || (item.href === '/chat' && chatUnreadCount > 0);
                    const badgeCount = item.href === '/chat' ? chatUnreadCount : unreadCount;
                    const moduleStatus = moduleStatuses[item.href];
                    const isEmProducao = item.group === 'em_producao';

                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={() => setLauncherOpen(false)}
                        className="flex flex-col items-center gap-1.5 active:scale-90 transition-all duration-150 w-16"
                      >
                        <div className="relative">
                          <div
                            className={cn(
                              "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 relative",
                              isActive ? "bg-primary" : ""
                            )}
                            style={{
                              background: isActive
                                ? undefined
                                : 'linear-gradient(145deg, hsl(0 0% 95%), hsl(0 0% 88%))',
                              boxShadow: isActive
                                ? '0 4px 16px hsl(var(--primary) / 0.4)'
                                : 'none',
                              opacity: isEmProducao && !isActive ? 0.7 : 1,
                              border: isEmProducao && !isActive
                                ? '1px dashed hsl(var(--neon-amber) / 0.4)'
                                : isActive ? 'none' : '1px solid hsl(0 0% 100% / 0.5)',
                            }}
                          >
                            <AppIcon
                              name={item.icon}
                              size={22}
                              className={isActive ? "text-primary-foreground" : ""}
                              style={{
                                color: isActive
                                  ? undefined
                                  : isEmProducao
                                    ? 'hsl(var(--neon-amber) / 0.7)'
                                    : 'hsl(220 15% 35%)',
                                filter: isActive ? 'drop-shadow(0 1px 3px rgba(0,0,0,0.3))' : 'none',
                              }}
                            />
                          </div>

                          {/* Em Produção indicator */}
                          {isEmProducao && !isActive && (
                            <span className="absolute -top-1.5 -right-1.5 text-[10px] leading-none">
                              🚧
                            </span>
                          )}

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
                        <span
                          className="text-[11px] font-medium leading-tight max-w-full truncate transition-colors"
                          style={{ color: isActive ? '#fff' : 'hsl(220 20% 75%)' }}
                        >{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Logout */}
            <div className="launcher-item mt-2 mb-4" style={{ animationDelay: `${(groupedNav.length + 1) * 60}ms` }}>
              <button
                onClick={handleSignOut}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-2xl bg-card/60 backdrop-blur-xl border border-border/20 text-sm text-muted-foreground active:bg-secondary/40 transition-all"
              >
                <AppIcon name="LogOut" size={18} />
                <span className="font-medium">Sair da conta</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======= Desktop Sidebar ======= */}
      <aside className="hidden lg:flex fixed top-0 left-0 bottom-0 w-[260px] z-50 flex-col bg-card border-r border-border/20">
        {/* Logo + Unit */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-border/15 shrink-0">
          <button
            onClick={() => navigate('/')}
            className="w-9 h-9 rounded-xl overflow-hidden bg-white/10 border border-border/20 active:scale-95 transition-transform shrink-0"
          >
            <img alt="Logo" className="w-full h-full object-contain" src="/lovable-uploads/de20fd02-0c1c-4431-a4da-9c4611d2eb0e.jpg" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground truncate">{activeUnit?.name || 'Garden'}</p>
          </div>
          <ThemeToggle className="p-1.5 shrink-0" />
        </div>

        {/* User card */}
        <button
          onClick={() => navigate('/profile/me')}
          className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/40 transition-colors border-b border-border/10"
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
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all",
              location.pathname === '/'
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
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
                const showBadge = (item.href === '/chat' && chatUnreadCount > 0);
                const badgeCount = chatUnreadCount;
                const moduleStatus = moduleStatuses[item.href];
                const isEmProducao = item.group === 'em_producao';

                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all relative",
                      isActive
                        ? "bg-primary/15 text-primary"
                        : isEmProducao
                          ? "text-muted-foreground/60 hover:text-foreground hover:bg-secondary/30"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    )}
                  >
                    <AppIcon name={item.icon} size={20} />
                    <span className="truncate flex-1">{item.label}</span>
                    {isEmProducao && !isActive && <span className="text-[10px]">🚧</span>}
                    {showBadge && (
                      <span className="min-w-[18px] h-[18px] rounded-full text-[9px] font-bold flex items-center justify-center bg-destructive text-destructive-foreground">
                        {badgeCount > 9 ? '9+' : badgeCount}
                      </span>
                    )}
                    {moduleStatus && moduleStatus.level !== 'ok' && moduleStatus.count > 0 && (
                      <span
                        className="min-w-[18px] h-[18px] rounded-full text-[9px] font-bold flex items-center justify-center"
                        style={{
                          background: moduleStatus.level === 'critical' ? 'hsl(var(--neon-red))' : 'hsl(var(--neon-amber))',
                          color: moduleStatus.level === 'critical' ? '#fff' : '#000',
                        }}
                      >
                        {moduleStatus.count > 9 ? '9+' : moduleStatus.count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="px-3 py-3 border-t border-border/15 space-y-1 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5">
            <PointsDisplay isPulsing={isPulsing} showLabel className="scale-90 origin-left" />
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
          >
            <AppIcon name="LogOut" size={18} />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* ======= Main Content ======= */}
      <main
        ref={mainRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={cn(
          "min-h-screen animate-page-enter transition-all duration-300 lg:ml-[260px] lg:pt-0",
          launcherOpen && "pointer-events-none"
        )}
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 5.5rem)' }}
      >
        {/* Pull-to-refresh indicator */}
        <div
          data-pull-indicator
          className="flex items-center justify-center overflow-hidden"
          style={{
            height: isRefreshing ? `${PULL_THRESHOLD * 0.6}px` : pullDistance > 0 ? `${pullDistance}px` : '0px',
            opacity: isRefreshing ? 1 : Math.min(pullDistance / PULL_THRESHOLD, 1),
            transition: isPulling.current ? 'none' : 'height 0.15s ease-out, opacity 0.15s ease-out',
          }}
        >
          <div
            className={cn(
              "w-7 h-7 rounded-full border-2 border-primary border-t-transparent",
              isRefreshing ? "animate-spin" : ""
            )}
            style={{
              transform: isRefreshing ? 'none' : `rotate(${(pullDistance / PULL_THRESHOLD) * 360}deg)`,
            }}
          />
        </div>
        {children}
      </main>

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
