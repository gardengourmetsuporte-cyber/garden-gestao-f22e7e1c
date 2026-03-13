import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { WifiOff, RefreshCw, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}h${remainingMins > 0 ? `${remainingMins}min` : ''}`;
}

export function OfflineBanner() {
  const { isConnected, offlineSince, checkNow } = useOnlineStatus();
  const [isChecking, setIsChecking] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  // Track offline → online transitions
  useEffect(() => {
    if (!isConnected) {
      setWasOffline(true);
    } else if (wasOffline && isConnected) {
      setShowReconnected(true);
      setWasOffline(false);
      const timer = setTimeout(() => setShowReconnected(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isConnected, wasOffline]);

  const handleRetry = async () => {
    setIsChecking(true);
    await checkNow();
    setIsChecking(false);
  };

  // Reconnected toast
  if (showReconnected) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[200] animate-in slide-in-from-top duration-300"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="bg-primary text-primary-foreground px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium">
          <Wifi className="w-4 h-4" />
          <span>Conexão restabelecida</span>
        </div>
      </div>
    );
  }

  // Not offline — don't render
  if (isConnected) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[200] animate-in slide-in-from-top duration-300"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="bg-destructive text-destructive-foreground px-4 py-2.5 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2.5 min-w-0">
          <WifiOff className="w-4 h-4 shrink-0 animate-pulse" />
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold leading-tight">Sem conexão</span>
            <span className="text-xs opacity-80 leading-tight">
              {offlineSince
                ? `Offline há ${formatDuration(offlineSince)}`
                : 'Verificando conexão...'}
            </span>
          </div>
        </div>

        <button
          onClick={handleRetry}
          disabled={isChecking}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
            "bg-white/20 hover:bg-white/30 active:scale-95 disabled:opacity-50"
          )}
        >
          <RefreshCw className={cn("w-3.5 h-3.5", isChecking && "animate-spin")} />
          <span>{isChecking ? 'Tentando...' : 'Tentar'}</span>
        </button>
      </div>
    </div>
  );
}
