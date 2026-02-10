import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, ClipboardCheck, Settings, LogOut, Menu, X,
  User, Shield, Gift, CalendarDays, DollarSign, Receipt, ChefHat, Users, Bell, ChevronRight
} from 'lucide-react';
import { PointsDisplay } from '@/components/rewards/PointsDisplay';
import { CoinAnimationProvider, useCoinAnimation } from '@/contexts/CoinAnimationContext';
import { CoinAnimationLayer } from '@/components/animations/CoinAnimation';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { PushNotificationPrompt } from '@/components/notifications/PushNotificationPrompt';
import { useNotifications } from '@/hooks/useNotifications';

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
  { icon: Settings, label: 'Configurações', href: '/settings', group: 'config', groupLabel: 'Sistema' },
];

function AppLayoutContent({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile, isAdmin, signOut } = useAuth();
  const { isPulsing } = useCoinAnimation();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();

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
        <div className="bg-card/90 backdrop-blur-xl border-b border-border/20">
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
            </div>

            <div className="flex items-center gap-2">
              <span className={cn(
                "px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider uppercase",
                isAdmin
                  ? "bg-primary/15 text-primary border border-primary/20"
                  : "bg-secondary text-muted-foreground border border-border/20"
              )}>
                {isAdmin ? 'Admin' : 'Staff'}
              </span>
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

        {/* User Card */}
        <div className="p-4 shrink-0">
          <div
            className="rounded-xl p-3"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(222 45% 10%) 100%)',
              border: '1px solid hsl(var(--neon-cyan) / 0.15)',
              boxShadow: '0 0 20px hsl(var(--neon-cyan) / 0.05), inset 0 1px 0 hsl(0 0% 100% / 0.03)'
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden shrink-0"
                style={{
                  background: 'linear-gradient(135deg, hsl(var(--primary) / 0.2), hsl(var(--neon-cyan) / 0.1))',
                  border: '2px solid hsl(var(--neon-cyan) / 0.3)',
                  boxShadow: '0 0 12px hsl(var(--neon-cyan) / 0.15)'
                }}
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground truncate">
                  {profile?.full_name || 'Usuário'}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {isAdmin && <Shield className="w-3 h-3" style={{ color: 'hsl(var(--neon-cyan))' }} />}
                  <span className="text-[10px]" style={{ color: 'hsl(var(--neon-cyan))' }}>
                    {isAdmin ? 'Administrador' : 'Funcionário'}
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
        <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-5">
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
                  const showBadge = item.href === '/' && unreadCount > 0;

                  return (
                    <Link
                      key={item.href}
                      to={item.href}
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
                              {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                          )}
                        </div>
                      </div>

                      <span className="flex-1">{item.label}</span>

                      {/* Active chevron */}
                      {isActive && (
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
                      )}
                    </Link>
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
