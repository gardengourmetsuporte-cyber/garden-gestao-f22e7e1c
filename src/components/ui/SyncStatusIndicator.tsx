import { useOfflineSync } from '@/hooks/useOfflineSync';
import { CloudOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SyncStatusIndicator() {
  const { pendingCount, isSyncing, syncAll, isConnected } = useOfflineSync();

  if (pendingCount === 0) return null;

  return (
    <button
      onClick={() => { if (isConnected) syncAll(); }}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
        isConnected
          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25 active:scale-95"
          : "bg-muted text-muted-foreground cursor-default"
      )}
    >
      {isSyncing ? (
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <CloudOff className="w-3.5 h-3.5" />
      )}
      <span>
        {isSyncing
          ? 'Sincronizando...'
          : `${pendingCount} pendente${pendingCount > 1 ? 's' : ''}`}
      </span>
    </button>
  );
}
