import { useNavigate } from 'react-router-dom';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import {
  CalendarDays, Package, Receipt, ChefHat, Users, Gift,
  MessageCircle, Monitor, BookOpen, MessageSquare, Settings, LogOut
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useModuleStatus } from '@/hooks/useModuleStatus';
import { useChatUnreadCount } from '@/hooks/useChatUnreadCount';
import { cn } from '@/lib/utils';

interface MoreSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ModuleItem {
  icon: React.ElementType;
  label: string;
  href: string;
  adminOnly?: boolean;
  color: string;
}

const modules: ModuleItem[] = [
  { icon: CalendarDays, label: 'Agenda', href: '/agenda', adminOnly: true, color: 'hsl(var(--primary))' },
  { icon: Package, label: 'Estoque', href: '/inventory', color: 'hsl(var(--neon-cyan))' },
  { icon: Receipt, label: 'Fechamento', href: '/cash-closing', color: 'hsl(var(--neon-amber))' },
  { icon: ChefHat, label: 'Fichas', href: '/recipes', adminOnly: true, color: 'hsl(280 70% 60%)' },
  { icon: Users, label: 'Funcionários', href: '/employees', color: 'hsl(var(--primary))' },
  { icon: Gift, label: 'Recompensas', href: '/rewards', color: 'hsl(var(--neon-amber))' },
  { icon: MessageCircle, label: 'Chat', href: '/chat', color: 'hsl(var(--neon-green))' },
  { icon: Monitor, label: 'Tablets', href: '/tablet-admin', adminOnly: true, color: 'hsl(var(--neon-cyan))' },
  { icon: BookOpen, label: 'Cardápio', href: '/cardapio', adminOnly: true, color: 'hsl(var(--neon-red))' },
  { icon: MessageSquare, label: 'WhatsApp', href: '/whatsapp', adminOnly: true, color: 'hsl(var(--neon-green))' },
  { icon: Settings, label: 'Ajustes', href: '/settings', color: 'hsl(var(--muted-foreground))' },
];

export function MoreSheet({ open, onOpenChange }: MoreSheetProps) {
  const navigate = useNavigate();
  const { isAdmin, signOut } = useAuth();
  const moduleStatuses = useModuleStatus();
  const chatUnreadCount = useChatUnreadCount();

  const visibleModules = modules.filter(m => !m.adminOnly || isAdmin);

  const handleNav = (href: string) => {
    navigate(href);
    onOpenChange(false);
  };

  const handleSignOut = async () => {
    onOpenChange(false);
    await signOut();
    navigate('/auth');
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-base">Módulos</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-6">
          <div className="grid grid-cols-4 gap-3">
            {visibleModules.map((mod) => {
              const status = moduleStatuses[mod.href];
              const chatBadge = mod.href === '/chat' && chatUnreadCount > 0;
              const hasBadge = (status && status.level !== 'ok' && status.count > 0) || chatBadge;
              const badgeCount = chatBadge ? chatUnreadCount : status?.count || 0;

              return (
                <button
                  key={mod.href}
                  onClick={() => handleNav(mod.href)}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-2xl hover:bg-secondary/40 active:scale-95 transition-all relative"
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{
                      background: `${mod.color}15`,
                      border: `1px solid ${mod.color}25`,
                    }}
                  >
                    <mod.icon className="w-5 h-5" style={{ color: mod.color }} />
                  </div>
                  {hasBadge && (
                    <span
                      className="absolute top-2 right-2 w-4 h-4 rounded-full text-[8px] font-bold flex items-center justify-center"
                      style={{
                        background: status?.level === 'critical' ? 'hsl(var(--neon-red))' : 'hsl(var(--neon-amber))',
                        color: status?.level === 'critical' ? 'hsl(0 0% 100%)' : 'hsl(0 0% 0%)',
                      }}
                    >
                      {badgeCount > 9 ? '9+' : badgeCount}
                    </span>
                  )}
                  <span className="text-[11px] font-medium text-foreground">{mod.label}</span>
                </button>
              );
            })}
          </div>

          {/* Sign out */}
          <div className="mt-4 pt-3" style={{ borderTop: '1px solid hsl(var(--border) / 0.3)' }}>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all active:scale-[0.98]"
            >
              <LogOut className="w-4 h-4" />
              <span className="font-medium">Sair</span>
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
