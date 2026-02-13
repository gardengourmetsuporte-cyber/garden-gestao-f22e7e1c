import { ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, MessageCircle, Building2 } from 'lucide-react';
import { CoinAnimationProvider } from '@/contexts/CoinAnimationContext';
import { CoinAnimationLayer } from '@/components/animations/CoinAnimation';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { getThemeColor } from '@/lib/unitThemes';
import { cn } from '@/lib/utils';
import { PushNotificationPrompt } from '@/components/notifications/PushNotificationPrompt';
import { useNotifications } from '@/hooks/useNotifications';
import { useChatUnreadCount } from '@/hooks/useChatUnreadCount';
import { BottomTabBar } from './BottomTabBar';
import { MoreSheet } from './MoreSheet';

interface AppLayoutProps {
  children: ReactNode;
}

function AppLayoutContent({ children }: AppLayoutProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [unitDropdownOpen, setUnitDropdownOpen] = useState(false);
  const { isAdmin } = useAuth();
  const { units, activeUnit, setActiveUnitId, isTransitioning } = useUnit();
  const { unreadCount } = useNotifications();
  const chatUnreadCount = useChatUnreadCount();
  const navigate = useNavigate();

  const iconBtnClass = "relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-secondary/60 active:scale-95 transition-all";

  return (
    <div className="min-h-screen bg-background">
      {/* ======= Top Header ======= */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center justify-between h-11 px-3">
          {/* Left: Role badge */}
          <span className={cn(
            "px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider uppercase",
            isAdmin
              ? "bg-primary/15 text-primary border border-primary/20"
              : "bg-secondary text-muted-foreground border border-border/20"
          )}>
            {isAdmin ? 'Admin' : 'Staff'}
          </span>

          {/* Right: action icons */}
          <div className="flex items-center gap-0.5">
            {units.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setUnitDropdownOpen(!unitDropdownOpen)}
                  className={cn(iconBtnClass, unitDropdownOpen && "bg-secondary/60")}
                >
                  <Building2 className="w-[18px] h-[18px] text-muted-foreground" strokeWidth={1.8} />
                  {activeUnit && (
                    <span
                      className="absolute bottom-1 right-1 w-[7px] h-[7px] rounded-full border-[1.5px] border-card"
                      style={{ background: getThemeColor(activeUnit.slug) }}
                    />
                  )}
                </button>
                {unitDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUnitDropdownOpen(false)} />
                    <div
                      className="absolute top-full right-0 mt-1.5 z-50 rounded-xl overflow-hidden py-1 min-w-[180px]"
                      style={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border) / 0.4)',
                        boxShadow: 'var(--shadow-elevated)',
                      }}
                    >
                      {units.map(unit => (
                        <button
                          key={unit.id}
                          onClick={() => { setActiveUnitId(unit.id); setUnitDropdownOpen(false); }}
                          className={cn(
                            "w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-all",
                            unit.id === activeUnit?.id
                              ? "text-primary bg-primary/10"
                              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                          )}
                        >
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: getThemeColor(unit.slug) }} />
                          <span className="truncate font-medium">{unit.name}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            <button onClick={() => navigate('/chat')} className={iconBtnClass}>
              <MessageCircle className="w-[18px] h-[18px] text-muted-foreground" strokeWidth={1.8} />
              {chatUnreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 rounded-full bg-destructive text-destructive-foreground text-[8px] font-bold flex items-center justify-center">
                  {chatUnreadCount > 9 ? '9+' : chatUnreadCount}
                </span>
              )}
            </button>

            <button onClick={() => navigate('/')} className={iconBtnClass}>
              <Bell className="w-[18px] h-[18px] text-muted-foreground" strokeWidth={1.8} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 rounded-full bg-destructive text-destructive-foreground text-[8px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      </header>

      {/* ======= Main Content ======= */}
      <main
        className="min-h-screen lg:pt-0"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top) + 2.875rem)',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 3.75rem)',
        }}
      >
        {children}
      </main>

      {/* ======= Bottom Tab Bar ======= */}
      <BottomTabBar onMorePress={() => setMoreOpen(true)} />

      {/* ======= More Sheet ======= */}
      <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} />

      {/* Unit transition overlay */}
      {isTransitioning && (
        <div className="fixed inset-0 z-[100] pointer-events-none animate-unit-flash" style={{ background: 'hsl(var(--primary) / 0.12)' }} />
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
