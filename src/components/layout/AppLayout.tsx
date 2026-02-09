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
      {/* Mobile Header - Compact */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border/50">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="p-2 -ml-2 rounded-xl hover:bg-secondary active:scale-95 transition-all"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="w-7 h-7 rounded-lg overflow-hidden bg-white shadow-sm">
              <img alt="Logo" className="w-full h-full object-contain" src="/lovable-uploads/de20fd02-0c1c-4431-a4da-9c4611d2eb0e.jpg" />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide",
              isAdmin ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
            )}>
              {isAdmin ? 'Admin' : 'Staff'}
            </span>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-fade-in" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* Sidebar / Drawer */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full w-72 bg-card border-r border-border/50 shadow-2xl flex flex-col",
        "transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
        "lg:translate-x-0 lg:shadow-none",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden bg-white shadow-sm">
              <img alt="Logo" className="w-full h-full object-contain" src="/lovable-uploads/f33aaa21-284f-4287-9fbe-9f15768b7d65.jpg" />
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
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-border/50 shrink-0">
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
              <div className="flex items-center gap-1 mt-0.5">
                {isAdmin && <Shield className="w-3 h-3 text-primary" />}
                <span className="text-[10px] text-muted-foreground">
                  {isAdmin ? 'Administrador' : 'Funcionário'}
                </span>
              </div>
            </div>
          </div>
          {/* Points Display */}
          <div className="mt-3 pt-3 border-t border-border/50">
            <PointsDisplay isPulsing={isPulsing} />
          </div>
        </div>

        {/* Navigation - scrollable */}
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
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground active:scale-[0.98]"
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="flex-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout - fixed at bottom */}
        <div className="shrink-0 p-3 border-t border-border/50">
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
