import { useLocation, useNavigate } from 'react-router-dom';
import { DollarSign, ClipboardCheck, User, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface BottomTabBarProps {
  onMorePress: () => void;
}

const tabs = [
  { icon: null, label: 'Home', href: '/', isLogo: true },
  { icon: DollarSign, label: 'Financeiro', href: '/finance', adminOnly: true },
  { icon: ClipboardCheck, label: 'Checklists', href: '/checklists' },
  { icon: User, label: 'Perfil', href: '/profile/me' },
] as const;

export function BottomTabBar({ onMorePress }: BottomTabBarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const visibleTabs = tabs.filter(t => !('adminOnly' in t && t.adminOnly) || isAdmin);

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div
        className="bg-card/95 backdrop-blur-xl border-t border-border/20"
        style={{
          boxShadow: '0 -4px 30px hsl(222 50% 3% / 0.5)',
        }}
      >
        <div className="flex items-center justify-around h-14 px-2">
          {visibleTabs.map((tab) => {
            const isActive = tab.href === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(tab.href);

            return (
              <button
                key={tab.href}
                onClick={() => navigate(tab.href)}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-xl transition-all active:scale-90",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
                style={{ minWidth: 44, minHeight: 44 }}
              >
                <div className="relative">
                  {'isLogo' in tab && tab.isLogo ? (
                    <div className={cn(
                      "w-[26px] h-[26px] rounded-md overflow-hidden border border-border/30",
                      isActive && "ring-1 ring-primary/50 shadow-[0_0_8px_hsl(var(--primary)/0.4)]"
                    )}>
                      <img
                        alt="Home"
                        className="w-full h-full object-contain"
                        src="/lovable-uploads/de20fd02-0c1c-4431-a4da-9c4611d2eb0e.jpg"
                      />
                    </div>
                  ) : (
                    <>
                      {tab.icon && <tab.icon className={cn("w-[22px] h-[22px]", isActive && "drop-shadow-[0_0_6px_hsl(var(--primary)/0.5)]")} />}
                    </>
                  )}
                  {isActive && (
                    <div
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                      style={{
                        background: 'hsl(var(--primary))',
                        boxShadow: '0 0 6px hsl(var(--primary) / 0.6)',
                      }}
                    />
                  )}
                </div>
                <span className={cn(
                  "text-[10px] font-medium",
                  isActive ? "text-primary" : "text-muted-foreground/70"
                )}>
                  {tab.label}
                </span>
              </button>
            );
          })}

          {/* More tab */}
          <button
            onClick={onMorePress}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-xl transition-all active:scale-90 text-muted-foreground"
            style={{ minWidth: 44, minHeight: 44 }}
          >
            <MoreHorizontal className="w-[22px] h-[22px]" />
            <span className="text-[10px] font-medium text-muted-foreground/70">Mais</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
