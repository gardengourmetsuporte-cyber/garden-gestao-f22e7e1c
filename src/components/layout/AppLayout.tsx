import { ReactNode, useState, useEffect, useRef } from 'react';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
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
import { useTimeAlerts } from '@/hooks/useTimeAlerts';

import { RankedAvatar } from '@/components/profile/RankedAvatar';
import { usePoints } from '@/hooks/usePoints';
import { getRank } from '@/lib/ranks';

interface AppLayoutProps {
  children: ReactNode;
}

interface NavItem {
  icon: string; // Material icon name via AppIcon
  label: string;
  href: string;
  adminOnly?: boolean;
  group: string;
  groupLabel: string;
}

// Module icon theme: rich 3D gradients with depth & glow
const MODULE_THEMES: Record<string, { gradient: string; shadow: string; iconColor: string; ring: string }> = {
  '/':             { gradient: 'linear-gradient(145deg, #818cf8 0%, #6366f1 50%, #4f46e5 100%)', shadow: '0 6px 20px rgba(99,102,241,0.5), 0 2px 6px rgba(79,70,229,0.3), inset 0 -2px 4px rgba(0,0,0,0.15)', iconColor: '#fff', ring: 'rgba(129,140,248,0.4)' },
  '/agenda':       { gradient: 'linear-gradient(145deg, #fcd34d 0%, #f59e0b 50%, #d97706 100%)', shadow: '0 6px 20px rgba(245,158,11,0.5), 0 2px 6px rgba(217,119,6,0.3), inset 0 -2px 4px rgba(0,0,0,0.15)', iconColor: '#fff', ring: 'rgba(252,211,77,0.4)' },
  '/finance':      { gradient: 'linear-gradient(145deg, #6ee7b7 0%, #10b981 50%, #059669 100%)', shadow: '0 6px 20px rgba(16,185,129,0.5), 0 2px 6px rgba(5,150,105,0.3), inset 0 -2px 4px rgba(0,0,0,0.15)', iconColor: '#fff', ring: 'rgba(110,231,183,0.4)' },
  '/inventory':    { gradient: 'linear-gradient(145deg, #fdba74 0%, #f97316 50%, #ea580c 100%)', shadow: '0 6px 20px rgba(249,115,22,0.5), 0 2px 6px rgba(234,88,12,0.3), inset 0 -2px 4px rgba(0,0,0,0.15)', iconColor: '#fff', ring: 'rgba(253,186,116,0.4)' },
  '/orders':       { gradient: 'linear-gradient(145deg, #93c5fd 0%, #3b82f6 50%, #2563eb 100%)', shadow: '0 6px 20px rgba(59,130,246,0.5), 0 2px 6px rgba(37,99,235,0.3), inset 0 -2px 4px rgba(0,0,0,0.15)', iconColor: '#fff', ring: 'rgba(147,197,253,0.4)' },
  '/checklists':   { gradient: 'linear-gradient(145deg, #c4b5fd 0%, #8b5cf6 50%, #7c3aed 100%)', shadow: '0 6px 20px rgba(139,92,246,0.5), 0 2px 6px rgba(124,58,237,0.3), inset 0 -2px 4px rgba(0,0,0,0.15)', iconColor: '#fff', ring: 'rgba(196,181,253,0.4)' },
  '/cash-closing': { gradient: 'linear-gradient(145deg, #f9a8d4 0%, #ec4899 50%, #db2777 100%)', shadow: '0 6px 20px rgba(236,72,153,0.5), 0 2px 6px rgba(219,39,119,0.3), inset 0 -2px 4px rgba(0,0,0,0.15)', iconColor: '#fff', ring: 'rgba(249,168,212,0.4)' },
  '/recipes':      { gradient: 'linear-gradient(145deg, #fca5a5 0%, #ef4444 50%, #dc2626 100%)', shadow: '0 6px 20px rgba(239,68,68,0.5), 0 2px 6px rgba(220,38,38,0.3), inset 0 -2px 4px rgba(0,0,0,0.15)', iconColor: '#fff', ring: 'rgba(252,165,165,0.4)' },
  '/employees':    { gradient: 'linear-gradient(145deg, #67e8f9 0%, #06b6d4 50%, #0891b2 100%)', shadow: '0 6px 20px rgba(6,182,212,0.5), 0 2px 6px rgba(8,145,178,0.3), inset 0 -2px 4px rgba(0,0,0,0.15)', iconColor: '#fff', ring: 'rgba(103,232,249,0.4)' },
  '/rewards':      { gradient: 'linear-gradient(145deg, #fde68a 0%, #eab308 50%, #ca8a04 100%)', shadow: '0 6px 20px rgba(234,179,8,0.5), 0 2px 6px rgba(202,138,4,0.3), inset 0 -2px 4px rgba(0,0,0,0.15)', iconColor: '#fff', ring: 'rgba(253,230,138,0.4)' },
  '/chat':         { gradient: 'linear-gradient(145deg, #5eead4 0%, #14b8a6 50%, #0d9488 100%)', shadow: '0 6px 20px rgba(20,184,166,0.5), 0 2px 6px rgba(13,148,136,0.3), inset 0 -2px 4px rgba(0,0,0,0.15)', iconColor: '#fff', ring: 'rgba(94,234,212,0.4)' },
  '/tablet-admin': { gradient: 'linear-gradient(145deg, #cbd5e1 0%, #64748b 50%, #475569 100%)', shadow: '0 6px 20px rgba(100,116,139,0.5), 0 2px 6px rgba(71,85,105,0.3), inset 0 -2px 4px rgba(0,0,0,0.15)', iconColor: '#fff', ring: 'rgba(203,213,225,0.4)' },
  '/cardapio':     { gradient: 'linear-gradient(145deg, #f0abfc 0%, #d946ef 50%, #c026d3 100%)', shadow: '0 6px 20px rgba(217,70,239,0.5), 0 2px 6px rgba(192,38,211,0.3), inset 0 -2px 4px rgba(0,0,0,0.15)', iconColor: '#fff', ring: 'rgba(240,171,252,0.4)' },
  '/whatsapp':     { gradient: 'linear-gradient(145deg, #86efac 0%, #22c55e 50%, #16a34a 100%)', shadow: '0 6px 20px rgba(34,197,94,0.5), 0 2px 6px rgba(22,163,74,0.3), inset 0 -2px 4px rgba(0,0,0,0.15)', iconColor: '#fff', ring: 'rgba(134,239,172,0.4)' },
  '/marketing':    { gradient: 'linear-gradient(145deg, #fda4af 0%, #f43f5e 50%, #e11d48 100%)', shadow: '0 6px 20px rgba(244,63,94,0.5), 0 2px 6px rgba(225,29,72,0.3), inset 0 -2px 4px rgba(0,0,0,0.15)', iconColor: '#fff', ring: 'rgba(253,164,175,0.4)' },
  '/settings':     { gradient: 'linear-gradient(145deg, #94a3b8 0%, #64748b 50%, #475569 100%)', shadow: '0 6px 20px rgba(71,85,105,0.45), 0 2px 6px rgba(51,65,85,0.3), inset 0 -2px 4px rgba(0,0,0,0.15)', iconColor: '#fff', ring: 'rgba(148,163,184,0.4)' },
};

