import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/contexts/AuthContext';

export function PushNotificationPrompt() {
  const { user } = useAuth();
  const { isSupported, isSubscribed, permission, isLoading, subscribe } = usePushNotifications();
  const [dismissed, setDismissed] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Don't show if: no user, not supported, already subscribed, permission denied/granted, or dismissed
    if (!user || !isSupported || isSubscribed || isLoading || permission === 'denied' || permission === 'granted' || dismissed) {
      setShow(false);
      return;
    }

    // Check if user already dismissed recently (24h cooldown)
    const lastDismissed = localStorage.getItem('push-prompt-dismissed');
    if (lastDismissed) {
      const hoursSince = (Date.now() - new Date(lastDismissed).getTime()) / (1000 * 60 * 60);
      if (hoursSince < 24) return;
    }

    // Show immediately (no artificial delay)
    setShow(true);
  }, [user, isSupported, isSubscribed, isLoading, permission, dismissed]);

  if (!show) return null;

  const handleEnable = async () => {
    const success = await subscribe();
    if (success) {
      setShow(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShow(false);
    localStorage.setItem('push-prompt-dismissed', new Date().toISOString());
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 lg:left-auto lg:right-6 lg:bottom-6 lg:w-96 z-[80] animate-slide-up">
      <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-xl backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-foreground">Ativar Notificações</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Receba alertas de contas a pagar, estoque zerado e mais, mesmo com a tela bloqueada.
            </p>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={handleEnable} disabled={isLoading} className="h-8 text-xs">
                {isLoading ? 'Ativando...' : 'Ativar'}
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDismiss} className="h-8 text-xs text-muted-foreground">
                Depois
              </Button>
            </div>
          </div>
          <button onClick={handleDismiss} className="p-1 rounded-lg hover:bg-secondary transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}
