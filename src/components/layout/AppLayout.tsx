import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
 import { LayoutDashboard, Package, ClipboardCheck, Settings, LogOut, Menu, X, ChevronRight, User, Shield, Gift, CalendarDays, DollarSign, Receipt, ChefHat } from 'lucide-react';
import { PointsDisplay } from '@/components/rewards/PointsDisplay';
import { CoinAnimationProvider, useCoinAnimation } from '@/contexts/CoinAnimationContext';
import { CoinAnimationLayer } from '@/components/animations/CoinAnimation';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.png';
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
  {
    icon: LayoutDashboard,
    label: 'Dashboard',
    href: '/'
  },
  {
    icon: CalendarDays,
    label: 'Agenda',
    href: '/agenda',
    adminOnly: true
  },
  {
    icon: DollarSign,
    label: 'Financeiro',
    href: '/finance',
    adminOnly: true
  },
  {
    icon: Package,
    label: 'Estoque',
    href: '/inventory'
  },
  {
    icon: ClipboardCheck,
    label: 'Checklists',
    href: '/checklists'
  },
  {
    icon: Receipt,
    label: 'Fechamento Caixa',
    href: '/cash-closing'
  },
   {
     icon: ChefHat,
     label: 'Fichas Técnicas',
     href: '/recipes',
     adminOnly: true
   },
  {
    icon: Gift,
    label: 'Recompensas',
    href: '/rewards'
  },
  {
    icon: Settings,
    label: 'Configurações',
    href: '/settings'
  }
];
function AppLayoutContent({
  children
}: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const {
    profile,
    isAdmin,
    signOut
  } = useAuth();
  const {
    isPulsing
  } = useCoinAnimation();
  const location = useLocation();
  const navigate = useNavigate();
  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };
  const filteredNavItems = navItems.filter(item => !item.adminOnly || isAdmin);
  return <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b shadow-sm">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-secondary transition-colors">
              <Menu className="w-6 h-6" />
            </button>
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-white">
              <img alt="Logo" className="w-full h-full object-contain" src="/lovable-uploads/de20fd02-0c1c-4431-a4da-9c4611d2eb0e.jpg" />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={cn("px-2 py-1 rounded-full text-xs font-medium", isAdmin ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground")}>
              {isAdmin ? 'Admin' : 'Funcionário'}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={cn("fixed top-0 left-0 z-50 h-full w-72 bg-card border-r shadow-xl transition-transform duration-300", "lg:translate-x-0", sidebarOpen ? "translate-x-0" : "-translate-x-full")}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-white shadow">
              <img alt="Logo" className="w-full h-full object-contain" src="/lovable-uploads/f33aaa21-284f-4287-9fbe-9f15768b7d65.jpg" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">Gestão</h1>
              <p className="text-xs text-muted-foreground">Sistema Completo</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 rounded-lg hover:bg-secondary">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
              {profile?.avatar_url ? <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" /> : <User className="w-6 h-6 text-primary" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">
                {profile?.full_name || 'Usuário'}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                {isAdmin && <Shield className="w-3 h-3 text-primary" />}
                <span className="text-xs text-muted-foreground">
                  {isAdmin ? 'Administrador' : 'Funcionário'}
                </span>
              </div>
            </div>
          </div>
          {/* Points Display */}
          <div className="mt-3 pt-3 border-t">
            <PointsDisplay isPulsing={isPulsing} />
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {filteredNavItems.map(item => {
          const isActive = location.pathname === item.href;
          return <Link key={item.href} to={item.href} onClick={() => setSidebarOpen(false)} className={cn("flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all", isActive ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-secondary hover:text-foreground")}>
                <item.icon className="w-5 h-5" />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4" />}
              </Link>;
        })}
        </nav>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <button onClick={handleSignOut} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn("min-h-screen pt-16 lg:pt-0 lg:pl-72", "transition-all duration-300")}>
        {children}
      </main>

      {/* Coin Animation Layer */}
      <CoinAnimationLayer />
    </div>;
}
export function AppLayout({
  children
}: AppLayoutProps) {
  return <CoinAnimationProvider>
      <AppLayoutContent>{children}</AppLayoutContent>
    </CoinAnimationProvider>;
}