import { ReactNode, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, MessageCircle, Building2, ChevronDown } from 'lucide-react';
import { CoinAnimationProvider, useCoinAnimation } from '@/contexts/CoinAnimationContext';
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

  return (
    <div className="min-h-screen bg-background">
      {/* ======= Minimal Top Header ======= */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="bg-card border-b border-border/20">
          <div className="flex items-center justify-between h-12 px-3">
            {/* Logo + Unit */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => navigate('/')}
                className="w-8 h-8 rounded-lg overflow-hidden bg-white/10 border border-border/20 active:scale-95 transition-transform"
              >
                <img alt="Logo" className="w-full h-full object-contain" src="/lovable-uploads/de20fd02-0c1c-4431-a4da-9c4611d2eb0e.jpg" />
              </button>

              {/* Unit selector inline */}
              {units.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setUnitDropdownOpen(!unitDropdownOpen)}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground transition-all"
                  >
                    <span className="truncate max-w-[100px]">
                      {activeUnit?.name || 'Unidade'}
                    </span>
                    <ChevronDown className={cn(
                      "w-3 h-3 transition-transform duration-200",
                      unitDropdownOpen && "rotate-180"
                    )} />
                  </button>
                  {unitDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setUnitDropdownOpen(false)} />
                      <div
                        className="absolute top-full left-0 mt-1 z-50 rounded-xl overflow-hidden py-1 min-w-[180px]"
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
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ background: getThemeColor(unit.slug) }}
                            />
                            <span className="truncate">{unit.name}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-0.5">
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
                <MessageCircle className="w-5 h-5 text-muted-foreground" />
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
                <Bell className="w-5 h-5 text-muted-foreground" />
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

      {/* ======= Main Content ======= */}
      <main
        className="min-h-screen lg:pt-0"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top) + 3.25rem)',
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
