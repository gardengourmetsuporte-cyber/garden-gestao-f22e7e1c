import { Bell, AlertTriangle, Info, CheckCircle, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useNotifications, AppNotification } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const typeConfig = {
  alert: { icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/20' },
  info: { icon: Info, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
  success: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10', border: 'border-success/20' },
};

interface GroupedNotification {
  key: string;
  title: string;
  description: string;
  type: AppNotification['type'];
  origin: string;
  count: number;
  ids: string[];
  latestDate: string;
}

function groupNotifications(notifications: AppNotification[]): GroupedNotification[] {
  const groups = new Map<string, GroupedNotification>();

  for (const n of notifications) {
    const key = `${n.title}__${n.origin}`;
    const existing = groups.get(key);
    if (existing) {
      existing.count++;
      existing.ids.push(n.id);
      if (n.created_at > existing.latestDate) {
        existing.latestDate = n.created_at;
        existing.description = n.description;
      }
    } else {
      groups.set(key, {
        key,
        title: n.title,
        description: n.description,
        type: n.type,
        origin: n.origin,
        count: 1,
        ids: [n.id],
        latestDate: n.created_at,
      });
    }
  }

  return Array.from(groups.values()).sort((a, b) => b.latestDate.localeCompare(a.latestDate));
}

function NotificationGroupItem({ group, onMarkRead }: { group: GroupedNotification; onMarkRead: (ids: string[]) => void }) {
  const config = typeConfig[group.type] || typeConfig.info;
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
        <div className="flex items-center gap-1.5">
          <p className="font-semibold text-xs text-foreground">{group.title}</p>
          {group.count > 1 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
              {group.count}×
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{group.description}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[10px] text-muted-foreground/70">
            {formatDistanceToNow(new Date(group.latestDate), { addSuffix: true, locale: ptBR })}
          </span>
          <span className="text-[10px] text-muted-foreground/50">•</span>
          <span className="text-[10px] text-muted-foreground/70 capitalize">{group.origin}</span>
        </div>
      </div>
      <button
        onClick={() => onMarkRead(group.ids)}
        className="p-1.5 rounded-lg hover:bg-success/10 transition-colors shrink-0 group"
        title="Marcar como lida"
      >
        <Check className="w-3.5 h-3.5 text-muted-foreground group-hover:text-success transition-colors" />
      </button>
    </div>
  );
}

export function NotificationCard() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [expanded, setExpanded] = useState(true);

  const grouped = useMemo(() => groupNotifications(notifications), [notifications]);

  const handleMarkRead = async (ids: string[]) => {
    for (const id of ids) {
      await markAsRead(id);
    }
  };

  if (unreadCount === 0) return (
    <div className="p-6 text-center">
      <Bell className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
      <p className="text-sm text-muted-foreground">Sem notificações</p>
    </div>
  );

  return (
    <div>
      <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center relative">
              <Bell className="w-4.5 h-4.5 text-destructive" />
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                {grouped.length}
              </span>
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-sm text-foreground">Notificações</h3>
              <p className="text-[10px] text-muted-foreground">{grouped.length} pendente{grouped.length > 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {grouped.length > 1 && (
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

        {expanded && (
          <div className="px-3 pb-3 space-y-2 max-h-[300px] overflow-y-auto">
            {grouped.slice(0, 10).map(g => (
              <NotificationGroupItem key={g.key} group={g} onMarkRead={handleMarkRead} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
