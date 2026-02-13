import { ReactNode, useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, ClipboardCheck, Settings, LogOut, Menu, X,
  User, Shield, Gift, CalendarDays, DollarSign, Receipt, ChefHat, Users, Bell, ChevronRight, Building2, ChevronDown, MessageCircle, Monitor, MessageSquare, BookOpen, ShoppingCart
} from 'lucide-react';
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
import { useModuleStatus, type StatusLevel } from '@/hooks/useModuleStatus';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { RankedAvatar } from '@/components/profile/RankedAvatar';
import { usePoints } from '@/hooks/usePoints';
import { getRank } from '@/lib/ranks';

interface AppLayoutProps {
  children: ReactNode;
}

interface NavItem {
  icon: typeof Package;
  label: string;
  href: string;
  adminOnly?: boolean;
  group: string;
  groupLabel: string;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/', group: 'principal', groupLabel: 'Principal' },
  { icon: CalendarDays, label: 'Agenda', href: '/agenda', adminOnly: true, group: 'principal', groupLabel: 'Principal' },
  { icon: DollarSign, label: 'Financeiro', href: '/finance', adminOnly: true, group: 'gestao', groupLabel: 'Gestão' },
  { icon: Package, label: 'Estoque', href: '/inventory', group: 'gestao', groupLabel: 'Gestão' },
  { icon: ShoppingCart, label: 'Pedidos', href: '/orders', adminOnly: true, group: 'gestao', groupLabel: 'Gestão' },
  { icon: ClipboardCheck, label: 'Checklists', href: '/checklists', group: 'operacao', groupLabel: 'Operação' },
  { icon: Receipt, label: 'Fechamento', href: '/cash-closing', group: 'operacao', groupLabel: 'Operação' },
  { icon: ChefHat, label: 'Fichas Técnicas', href: '/recipes', adminOnly: true, group: 'operacao', groupLabel: 'Operação' },
  { icon: Users, label: 'Funcionários', href: '/employees', group: 'pessoas', groupLabel: 'Pessoas' },
  { icon: Gift, label: 'Recompensas', href: '/rewards', group: 'pessoas', groupLabel: 'Pessoas' },
  { icon: MessageCircle, label: 'Chat', href: '/chat', group: 'pessoas', groupLabel: 'Pessoas' },
  { icon: Monitor, label: 'Tablets', href: '/tablet-admin', adminOnly: true, group: 'producao', groupLabel: 'Em Produção' },
  { icon: BookOpen, label: 'Cardápio', href: '/cardapio', adminOnly: true, group: 'operacao', groupLabel: 'Operação' },
  { icon: MessageSquare, label: 'WhatsApp', href: '/whatsapp', adminOnly: true, group: 'operacao', groupLabel: 'Operação' },
  { icon: Settings, label: 'Configurações', href: '/settings', group: 'config', groupLabel: 'Sistema' },
];

