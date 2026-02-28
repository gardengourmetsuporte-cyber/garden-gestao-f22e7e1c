import { useWhatsAppLogs } from '@/hooks/useWhatsApp';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppIcon } from '@/components/ui/app-icon';

const actionConfig: Record<string, { label: string; icon: typeof Brain; color: string }> = {
  respond: { label: 'Resposta', icon: Brain, color: 'hsl(var(--neon-cyan))' },
  create_order: { label: 'Pedido', icon: ArrowUpRight, color: 'hsl(var(--neon-green))' },
  escalate: { label: 'Escalação', icon: AlertTriangle, color: 'hsl(var(--neon-amber))' },
  off_hours: { label: 'Fora do horário', icon: Clock, color: 'hsl(var(--muted-foreground))' },
};

export function WhatsAppLogs() {
  const { data: logs, isLoading } = useWhatsAppLogs();

  if (isLoading) return <div className="text-center py-10 text-muted-foreground">Carregando...</div>;

  if (!logs || logs.length === 0) {
    return (
      <div className="empty-state">
        <AppIcon name="Brain" className="empty-state-icon" />
        <p className="empty-state-title">Nenhum log</p>
        <p className="empty-state-text">Os logs de decisão da IA aparecerão aqui.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-2">
      {logs.map(log => {
        const cfg = actionConfig[log.action] || actionConfig.respond;
        const Icon = cfg.icon;
        return (
          <div key={log.id} className="list-command">
            <div className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: `${cfg.color}15`, border: `1px solid ${cfg.color}30` }}
              >
                <Icon className="w-4 h-4" style={{ color: cfg.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {format(new Date(log.created_at), 'dd/MM HH:mm:ss', { locale: ptBR })}
                  </span>
                </div>
                {log.reasoning && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{log.reasoning}</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
