import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications, AppNotification } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, isToday, isYesterday, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppIcon } from '@/components/ui/app-icon';

const typeConfig = {
  alert: { icon: 'AlertTriangle', color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/15' },
  info: { icon: 'Info', color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/15' },
  success: { icon: 'CheckCircle2', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/15' },
} as const;

const originConfig: Record<string, { icon: string; label: string; route: string }> = {
  financeiro: { icon: 'Wallet', label: 'Financeiro', route: '/finance' },
  checklists: { icon: 'CheckSquare', label: 'Checklists', route: '/checklists' },
  checklist: { icon: 'CheckSquare', label: 'Checklists', route: '/checklists' },
  estoque: { icon: 'Package', label: 'Estoque', route: '/inventory' },
  agenda: { icon: 'Calendar', label: 'Agenda', route: '/agenda' },
  caixa: { icon: 'Calculator', label: 'Caixa', route: '/cash-closing' },
  sistema: { icon: 'Settings', label: 'Sistema', route: '/' },
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

function cleanTitle(title: string): string {
  return title.replace(/[🔔💰🔴🟡📊🧾💳📋✅❌⚠️🎯📌]/g, '').replace(/\s+/g, ' ').trim();
}

function formatSmartTime(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  if (isYesterday(date)) return `Ontem, ${format(date, 'HH:mm')}`;
  return format(date, "dd/MM 'às' HH:mm");
}

/* ─── Grouped by time sections ─── */
function groupByTime(groups: GroupedNotification[]): { label: string; items: GroupedNotification[] }[] {
  const sections: { label: string; items: GroupedNotification[] }[] = [];
  const today: GroupedNotification[] = [];
  const yesterday: GroupedNotification[] = [];
  const older: GroupedNotification[] = [];

  for (const g of groups) {
    const d = new Date(g.latestDate);
    if (isToday(d)) today.push(g);
    else if (isYesterday(d)) yesterday.push(g);
    else older.push(g);
  }

  if (today.length) sections.push({ label: 'Hoje', items: today });
  if (yesterday.length) sections.push({ label: 'Ontem', items: yesterday });
  if (older.length) sections.push({ label: 'Anteriores', items: older });

  return sections;
}

/* ─── Single notification row ─── */
function NotificationRow({ group, onMarkRead, index }: { group: GroupedNotification; onMarkRead: (ids: string[]) => void; index: number }) {
  const navigate = useNavigate();
  const config = typeConfig[group.type] || typeConfig.info;
  const origin = originConfig[group.origin] || originConfig.sistema;
  const timeAgo = formatSmartTime(group.latestDate);

  return (
    <button
      onClick={() => {
        onMarkRead(group.ids);
        if (origin.route) navigate(origin.route);
      }}
      className={cn(
        "w-full flex items-start gap-3 p-3.5 rounded-2xl transition-all duration-200 text-left group",
        "bg-card border border-border/40 hover:border-border/60 active:scale-[0.98]",
        "animate-fade-in"
      )}
      style={{ animationDelay: `${index * 30}ms`, animationFillMode: 'both' }}
    >
      {/* Type icon */}
      <div className={cn(
        "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border",
        config.bg, config.border
      )}>
        <AppIcon name={config.icon} size={18} className={config.color} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-[13px] text-foreground leading-snug">
            {cleanTitle(group.title)}
            {group.count > 1 && (
              <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-muted text-[10px] font-bold text-muted-foreground align-middle">
                {group.count}
              </span>
            )}
          </p>
        </div>

        {group.description && (
          <p className="text-[11px] text-muted-foreground/70 line-clamp-2 leading-relaxed">
            {group.description}
          </p>
        )}

        <div className="flex items-center gap-2 pt-0.5">
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/50 font-medium">
            <AppIcon name={origin.icon} size={11} className="opacity-60" />
            {origin.label}
          </span>
          <span className="text-muted-foreground/20">·</span>
          <span className="text-[10px] text-muted-foreground/50">{timeAgo}</span>
        </div>
      </div>

      {/* Swipe hint */}
      <AppIcon name="ChevronRight" size={16} className="text-muted-foreground/20 shrink-0 mt-2.5 group-hover:text-muted-foreground/40 transition-colors" />
    </button>
  );
}

/* ─── Main export ─── */
export function NotificationCard() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const grouped = useMemo(() => groupNotifications(notifications), [notifications]);
  const sections = useMemo(() => groupByTime(grouped), [grouped]);

  const handleMarkRead = async (ids: string[]) => {
    for (const id of ids) {
      await markAsRead(id);
    }
  };

  if (unreadCount === 0) return (
    <div className="py-16 flex flex-col items-center gap-4">
      <div className="w-16 h-16 rounded-3xl bg-muted/30 flex items-center justify-center">
        <AppIcon name="BellOff" size={28} className="text-muted-foreground/25" />
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-semibold text-foreground/60">Tudo em dia</p>
        <p className="text-xs text-muted-foreground/40">Nenhuma notificação pendente</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Quick stats bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <AppIcon name="Bell" size={16} className="text-primary" />
            </div>
            <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-0.5 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
              {grouped.length}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {grouped.length} pendente{grouped.length > 1 ? 's' : ''}
          </span>
        </div>

        {grouped.length > 1 && (
          <button
            onClick={markAllAsRead}
            className="text-[11px] text-primary font-semibold hover:text-primary/80 transition-colors px-2 py-1 rounded-lg hover:bg-primary/5 active:scale-95"
          >
            Limpar todas
          </button>
        )}
      </div>

      {/* Notification sections */}
      <div className="space-y-5">
        {sections.map(section => (
          <div key={section.label} className="space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider px-1">
              {section.label}
            </p>
            <div className="space-y-2">
              {section.items.map((g, i) => (
                <NotificationRow key={g.key} group={g} onMarkRead={handleMarkRead} index={i} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
