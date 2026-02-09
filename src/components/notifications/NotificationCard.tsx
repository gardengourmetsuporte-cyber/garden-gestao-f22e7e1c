import { Bell, AlertTriangle, Info, CheckCircle, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useNotifications, AppNotification } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const typeConfig = {
  alert: { icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/20' },
  info: { icon: Info, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
  success: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10', border: 'border-success/20' },
};

function NotificationItem({ notification, onMarkRead }: { notification: AppNotification; onMarkRead: (id: string) => void }) {
  const config = typeConfig[notification.type] || typeConfig.info;
  const Icon = config.icon;

  return (
    <div className={cn(
      "flex items-start gap-3 p-3 rounded-xl border transition-all",
      config.border,
      "bg-card hover:bg-muted/30"
    )}>
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", config.bg)}>
        <Icon className={cn("w-4 h-4", config.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-xs text-foreground">{notification.title}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{notification.description}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[10px] text-muted-foreground/70">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ptBR })}
          </span>
          <span className="text-[10px] text-muted-foreground/50">•</span>
          <span className="text-[10px] text-muted-foreground/70 capitalize">{notification.origin}</span>
        </div>
      </div>
      <button
        onClick={() => onMarkRead(notification.id)}
        className="p-1.5 rounded-lg hover:bg-success/10 transition-colors shrink-0 group"
        title="Marcar como lida"
      >
        <Check className="w-3.5 h-3.5 text-muted-foreground group-hover:text-success transition-colors" />
      </button>
    </div>
  );
}

export function NotificationCard() {
  const { unreadNotifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [expanded, setExpanded] = useState(true);

  if (unreadCount === 0) return null;

  return (
    <div className="animate-slide-up">
      <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center relative">
              <Bell className="w-4.5 h-4.5 text-destructive" />
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-sm text-foreground">Notificações</h3>
              <p className="text-[10px] text-muted-foreground">{unreadCount} não lida{unreadCount > 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 1 && (
              <span
                onClick={(e) => { e.stopPropagation(); markAllAsRead(); }}
                className="text-[10px] text-primary font-medium hover:underline cursor-pointer"
              >
                Marcar todas
              </span>
            )}
            {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </button>

        {/* Notification List */}
        {expanded && (
          <div className="px-3 pb-3 space-y-2 max-h-[300px] overflow-y-auto">
            {unreadNotifications.slice(0, 10).map(n => (
              <NotificationItem key={n.id} notification={n} onMarkRead={markAsRead} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
