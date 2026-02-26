import { Bell, AlertTriangle, Info, CheckCircle, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useNotifications, AppNotification } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const typeConfig = {
  alert: { icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10', ring: 'ring-destructive/20', glow: 'shadow-glow-destructive' },
  info: { icon: Info, color: 'text-primary', bg: 'bg-primary/10', ring: 'ring-primary/20', glow: 'shadow-glow-primary' },
  success: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10', ring: 'ring-success/20', glow: 'shadow-glow-success' },
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

function NotificationGroupItem({ group, onMarkRead, index }: { group: GroupedNotification; onMarkRead: (ids: string[]) => void; index: number }) {
  const config = typeConfig[group.type] || typeConfig.info;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-3.5 p-3.5 rounded-2xl transition-all duration-200",
        "bg-secondary/40 hover:bg-secondary/70",
        "animate-slide-up"
      )}
      style={{ animationDelay: `${index * 40}ms`, animationFillMode: 'both' }}
    >
      {/* Icon with soft glow */}
      <div className={cn(
        "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ring-1",
        config.bg, config.ring
      )}>
        <Icon className={cn("w-[18px] h-[18px]", config.color)} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-[13px] text-foreground leading-tight">{group.title}</p>
          {group.count > 1 && (
            <span className={cn(
              "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
              config.bg, config.color
            )}>
              {group.count}×
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{group.description}</p>
        <div className="flex items-center gap-1.5 mt-2">
          <span className="text-[10px] text-muted-foreground/60 font-medium">
            {formatDistanceToNow(new Date(group.latestDate), { addSuffix: true, locale: ptBR })}
          </span>
          <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
          <span className="text-[10px] text-muted-foreground/60 font-medium capitalize">{group.origin}</span>
        </div>
      </div>

      <button
        onClick={() => onMarkRead(group.ids)}
        className={cn(
          "p-2 rounded-xl transition-all duration-200 shrink-0",
          "hover:bg-success/15 active:scale-95 group"
        )}
        title="Marcar como lida"
      >
        <Check className="w-4 h-4 text-muted-foreground/50 group-hover:text-success transition-colors" />
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
    <div className="py-10 flex flex-col items-center gap-3">
      <div className="w-14 h-14 rounded-3xl bg-muted/50 flex items-center justify-center">
        <Bell className="w-6 h-6 text-muted-foreground/30" />
      </div>
      <p className="text-sm text-muted-foreground/60 font-medium">Tudo limpo por aqui ✨</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-1 py-1 group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center relative ring-1 ring-primary/20">
            <Bell className="w-[18px] h-[18px] text-primary" />
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center shadow-sm">
              {grouped.length}
            </span>
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-sm text-foreground">Notificações</h3>
            <p className="text-[11px] text-muted-foreground/60">{grouped.length} pendente{grouped.length > 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {grouped.length > 1 && (
            <span
              onClick={(e) => { e.stopPropagation(); markAllAsRead(); }}
              className="text-[11px] text-primary font-semibold hover:text-primary/80 cursor-pointer transition-colors"
            >
              Limpar todas
            </span>
          )}
          <div className="w-7 h-7 rounded-xl bg-muted/50 flex items-center justify-center group-hover:bg-muted transition-colors">
            {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="space-y-2 max-h-[340px] overflow-y-auto pr-0.5">
          {grouped.slice(0, 10).map((g, i) => (
            <NotificationGroupItem key={g.key} group={g} onMarkRead={handleMarkRead} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