const navItems: NavItem[] = [
  { icon: 'LayoutDashboard', label: 'Dashboard', href: '/', group: 'principal', groupLabel: 'Principal' },
  { icon: 'CalendarDays', label: 'Agenda', href: '/agenda', adminOnly: true, group: 'principal', groupLabel: 'Principal' },
  { icon: 'DollarSign', label: 'Financeiro', href: '/finance', adminOnly: true, group: 'gestao', groupLabel: 'Gestão' },
  { icon: 'Package', label: 'Estoque', href: '/inventory', group: 'gestao', groupLabel: 'Gestão' },
  { icon: 'ShoppingCart', label: 'Pedidos', href: '/orders', adminOnly: true, group: 'gestao', groupLabel: 'Gestão' },
  { icon: 'ClipboardCheck', label: 'Checklists', href: '/checklists', group: 'operacao', groupLabel: 'Operação' },
  { icon: 'Receipt', label: 'Fechamento', href: '/cash-closing', group: 'operacao', groupLabel: 'Operação' },
  { icon: 'ChefHat', label: 'Fichas Técnicas', href: '/recipes', adminOnly: true, group: 'operacao', groupLabel: 'Operação' },
  { icon: 'Users', label: 'Funcionários', href: '/employees', group: 'pessoas', groupLabel: 'Pessoas' },
  { icon: 'Gift', label: 'Recompensas', href: '/rewards', group: 'pessoas', groupLabel: 'Pessoas' },
  { icon: 'MessageCircle', label: 'Chat', href: '/chat', group: 'pessoas', groupLabel: 'Pessoas' },
  { icon: 'Monitor', label: 'Tablets', href: '/tablet-admin', adminOnly: true, group: 'producao', groupLabel: 'Em Produção' },
  { icon: 'BookOpen', label: 'Cardápio', href: '/cardapio', adminOnly: true, group: 'operacao', groupLabel: 'Operação' },
  { icon: 'MessageSquare', label: 'WhatsApp', href: '/whatsapp', adminOnly: true, group: 'operacao', groupLabel: 'Operação' },
  { icon: 'Megaphone', label: 'Marketing', href: '/marketing', adminOnly: true, group: 'gestao', groupLabel: 'Gestão' },
  { icon: 'Settings', label: 'Configurações', href: '/settings', group: 'config', groupLabel: 'Sistema' },
];

