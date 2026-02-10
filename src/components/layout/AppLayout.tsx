import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ClipboardCheck, Settings, LogOut, Menu, X, User, Shield, Gift, CalendarDays, DollarSign, Receipt, ChefHat, Users, Bell } from 'lucide-react';
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
  group?: string;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/', group: 'principal' },
  { icon: CalendarDays, label: 'Agenda', href: '/agenda', adminOnly: true, group: 'principal' },
  { icon: DollarSign, label: 'Financeiro', href: '/finance', adminOnly: true, group: 'gestao' },
  { icon: Package, label: 'Estoque', href: '/inventory', group: 'gestao' },
  { icon: ClipboardCheck, label: 'Checklists', href: '/checklists', group: 'operacao' },
  { icon: Receipt, label: 'Fechamento Caixa', href: '/cash-closing', group: 'operacao' },
  { icon: ChefHat, label: 'Fichas Técnicas', href: '/recipes', adminOnly: true, group: 'operacao' },
  { icon: Users, label: 'Funcionários', href: '/employees', group: 'pessoas' },
  { icon: Gift, label: 'Recompensas', href: '/rewards', group: 'pessoas' },
  { icon: Settings, label: 'Configurações', href: '/settings', group: 'config' },
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

  // Group items for separators
  const groups = ['principal', 'gestao', 'operacao', 'pessoas', 'config'];

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header - Command Bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-xl border-b border-border/20" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="flex items-center justify-between h-14 px-3">
          <div className="flex items-center gap-2.5">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="p-2.5 rounded-xl hover:bg-secondary active:scale-95 transition-all touch-manipulation"
              style={{ minWidth: 44, minHeight: 44 }}
            >
              <Menu className="w-5 h-5 text-muted-foreground" />
            </button>
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/10 backdrop-blur-sm border border-border/20">
              <img alt="Logo" className="w-full h-full object-contain" src="/lovable-uploads/de20fd02-0c1c-4431-a4da-9c4611d2eb0e.jpg" />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* User name on header */}
            <span className="text-xs font-medium text-muted-foreground hidden xs:inline">
              {profile?.full_name?.split(' ')[0]}
            </span>
            <span className={cn(
              "px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider uppercase",
              isAdmin 
                ? "bg-primary/15 text-primary border border-primary/20" 
                : "bg-secondary text-muted-foreground border border-border/20"
            )}>
              {isAdmin ? 'Admin' : 'Staff'}
            </span>
            {/* Notification bell */}
            <button 
              onClick={() => navigate('/')}
              className="relative p-2 rounded-lg hover:bg-secondary transition-all"
            >
              <Bell className="w-4 h-4 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-destructive text-destructive-foreground text-[7px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
        {/* Bottom glow line */}
        <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm animate-fade-in" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* Sidebar / Drawer */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full w-72 flex flex-col",
        "bg-card/95 backdrop-blur-2xl border-r border-border/20",
        "transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
        "lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}
        style={{ paddingTop: 'env(safe-area-inset-top)', boxShadow: sidebarOpen ? 'var(--shadow-elevated)' : 'none' }}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-border/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden bg-white/10 border border-border/20">
              <img alt="Logo" className="w-full h-full object-contain" src="/lovable-uploads/f33aaa21-284f-4287-9fbe-9f15768b7d65.jpg" />
            </div>
            <div>
              <h1 className="font-bold text-sm text-foreground tracking-tight">Garden</h1>
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Command Center</p>
            </div>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)} 
            className="lg:hidden p-2 rounded-xl hover:bg-secondary active:scale-95 transition-all"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-border/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden ring-2 ring-primary/30 ring-offset-2 ring-offset-card">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground truncate">
                {profile?.full_name || 'Usuário'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {isAdmin && <Shield className="w-3 h-3 text-primary" />}
                <span className="text-[10px] text-muted-foreground">
                  {isAdmin ? 'Administrador' : 'Funcionário'}
                </span>
              </div>
            </div>
          </div>
          {/* Points Display */}
          <div className="mt-3 pt-3 border-t border-border/20">
            <PointsDisplay isPulsing={isPulsing} />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {filteredNavItems.map((item, index) => {
            const isActive = location.pathname === item.href;
            const showBadge = item.href === '/' && unreadCount > 0;
            const prevItem = filteredNavItems[index - 1];
            const showSeparator = prevItem && prevItem.group !== item.group;
            
            return (
              <div key={item.href}>
                {showSeparator && (
                  <div className="my-2 mx-3 h-px bg-border/20" />
                )}
                <Link
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground active:scale-[0.98]"
                  )}
                >
                  {/* Active left border indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-primary shadow-glow-primary" />
                  )}
                  <div className="relative">
                    <item.icon className={cn("w-[22px] h-[22px] shrink-0", isActive && "text-primary")} />
                    {showBadge && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[8px] font-bold flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <span className="flex-1">{item.label}</span>
                </Link>
              </div>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="shrink-0 p-3 border-t border-border/20">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all active:scale-[0.98]"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn("min-h-screen lg:pt-0 lg:pl-72", "transition-all duration-300")} style={{ paddingTop: 'calc(env(safe-area-inset-top) + 3.75rem)' }}>
        {children}
      </main>

      {/* Coin Animation Layer */}
      <CoinAnimationLayer />

      {/* Push Notification Prompt */}
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