function AppLayoutContent({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unitDropdownOpen, setUnitDropdownOpen] = useState(false);
  const [sidebarDragX, setSidebarDragX] = useState<number | null>(null);
  const [backSwipeX, setBackSwipeX] = useState<number | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isDraggingSidebarRef = useRef(false);
  const backSwipeRef = useRef<{ x: number; y: number; active: boolean } | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Edge swipe to open sidebar (from right edge) + left edge swipe to go back
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (sidebarOpen) return;
      const touch = e.touches[0];
      // Right edge → sidebar
      if (touch.clientX > window.innerWidth - 20) {
        touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
      }
      // Left edge → back navigation (only if not on dashboard)
      if (touch.clientX < 24 && location.pathname !== '/') {
        backSwipeRef.current = { x: touch.clientX, y: touch.clientY, active: false };
      }
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (sidebarOpen) return;
      const touch = e.touches[0];
      // Sidebar open gesture
      if (touchStartRef.current) {
        const dx = touchStartRef.current.x - touch.clientX;
        const dy = Math.abs(touch.clientY - touchStartRef.current.y);
        if (dx > 30 && dy < 50) {
          setSidebarOpen(true);
          touchStartRef.current = null;
        }
      }
      // Back swipe gesture
      if (backSwipeRef.current) {
        const dx = touch.clientX - backSwipeRef.current.x;
        const dy = Math.abs(touch.clientY - backSwipeRef.current.y);
        if (!backSwipeRef.current.active && dx > 10 && dy < 40) {
          backSwipeRef.current.active = true;
        }
        if (backSwipeRef.current.active) {
          setBackSwipeX(Math.max(0, Math.min(dx, window.innerWidth)));
        }
      }
    };
    const handleTouchEnd = () => {
      if (!sidebarOpen) touchStartRef.current = null;
      if (backSwipeRef.current?.active && backSwipeX !== null) {
        if (backSwipeX > window.innerWidth * 0.3) {
          navigate(-1);
        }
        setBackSwipeX(null);
      }
      backSwipeRef.current = null;
    };
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [sidebarOpen, location.pathname, backSwipeX, navigate]);

  // Sidebar drag-to-close handlers
  const sidebarTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    isDraggingSidebarRef.current = false;
    setSidebarDragX(null);
  };
  const sidebarTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = Math.abs(touch.clientY - touchStartRef.current.y);
    if (!isDraggingSidebarRef.current && dx > 10 && dy < 30) {
      isDraggingSidebarRef.current = true;
    }
    if (isDraggingSidebarRef.current) {
      setSidebarDragX(Math.max(0, dx));
    }
  };
  const sidebarTouchEnd = () => {
    if (isDraggingSidebarRef.current && sidebarDragX !== null) {
      const sidebarWidth = Math.min(window.innerWidth * 0.85, 360);
      if (sidebarDragX > sidebarWidth * 0.3) {
        setSidebarOpen(false);
      }
    }
    setSidebarDragX(null);
    isDraggingSidebarRef.current = false;
    touchStartRef.current = null;
  };
  const { profile, isAdmin, signOut } = useAuth();
  const { units, activeUnit, setActiveUnitId, isTransitioning } = useUnit();
  const { isPulsing } = useCoinAnimation();
  const { unreadCount } = useNotifications();
  const { earned: earnedPoints } = usePoints();
  const rank = getRank(earnedPoints);
  const chatUnreadCount = useChatUnreadCount();
  const moduleStatuses = useModuleStatus();
  const navRef = useRef<HTMLElement>(null);

  // Pages with bottom navigation bars that conflict with the FAB
  const hasBottomNav = location.pathname === '/finance';

  // Scroll sidebar nav to active item when opened
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

  const filteredNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

  // Group nav items by group
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
      {/* ======= Back Swipe Indicator ======= */}
      {backSwipeX !== null && backSwipeX > 0 && (
        <div className="lg:hidden fixed inset-0 z-[60] pointer-events-none">
          {/* Dark overlay that fades in */}
          <div
            className="absolute inset-0 bg-black/40"
            style={{ opacity: Math.min(backSwipeX / (window.innerWidth * 0.4), 0.6) }}
          />
          {/* Arrow indicator */}
          <div
            className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center"
            style={{
              left: Math.min(backSwipeX - 40, 60),
              opacity: Math.min(backSwipeX / 80, 1),
              transition: 'none',
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: backSwipeX > window.innerWidth * 0.3
                  ? 'hsl(var(--neon-cyan) / 0.3)'
                  : 'hsl(var(--card) / 0.8)',
                border: `1px solid ${backSwipeX > window.innerWidth * 0.3 ? 'hsl(var(--neon-cyan) / 0.6)' : 'hsl(var(--border) / 0.5)'}`,
                boxShadow: backSwipeX > window.innerWidth * 0.3
                  ? '0 0 20px hsl(var(--neon-cyan) / 0.4)'
                  : '0 4px 12px hsl(0 0% 0% / 0.3)',
              }}
            >
              <ChevronRight className="w-5 h-5 rotate-180" style={{ color: backSwipeX > window.innerWidth * 0.3 ? 'hsl(var(--neon-cyan))' : 'hsl(var(--muted-foreground))' }} />
            </div>
          </div>
        </div>
      )}
      {/* ======= Mobile Header ======= */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="bg-card backdrop-blur-xl border-b border-border/20">
          <div className="flex items-center justify-between h-14 px-3">
            <div className="w-10" /> {/* Spacer for removed menu button */}

            {/* Centered Garden Logo */}
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
                <MessageCircle className="w-[22px] h-[22px] text-muted-foreground" />
                {chatUnreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-destructive text-destructive-foreground text-[7px] font-bold flex items-center justify-center">
                    {chatUnreadCount > 9 ? '9+' : chatUnreadCount}
                  </span>
                )}
              </button>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className="relative p-2 rounded-lg hover:bg-secondary transition-all"
                  >
                    <Bell className="w-[22px] h-[22px] text-muted-foreground" />
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

      {/* ======= Sidebar Overlay ======= */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm animate-fade-in"
          style={sidebarDragX !== null ? { opacity: Math.max(0, 1 - sidebarDragX / Math.min(window.innerWidth * 0.85, 360)) } : undefined}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ======= Sidebar ======= */}
      <aside
        onTouchStart={sidebarTouchStart}
        onTouchMove={sidebarTouchMove}
        onTouchEnd={sidebarTouchEnd}
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-[85vw] max-w-[360px] flex flex-col",
          "bg-background/95 backdrop-blur-2xl",
          "lg:translate-x-0 lg:right-auto lg:left-0",
          sidebarOpen ? "" : "translate-x-full lg:translate-x-0",
          sidebarDragX === null && "transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
        )}
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          borderLeft: '1px solid hsl(var(--neon-cyan) / 0.1)',
          boxShadow: sidebarOpen ? '-4px 0 40px hsl(222 50% 3% / 0.7), 0 0 60px hsl(var(--neon-cyan) / 0.05)' : 'none',
          ...(sidebarOpen && sidebarDragX !== null ? { transform: `translateX(${sidebarDragX}px)` } : {})
        }}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-14 px-4 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl overflow-hidden border border-primary/30"
              style={{ boxShadow: '0 0 12px hsl(var(--primary) / 0.2)' }}
            >
              <img alt="Logo" className="w-full h-full object-contain" src="/lovable-uploads/f33aaa21-284f-4287-9fbe-9f15768b7d65.jpg" />
            </div>
            <div>
              <h1 className="font-bold text-sm text-foreground tracking-tight">Garden</h1>
              <p className="text-[9px] text-muted-foreground uppercase tracking-[0.2em]">Command Center</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-xl hover:bg-secondary active:scale-95 transition-all"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Divider line */}
        <div className="mx-4 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />

        {/* Unit Selector */}
        {units.length > 0 && (
          <div className="px-4 pt-3 shrink-0">
            <div className="relative">
              <button
                onClick={() => setUnitDropdownOpen(!unitDropdownOpen)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: 'linear-gradient(135deg, hsl(var(--primary) / 0.08), hsl(var(--neon-cyan) / 0.04))',
                  border: '1px solid hsl(var(--neon-cyan) / 0.15)',
                }}
              >
                <Building2 className="w-4 h-4 text-primary shrink-0" />
                <span className="flex-1 text-left truncate text-foreground">
                  {activeUnit?.name || 'Selecionar Unidade'}
                </span>
                <ChevronDown className={cn(
                  "w-3.5 h-3.5 text-muted-foreground transition-transform duration-200",
                  unitDropdownOpen && "rotate-180"
                )} />
              </button>
              {unitDropdownOpen && (
                <div
                  className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xl overflow-hidden py-1"
                  style={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border) / 0.4)',
                    boxShadow: '0 8px 32px hsl(222 50% 3% / 0.6)',
                  }}
                >
                  {units.map(unit => (
                    <button
                      key={unit.id}
                      onClick={() => {
                        setActiveUnitId(unit.id);
                        setUnitDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-all",
                        unit.id === activeUnit?.id
                          ? "text-primary bg-primary/10"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                      )}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: getThemeColor(unit.slug) }}
                      />
                      <span className="truncate">{unit.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        {/* User Card */}
        <div className="p-4 shrink-0">
          <div
            className="rounded-xl p-3 cursor-pointer active:scale-[0.98] transition-all"
            onClick={() => { navigate('/profile/me'); setSidebarOpen(false); }}
            style={{
              background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(222 45% 10%) 100%)',
              border: '1px solid hsl(var(--neon-cyan) / 0.15)',
              boxShadow: '0 0 20px hsl(var(--neon-cyan) / 0.05), inset 0 1px 0 hsl(0 0% 100% / 0.03)'
            }}
          >
            <div className="flex items-center gap-3">
              <RankedAvatar avatarUrl={profile?.avatar_url} earnedPoints={earnedPoints} size={42} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground truncate">
                  {profile?.full_name || 'Usuário'}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className="text-[9px] font-bold uppercase tracking-wider"
                    style={{ color: rank.color }}
                  >
                    {rank.title}
                  </span>
                  <span className="text-[8px] text-muted-foreground">•</span>
                  <span className="text-[10px] text-muted-foreground">
                    {isAdmin ? 'Admin' : 'Staff'}
                  </span>
                </div>
              </div>
            </div>
            {/* Points */}
            <div className="mt-3 pt-2.5" style={{ borderTop: '1px solid hsl(var(--border) / 0.3)' }}>
              <PointsDisplay isPulsing={isPulsing} />
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav ref={navRef} className="flex-1 overflow-y-auto px-3 pb-3 space-y-5">
          {groupedNav.map((group) => (
            <div key={group.label}>
              {/* Group Label */}
              <div className="px-3 mb-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60">
                  {group.label}
                </span>
              </div>
              {/* Group Items */}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.href;
                  const showBadge = (item.href === '/' && unreadCount > 0) || (item.href === '/chat' && chatUnreadCount > 0);
                  const badgeCount = item.href === '/chat' ? chatUnreadCount : unreadCount;
                  const moduleStatus = moduleStatuses[item.href];

                  return (
                    <TooltipProvider key={item.href}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            to={item.href}
                            data-active={isActive}
                            onClick={() => setSidebarOpen(false)}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative group",
                              isActive
                                ? "text-foreground"
                                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50 active:scale-[0.98]"
                            )}
                            style={isActive ? {
                              background: 'linear-gradient(135deg, hsl(var(--primary) / 0.12), hsl(var(--neon-cyan) / 0.06))',
                              border: '1px solid hsl(var(--neon-cyan) / 0.2)',
                              boxShadow: '0 0 12px hsl(var(--neon-cyan) / 0.08)'
                            } : undefined}
                          >
                            {/* Active indicator bar */}
                            {isActive && (
                              <div
                                className="absolute right-0 lg:right-auto lg:left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-l-full lg:rounded-l-none lg:rounded-r-full"
                                style={{
                                  background: 'hsl(var(--neon-cyan))',
                                  boxShadow: '0 0 8px hsl(var(--neon-cyan) / 0.5)'
                                }}
                              />
                            )}

                            {/* Icon container */}
                            <div
                              className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200",
                                isActive ? "" : "group-hover:bg-secondary/60"
                              )}
                              style={isActive ? {
                                background: 'hsl(var(--primary) / 0.15)',
                                boxShadow: '0 0 8px hsl(var(--primary) / 0.1)'
                              } : undefined}
                            >
                              <div className="relative">
                                <item.icon className={cn(
                                  "w-[18px] h-[18px]",
                                  isActive ? "text-primary" : ""
                                )} />
                                {showBadge && (
                                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[8px] font-bold flex items-center justify-center animate-pulse">
                                    {badgeCount > 9 ? '9+' : badgeCount}
                                  </span>
                                )}
                              </div>
                            </div>

                            <span className="flex-1">{item.label}</span>

                            {/* Module status indicators */}
                            {moduleStatus && moduleStatus.level !== 'ok' && moduleStatus.count > 0 ? (
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={cn(
                                    "w-4 h-4 rounded-full text-[8px] font-bold flex items-center justify-center shrink-0",
                                    moduleStatus.level === 'critical' && "animate-pulse"
                                  )}
                                  style={{
                                    background: moduleStatus.level === 'critical'
                                      ? 'hsl(var(--neon-red))'
                                      : 'hsl(var(--neon-amber))',
                                    color: moduleStatus.level === 'critical'
                                      ? 'hsl(0 0% 100%)'
                                      : 'hsl(0 0% 0%)',
                                    boxShadow: moduleStatus.level === 'critical'
                                      ? '0 0 8px hsl(var(--neon-red) / 0.5)'
                                      : '0 0 8px hsl(var(--neon-amber) / 0.4)',
                                  }}
                                >
                                  {moduleStatus.count > 9 ? '9+' : moduleStatus.count}
                                </span>
                              </div>
                            ) : moduleStatus && moduleStatus.level === 'ok' ? (
                              <div
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{
                                  background: 'hsl(var(--neon-green))',
                                  boxShadow: '0 0 6px hsl(var(--neon-green) / 0.5)',
                                }}
                              />
                            ) : isActive ? (
                              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
                            ) : null}
                          </Link>
                        </TooltipTrigger>
                        {moduleStatus && (
                          <TooltipContent side="right" className="text-xs">
                            {moduleStatus.tooltip}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="shrink-0 p-3">
          <div className="mx-1 h-px bg-gradient-to-r from-transparent via-border/30 to-transparent mb-3" />
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all active:scale-[0.98] group"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center group-hover:bg-destructive/10 transition-colors">
              <LogOut className="w-[18px] h-[18px]" />
            </div>
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* ======= Floating Menu FAB ======= */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={cn(
          "lg:hidden fixed z-[60] w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 active:scale-90",
          sidebarOpen ? "rotate-180 scale-90" : "hover:scale-105"
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
        {sidebarOpen ? (
          <X className="w-6 h-6 text-primary-foreground" />
        ) : (
          <Menu className="w-6 h-6 text-primary-foreground" />
        )}
        {!sidebarOpen && activeUnit && (
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
        className={cn("min-h-screen lg:pt-0 lg:pl-[360px] animate-page-enter", "transition-all duration-300")}
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
