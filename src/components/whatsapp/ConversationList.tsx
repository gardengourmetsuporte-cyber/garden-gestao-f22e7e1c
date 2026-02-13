import { MessageCircle, Bot, User, XCircle, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { WhatsAppConversation } from '@/types/whatsapp';

interface Props {
  conversations: WhatsAppConversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  statusFilter: string;
  onFilterChange: (f: string) => void;
  isLoading: boolean;
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Bot }> = {
  ai_active: { label: 'IA', color: 'hsl(var(--neon-cyan))', icon: Bot },
  human_active: { label: 'Humano', color: 'hsl(var(--neon-amber))', icon: User },
  closed: { label: 'Fechada', color: 'hsl(var(--muted-foreground))', icon: XCircle },
};

const filters = [
  { key: 'all', label: 'Todas' },
  { key: 'ai_active', label: 'IA' },
  { key: 'human_active', label: 'Humano' },
  { key: 'closed', label: 'Fechadas' },
];

export function ConversationList({ conversations, selectedId, onSelect, statusFilter, onFilterChange, isLoading }: Props) {
  return (
    <div className="flex flex-col h-full">
      {/* Filter tabs */}
      <div className="p-3 shrink-0">
        <div className="tab-command">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => onFilterChange(f.key)}
              className={cn(
                'tab-command-item text-xs',
                statusFilter === f.key ? 'tab-command-active' : 'tab-command-inactive'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1.5">
        {isLoading ? (
          <div className="text-center py-10 text-muted-foreground text-sm">Carregando...</div>
        ) : conversations.length === 0 ? (
          <div className="empty-state">
            <MessageCircle className="empty-state-icon" />
            <p className="empty-state-title">Nenhuma conversa</p>
            <p className="empty-state-text">As conversas aparecerão aqui quando clientes enviarem mensagens.</p>
          </div>
        ) : (
          conversations.map(conv => {
            const cfg = statusConfig[conv.status] || statusConfig.ai_active;
            const StatusIcon = cfg.icon;
            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={cn(
                  'w-full text-left list-command',
                  selectedId === conv.id && 'bg-card/90 border-primary/30'
                )}
                style={selectedId === conv.id ? { borderLeftColor: 'hsl(var(--primary))' } : undefined}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: `${cfg.color}15`, border: `1px solid ${cfg.color}40` }}
                  >
                    <StatusIcon className="w-4 h-4" style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-foreground truncate">
                        {conv.contact?.name || conv.contact?.phone || 'Desconhecido'}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {format(new Date(conv.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Phone className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground truncate">
                        {conv.contact?.phone || '-'}
                      </span>
                      <span
                        className="ml-auto text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md"
                        style={{ background: `${cfg.color}15`, color: cfg.color }}
                      >
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
