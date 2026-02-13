import { ReactNode, useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, ClipboardCheck, Settings, LogOut, Menu, X,
  User, Shield, Gift, CalendarDays, DollarSign, Receipt, ChefHat, Users, Bell, ChevronRight, Building2, ChevronDown, MessageCircle, Monitor, MessageSquare, BookOpen
} from 'lucide-react';
import { PointsDisplay } from '@/components/rewards/PointsDisplay';
import { CoinAnimationProvider, useCoinAnimation } from '@/contexts/CoinAnimationContext';
import { CoinAnimationLayer } from '@/components/animations/CoinAnimation';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { getThemeColor } from '@/lib/unitThemes';
import { cn } from '@/lib/utils';
import { PushNotificationPrompt } from '@/components/notifications/PushNotificationPrompt';
import { useNotifications } from '@/hooks/useNotifications';
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
  const { profile, isAdmin, signOut } = useAuth();
  const { units, activeUnit, setActiveUnitId, isTransitioning } = useUnit();
  const { isPulsing } = useCoinAnimation();
  const { unreadCount } = useNotifications();
  const { earned: earnedPoints } = usePoints();
  const rank = getRank(earnedPoints);
  const chatUnreadCount = useChatUnreadCount();
  const moduleStatuses = useModuleStatus();
  const navigate = useNavigate();
  const navRef = useRef<HTMLElement>(null);

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
        className="lg:hidden fixed top-0 left-0 right-0 z-50"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="bg-card backdrop-blur-xl border-b border-border/20">
          <div className="flex items-center justify-between h-14 px-3">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2.5 rounded-xl hover:bg-secondary active:scale-95 transition-all touch-manipulation"
                style={{ minWidth: 44, minHeight: 44 }}
              >
                <Menu className="w-[22px] h-[22px] text-muted-foreground" />
              </button>
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/10 backdrop-blur-sm border border-border/20">
                <img alt="Logo" className="w-full h-full object-contain" src="/lovable-uploads/de20fd02-0c1c-4431-a4da-9c4611d2eb0e.jpg" />
              </div>
              {activeUnit && (
                <span className="text-xs font-medium text-muted-foreground truncate max-w-[120px]">
                  {activeUnit.name}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <span className={cn(
                "px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider uppercase",
                isAdmin
                  ? "bg-primary/15 text-primary border border-primary/20"
                  : "bg-secondary text-muted-foreground border border-border/20"
              )}>
                {isAdmin ? 'Admin' : 'Staff'}
              </span>
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
              <button
                onClick={() => navigate('/')}
                className="relative p-2 rounded-lg hover:bg-secondary transition-all"
              >
                <Bell className="w-[22px] h-[22px] text-muted-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-destructive text-destructive-foreground text-[7px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        </div>
      </header>

      {/* ======= Sidebar Overlay ======= */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ======= Sidebar ======= */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-[280px] flex flex-col",
          "bg-background/95 backdrop-blur-2xl",
          "transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          "lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          borderRight: '1px solid hsl(var(--neon-cyan) / 0.1)',
          boxShadow: sidebarOpen ? '4px 0 40px hsl(222 50% 3% / 0.7), 0 0 60px hsl(var(--neon-cyan) / 0.05)' : 'none'
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
                                className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
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

      {/* ======= Main Content ======= */}
      <main
        className={cn("min-h-screen lg:pt-0 lg:pl-[280px]", "transition-all duration-300")}
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
