import { useLocation, useNavigate } from 'react-router-dom';
import { DollarSign, ClipboardCheck, User, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface BottomTabBarProps {
  onMorePress: () => void;
}

const tabs = [
  { icon: null, label: '', href: '/', isLogo: true },
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
        className="bg-card/95 backdrop-blur-xl"
        style={{
          borderTop: '1px solid hsl(var(--border) / 0.15)',
          boxShadow: '0 -2px 20px hsl(222 50% 3% / 0.4)',
        }}
      >
        <div className="flex items-center justify-around h-[56px] px-1">
          {visibleTabs.map((tab) => {
            const isActive = tab.href === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(tab.href);

            return (
              <button
                key={tab.href}
                onClick={() => navigate(tab.href)}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 py-1.5 rounded-xl transition-all duration-200 active:scale-90",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
                style={{ minWidth: 48, minHeight: 48 }}
              >
                {'isLogo' in tab && tab.isLogo ? (
                  <div className={cn(
                    "w-8 h-8 rounded-[10px] overflow-hidden transition-all duration-200",
                    isActive
                      ? "ring-[1.5px] ring-primary/60 shadow-[0_0_12px_hsl(var(--primary)/0.35)]"
                      : "ring-1 ring-border/30 opacity-70"
                  )}>
                    <img
                      alt="Home"
                      className="w-full h-full object-cover"
                      src="/lovable-uploads/de20fd02-0c1c-4431-a4da-9c4611d2eb0e.jpg"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-0.5">
                    {tab.icon && (
                      <tab.icon
                        className={cn(
                          "w-[21px] h-[21px] transition-all duration-200",
                          isActive && "drop-shadow-[0_0_6px_hsl(var(--primary)/0.5)]"
                        )}
                        strokeWidth={isActive ? 2.2 : 1.8}
                      />
                    )}
                    <span className={cn(
                      "text-[10px] font-medium leading-none transition-colors duration-200",
                      isActive ? "text-primary" : "text-muted-foreground/60"
                    )}>
                      {tab.label}
                    </span>
                  </div>
                )}
                {isActive && (
                  <div
                    className="w-1 h-1 rounded-full mt-0.5"
                    style={{
                      background: 'hsl(var(--primary))',
                      boxShadow: '0 0 6px hsl(var(--primary) / 0.6)',
                    }}
                  />
                )}
              </button>
            );
          })}

          {/* More tab */}
          <button
            onClick={onMorePress}
            className="flex flex-col items-center justify-center flex-1 py-1.5 rounded-xl transition-all duration-200 active:scale-90 text-muted-foreground"
            style={{ minWidth: 48, minHeight: 48 }}
          >
            <div className="flex flex-col items-center gap-0.5">
              <MoreHorizontal className="w-[21px] h-[21px]" strokeWidth={1.8} />
              <span className="text-[10px] font-medium leading-none text-muted-foreground/60">Mais</span>
            </div>
          </button>
        </div>
      </div>
    </nav>
  );
}
