import { useState, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { AppIcon } from '@/components/ui/app-icon';
import { useAuth } from '@/contexts/AuthContext';
import { useFabAction } from '@/contexts/FabActionContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AlertNotification {
  id: string;
  user_id: string;
  type: 'info' | 'alert' | 'success';
  title: string;
  description: string;
  origin: 'estoque' | 'financeiro' | 'checklist' | 'sistema';
  read: boolean;
  created_at: string;
}

const ORIGIN_CONFIG: Record<string, { icon: string; label: string; color: string; route: string; actionLabel: string }> = {
  estoque: { icon: 'Package', label: 'Estoque', color: 'var(--neon-amber)', route: '/inventory', actionLabel: 'Ver Estoque' },
  financeiro: { icon: 'DollarSign', label: 'Financeiro', color: 'var(--neon-green)', route: '/finance', actionLabel: 'Ver Financeiro' },
  checklist: { icon: 'ClipboardCheck', label: 'Checklist', color: 'var(--neon-purple)', route: '/checklists', actionLabel: 'Ver Checklist' },
  sistema: { icon: 'Settings', label: 'Sistema', color: 'var(--neon-cyan)', route: '/', actionLabel: 'Ver Dashboard' },
};

const TYPE_STYLES: Record<string, string> = {
  alert: 'border-l-[hsl(var(--neon-red))]',
  success: 'border-l-[hsl(var(--neon-green))]',
  info: 'border-l-[hsl(var(--neon-cyan))]',
};

type FilterOrigin = 'all' | 'estoque' | 'financeiro' | 'checklist' | 'sistema';
type FilterStatus = 'all' | 'unread' | 'read';

export default function AlertsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filterOrigin, setFilterOrigin] = useState<FilterOrigin>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['all-notifications', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(100);
      return (data as unknown as AlertNotification[]) || [];
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  const filtered = alerts.filter(a => {
    if (filterOrigin !== 'all' && a.origin !== filterOrigin) return false;
    if (filterStatus === 'unread' && a.read) return false;
    if (filterStatus === 'read' && !a.read) return false;
    return true;
  });

  const unreadCount = alerts.filter(a => !a.read).length;

  const markAsRead = useCallback(async (id: string) => {
    queryClient.setQueryData<AlertNotification[]>(['all-notifications', user?.id], old =>
      old?.map(a => a.id === id ? { ...a, read: true } : a) ?? []
    );
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    await supabase.from('notifications').update({ read: true } as any).eq('id', id);
  }, [queryClient, user?.id]);

  const markAllAsRead = useCallback(async () => {
    const ids = alerts.filter(a => !a.read).map(a => a.id);
    if (!ids.length) return;
    queryClient.setQueryData<AlertNotification[]>(['all-notifications', user?.id], old =>
      old?.map(a => ({ ...a, read: true })) ?? []
    );
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    await supabase.from('notifications').update({ read: true } as any).in('id', ids);
  }, [alerts, queryClient, user?.id]);

  useFabAction(unreadCount > 0 ? { icon: 'CheckCheck', label: 'Marcar lidas', onClick: markAllAsRead } : null, [unreadCount, markAllAsRead]);

  const origins: { key: FilterOrigin; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'estoque', label: 'Estoque' },
    { key: 'financeiro', label: 'Financeiro' },
    { key: 'checklist', label: 'Checklist' },
    { key: 'sistema', label: 'Sistema' },
  ];

  return (
    <AppLayout>
      <div className="min-h-screen bg-background pb-24">
        <div className="px-4 py-4 lg:px-6 space-y-4">
          {/* Origin filter chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {origins.map(o => (
              <button
                key={o.key}
                onClick={() => setFilterOrigin(o.key)}
                className={cn(
                  "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                  filterOrigin === o.key
                    ? "bg-primary/15 border-primary/30 text-primary"
                    : "bg-card border-border/50 text-muted-foreground hover:bg-secondary"
                )}
              >
                {o.label}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex gap-2">
            {([
              { key: 'all' as FilterStatus, label: 'Todos' },
              { key: 'unread' as FilterStatus, label: `Não lidos${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
              { key: 'read' as FilterStatus, label: 'Lidos' },
            ]).map(s => (
              <button
                key={s.key}
                onClick={() => setFilterStatus(s.key)}
                className={cn(
                  "text-xs font-medium px-2.5 py-1 rounded-lg transition-all",
                  filterStatus === s.key
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Alert list */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="card-surface p-8 text-center">
              <AppIcon name="BellOff" size={40} className="mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum alerta encontrado</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((alert, i) => {
                const cfg = ORIGIN_CONFIG[alert.origin] || ORIGIN_CONFIG.sistema;
                return (
                  <div
                    key={alert.id}
                    className={cn(
                      "list-command p-4 transition-all animate-slide-up",
                      TYPE_STYLES[alert.type] || TYPE_STYLES.info,
                      !alert.read && "bg-primary/[0.03]"
                    )}
                    style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="icon-glow icon-glow-sm shrink-0 mt-0.5"
                        style={{
                          backgroundColor: `hsl(${cfg.color} / 0.12)`,
                          borderColor: `hsl(${cfg.color} / 0.3)`,
                          color: `hsl(${cfg.color})`,
                        }}
                      >
                        <AppIcon name={cfg.icon} size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-semibold text-foreground">{alert.title}</span>
                          {!alert.read && (
                            <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{alert.description}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] text-muted-foreground/60">
                            {format(new Date(alert.created_at), "dd MMM, HH:mm", { locale: ptBR })}
                          </span>
                          <div className="flex gap-2">
                            {!alert.read && (
                              <button
                                onClick={() => markAsRead(alert.id)}
                                className="text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                              >
                                Marcar lida
                              </button>
                            )}
                            <button
                              onClick={() => navigate(cfg.route)}
                              className="text-[10px] font-semibold text-primary hover:text-primary/80 transition-colors"
                            >
                              {cfg.actionLabel} →
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
