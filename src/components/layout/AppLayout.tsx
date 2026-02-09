import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ClipboardCheck, Settings, LogOut, Menu, X, User, Shield, Gift, CalendarDays, DollarSign, Receipt, ChefHat, Users } from 'lucide-react';
import { PointsDisplay } from '@/components/rewards/PointsDisplay';
import { CoinAnimationProvider, useCoinAnimation } from '@/contexts/CoinAnimationContext';
import { CoinAnimationLayer } from '@/components/animations/CoinAnimation';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
}

interface NavItem {
  icon: typeof Package;
  label: string;
  href: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: CalendarDays, label: 'Agenda', href: '/agenda', adminOnly: true },
  { icon: DollarSign, label: 'Financeiro', href: '/finance', adminOnly: true },
  { icon: Package, label: 'Estoque', href: '/inventory' },
  { icon: ClipboardCheck, label: 'Checklists', href: '/checklists' },
  { icon: Receipt, label: 'Fechamento Caixa', href: '/cash-closing' },
  { icon: ChefHat, label: 'Fichas Técnicas', href: '/recipes', adminOnly: true },
  { icon: Users, label: 'Funcionários', href: '/employees' },
  { icon: Gift, label: 'Recompensas', href: '/rewards' },
  { icon: Settings, label: 'Configurações', href: '/settings' },
];

function AppLayoutContent({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile, isAdmin, signOut } = useAuth();
  const { isPulsing } = useCoinAnimation();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const filteredNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border/30">
        <div className="flex items-center justify-between h-14 px-3">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="p-2.5 rounded-xl hover:bg-secondary active:scale-95 transition-all touch-manipulation"
              style={{ minWidth: 44, minHeight: 44 }}
            >
              <Menu className="w-6 h-6 text-foreground" />
            </button>
            <div className="h-9 rounded-xl overflow-hidden flex items-center justify-center">
              <img alt="Garden Gourmet" className="h-full w-auto object-contain" src="/garden-logo.png" />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={cn(
              "px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide",
              isAdmin 
                ? "bg-primary/15 text-primary border border-primary/20" 
                : "bg-secondary text-muted-foreground border border-border/30"
            )}>
              {isAdmin ? 'Admin' : 'Staff'}
            </span>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* Sidebar / Drawer */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full w-72 flex flex-col",
        "bg-card/95 backdrop-blur-xl border-r border-border/30",
        "transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
        "lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}
        style={{ boxShadow: sidebarOpen ? 'var(--shadow-elevated)' : 'none' }}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-border/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 rounded-xl overflow-hidden flex items-center justify-center">
              <img alt="Garden Gourmet" className="h-full w-auto object-contain" src="/garden-logo.png" />
            </div>
            <div>
              <h1 className="font-bold text-sm text-foreground">Gestão</h1>
              <p className="text-[10px] text-muted-foreground">Sistema Completo</p>
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
        <div className="p-4 border-b border-border/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden ring-2 ring-primary/20">
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
          <div className="mt-3 pt-3 border-t border-border/30">
            <PointsDisplay isPulsing={isPulsing} />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {filteredNavItems.map(item => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/15 text-primary border border-primary/20"
                    : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground active:scale-[0.98]"
                )}
              >
                <item.icon className={cn("w-5 h-5 shrink-0", isActive && "text-primary")} />
                <span className="flex-1">{item.label}</span>
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="shrink-0 p-3 border-t border-border/30">
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
      <main className={cn("min-h-screen pt-14 lg:pt-0 lg:pl-72", "transition-all duration-300")}>
        {children}
      </main>

      {/* Coin Animation Layer */}
      <CoinAnimationLayer />
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