function AppLayoutContent({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unitDropdownOpen, setUnitDropdownOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  
  
  const location = useLocation();
  const navigate = useNavigate();

  // Edge swipe to open menu (from right edge)
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (sidebarOpen) return;
      const touch = e.touches[0];
      if (touch.clientX > window.innerWidth - 20) {
        touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
      }
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (sidebarOpen || !touchStartRef.current) return;
      const touch = e.touches[0];
      const dx = touchStartRef.current.x - touch.clientX;
      const dy = Math.abs(touch.clientY - touchStartRef.current.y);
      if (dx > 30 && dy < 50) {
        setSidebarOpen(true);
        touchStartRef.current = null;
      }
    };
    const handleTouchEnd = () => {
      if (!sidebarOpen) touchStartRef.current = null;
    };
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [sidebarOpen]);

  const { profile, isAdmin, signOut } = useAuth();
  const { units, activeUnit, setActiveUnitId, isTransitioning } = useUnit();
  const { isPulsing } = useCoinAnimation();
  const { unreadCount } = useNotifications();
  const { earned: earnedPoints } = usePoints();
  const rank = getRank(earnedPoints);
  const chatUnreadCount = useChatUnreadCount();
  const moduleStatuses = useModuleStatus();
  useTimeAlerts();
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
      

      {/* ======= Mobile Header ======= */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="bg-card backdrop-blur-xl border-b border-border/20">
          <div className="flex items-center justify-between h-14 px-3">
            <div className="w-10" />

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
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className="relative p-2 rounded-lg hover:bg-secondary transition-all"
                  >
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

      {/* ======= Expandable FAB ======= */}
      {/* Overlay when FAB is open */}
      {fabOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[55] bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={() => setFabOpen(false)}
        />
      )}

      {/* FAB sub-actions */}
      {fabOpen && !sidebarOpen && (
        <div
          className="lg:hidden fixed z-[60] flex flex-col-reverse items-center gap-3"
          style={{
            bottom: hasBottomNav
              ? 'calc(env(safe-area-inset-bottom) + 100px)'
              : 'calc(env(safe-area-inset-bottom) + 40px)',
            right: '23px',
            paddingBottom: '64px',
          }}
        >
          {/* Menu button */}
          <button
            onClick={() => { setFabOpen(false); setSidebarOpen(true); }}
            className="fab-action-enter w-11 h-11 rounded-full flex items-center justify-center bg-card/90 backdrop-blur-md border border-border/50 active:scale-90 transition-transform"
            style={{ animationDelay: '0ms', boxShadow: '0 4px 16px hsl(222 50% 3% / 0.5)' }}
          >
            <AppIcon name="Menu" size={20} className="text-foreground" />
          </button>

          {/* Home button */}
          {(
            <button
              onClick={() => { setFabOpen(false); navigate('/'); }}
              className="fab-action-enter w-11 h-11 rounded-full flex items-center justify-center bg-card/90 backdrop-blur-md border border-border/50 active:scale-90 transition-transform"
              style={{ animationDelay: '80ms', boxShadow: '0 4px 16px hsl(222 50% 3% / 0.5)' }}
            >
              <AppIcon name="Home" size={20} className="text-foreground" />
            </button>
          )}
        </div>
      )}

      {/* Main FAB button */}
      <button
        onClick={() => {
          if (sidebarOpen) {
            setSidebarOpen(false);
            setFabOpen(false);
          } else {
            setFabOpen(prev => !prev);
          }
        }}
        className={cn(
          "lg:hidden fixed z-[70] w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 active:scale-90",
          (fabOpen || sidebarOpen) ? "rotate-180 scale-90" : "hover:scale-105"
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
        {(fabOpen || sidebarOpen) ? (
          <AppIcon name="X" size={24} className="text-primary-foreground" />
        ) : (
          <AppIcon name="Grip" size={24} className="text-primary-foreground" />
        )}
        {!fabOpen && !sidebarOpen && activeUnit && (
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
        className={cn("min-h-screen animate-page-enter", "transition-all duration-300")}
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 3.75rem)' }}
      >
        {children}
      </main>

      {/* ======= Bottom Sheet Menu (Drawer) ======= */}
      <Drawer open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <DrawerContent className="border-t max-h-[90vh] rounded-t-3xl" style={{
          background: 'hsl(var(--background))',
          borderColor: 'hsl(var(--border) / 0.2)',
        }}>
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 rounded-full" style={{ background: 'hsl(var(--muted-foreground) / 0.25)' }} />
          </div>

          {/* Header: Logo + Unit + Profile */}
          <div className="flex items-center gap-3 px-5 pb-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0" style={{
              border: '1px solid hsl(var(--primary) / 0.2)',
              boxShadow: '0 0 12px hsl(var(--primary) / 0.1)',
            }}>
              <img alt="Logo" className="w-full h-full object-contain" src="/lovable-uploads/f33aaa21-284f-4287-9fbe-9f15768b7d65.jpg" />
            </div>

            {units.length > 0 ? (
              <div className="flex-1 min-w-0 relative">
                <button
                  onClick={() => setUnitDropdownOpen(!unitDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all w-full"
                  style={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border) / 0.3)',
                  }}
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{
                    background: activeUnit ? getThemeColor(activeUnit.slug) : 'hsl(var(--primary))',
                    boxShadow: activeUnit ? `0 0 6px ${getThemeColor(activeUnit.slug)}80` : undefined,
                  }} />
                  <span className="flex-1 text-left truncate text-foreground">{activeUnit?.name || 'Unidade'}</span>
                  <AppIcon name="ChevronDown" size={12} className={cn("text-muted-foreground transition-transform duration-200", unitDropdownOpen && "rotate-180")} />
                </button>
                {unitDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-xl overflow-hidden py-1" style={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border) / 0.4)',
                    boxShadow: 'var(--shadow-elevated)',
                  }}>
                    {units.map(unit => (
                      <button
                        key={unit.id}
                        onClick={() => { setActiveUnitId(unit.id); setUnitDropdownOpen(false); }}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-3 py-2.5 text-xs transition-all",
                          unit.id === activeUnit?.id ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                        )}
                      >
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: getThemeColor(unit.slug) }} />
                        <span className="truncate">{unit.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1">
                <h1 className="font-bold text-sm text-foreground">Garden</h1>
              </div>
            )}

            <button onClick={() => { navigate('/profile/me'); setSidebarOpen(false); }} className="shrink-0 active:scale-90 transition-transform">
              <RankedAvatar avatarUrl={profile?.avatar_url} earnedPoints={earnedPoints} size={36} />
            </button>
          </div>

          {/* Navigation */}
          <nav ref={navRef} className="flex-1 overflow-y-auto px-5 pb-8">
            {groupedNav.map((group, gi) => (
              <div key={group.label} className={cn(gi > 0 && "mt-5")}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-px flex-1" style={{ background: 'hsl(var(--border) / 0.15)' }} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] px-1" style={{ color: 'hsl(var(--muted-foreground) / 0.4)' }}>
                    {group.label}
                  </span>
                  <div className="h-px flex-1" style={{ background: 'hsl(var(--border) / 0.15)' }} />
                </div>
                <div className="grid grid-cols-4 gap-x-2 gap-y-4">
                  {group.items.map((item, idx) => {
                    const isActive = location.pathname === item.href;
                    const showBadge = (item.href === '/' && unreadCount > 0) || (item.href === '/chat' && chatUnreadCount > 0);
                    const badgeCount = item.href === '/chat' ? chatUnreadCount : unreadCount;
                    const moduleStatus = moduleStatuses[item.href];
                    const theme = MODULE_THEMES[item.href] || MODULE_THEMES['/'];

                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        data-active={isActive}
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          "flex flex-col items-center gap-2 py-1 text-center transition-all duration-200 relative active:scale-[0.88]",
                          "animate-fade-in",
                        )}
                        style={{ animationDelay: `${(gi * 4 + idx) * 30}ms` }}
                      >
                        <div className="relative">
                          {/* Glow behind active icon */}
                          {isActive && (
                            <div className="absolute inset-0 rounded-[18px] pointer-events-none" style={{
                              background: `radial-gradient(circle, ${theme.ring} 0%, transparent 70%)`,
                              transform: 'scale(1.6)',
                              filter: 'blur(6px)',
                            }} />
                          )}
                          <div
                            className="relative w-[54px] h-[54px] rounded-[16px] flex items-center justify-center overflow-hidden transition-transform duration-200"
                            style={{
                              background: theme.gradient,
                              boxShadow: isActive
                                ? theme.shadow
                                : `0 4px 12px rgba(0,0,0,0.25), inset 0 -2px 4px rgba(0,0,0,0.12)`,
                              transform: isActive ? 'scale(1.1) translateY(-2px)' : undefined,
                            }}
                          >
                            <AppIcon
                              name={item.icon}
                              size={24}
                              style={{
                                color: theme.iconColor,
                                filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.3))',
                              }}
                            />
                            {/* Glass highlight top half */}
                            <div className="absolute top-0 left-0 w-full h-[55%] pointer-events-none rounded-t-[16px]" style={{
                              background: 'linear-gradient(180deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.06) 70%, transparent 100%)',
                            }} />
                            {/* Bottom depth */}
                            <div className="absolute bottom-0 left-0 w-full h-[30%] pointer-events-none rounded-b-[16px]" style={{
                              background: 'linear-gradient(0deg, rgba(0,0,0,0.12) 0%, transparent 100%)',
                            }} />
                            {/* Corner specular */}
                            <div className="absolute top-[4px] left-[4px] w-3 h-3 rounded-full pointer-events-none" style={{
                              background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)',
                            }} />
                          </div>

                          {/* Badges */}
                          {showBadge && (
                            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full text-[8px] font-bold flex items-center justify-center animate-pulse border-2" style={{
                              background: 'hsl(var(--destructive))',
                              color: 'hsl(var(--destructive-foreground))',
                              borderColor: 'hsl(var(--background))',
                            }}>
                              {badgeCount > 9 ? '9+' : badgeCount}
                            </span>
                          )}
                          {moduleStatus && moduleStatus.level !== 'ok' && moduleStatus.count > 0 && (
                            <span
                              className={cn(
                                "absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full text-[8px] font-bold flex items-center justify-center border-2",
                                (moduleStatus.level === 'critical' || moduleStatus.level === 'warning') && "animate-pulse"
                              )}
                              style={{
                                background: moduleStatus.level === 'critical' ? 'hsl(var(--neon-red))' : 'hsl(var(--neon-amber))',
                                color: moduleStatus.level === 'critical' ? '#fff' : '#000',
                                borderColor: 'hsl(var(--background))',
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
                          "text-[10px] font-medium leading-tight max-w-full truncate transition-colors",
                          isActive ? "text-foreground" : "text-muted-foreground"
                        )}>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Logout */}
            <div className="mt-6 pt-3" style={{ borderTop: '1px solid hsl(var(--border) / 0.15)' }}>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-xs transition-all active:scale-[0.97]"
                style={{ color: 'hsl(var(--muted-foreground))' }}
              >
                <AppIcon name="LogOut" size={16} />
                <span className="font-medium">Sair da conta</span>
              </button>
            </div>
          </nav>
        </DrawerContent>
      </Drawer>


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
