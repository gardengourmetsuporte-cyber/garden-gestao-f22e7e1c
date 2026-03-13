import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { AppIcon } from '@/components/ui/app-icon';
import { useWhatsAppChannels, useWhatsAppConversations, useWhatsAppOrders } from '@/hooks/useWhatsApp';
import { cn } from '@/lib/utils';

const sections = [
  { key: 'chats', label: 'Conversas', icon: 'MessageSquare', desc: 'Atendimentos ativos e histórico', href: '/whatsapp/chats' },
  { key: 'orders', label: 'Pedidos', icon: 'ShoppingBag', desc: 'Pedidos recebidos via WhatsApp', href: '/whatsapp/orders' },
  { key: 'knowledge', label: 'Base de Conhecimento', icon: 'BookOpen', desc: 'Respostas e informações da IA', href: '/whatsapp/knowledge' },
  { key: 'logs', label: 'Logs IA', icon: 'Brain', desc: 'Histórico de interações da IA', href: '/whatsapp/logs' },
];

export default function WhatsAppHub() {
  const navigate = useNavigate();
  const { channels, isLoading: channelsLoading } = useWhatsAppChannels();
  const { conversations } = useWhatsAppConversations('all');
  const { orders } = useWhatsAppOrders();

  const activeChannel = channels.find(c => c.is_active);
  const isConnected = !!activeChannel;
  const activeConvs = conversations.filter(c => c.status !== 'closed').length;
  const pendingOrders = orders.filter(o => !['confirmed', 'cancelled'].includes(o.status)).length;

  const counters: Record<string, number> = {
    chats: activeConvs,
    orders: pendingOrders,
  };

  return (
    <AppLayout>
      <div className="p-4 space-y-4 max-w-2xl mx-auto pb-24">
        {/* Connection Status Card */}
        <div
          className={cn(
            "rounded-2xl border p-4 flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-all",
            isConnected
              ? "border-success/30 bg-success/5"
              : "border-border/30 bg-card"
          )}
          onClick={() => navigate('/whatsapp/settings')}
        >
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
            isConnected ? "bg-emerald-500/15" : "bg-secondary"
          )}>
            {isConnected ? (
              <AppIcon name="Wifi" size={22} className="text-emerald-500" />
            ) : (
              <AppIcon name="WifiOff" size={22} className="text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {channelsLoading ? 'Verificando...' : isConnected ? 'WhatsApp Conectado' : 'WhatsApp Desconectado'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isConnected
                ? `${activeChannel?.provider?.toUpperCase()} • ${activeChannel?.phone_number || 'Sem número'}`
                : 'Toque para configurar a conexão'
              }
            </p>
          </div>
          <AppIcon name="ChevronRight" size={18} className="text-muted-foreground shrink-0" />
        </div>

        {/* Section Grid */}
        <div className="grid grid-cols-2 gap-3">
          {sections.map(s => (
            <button
              key={s.key}
              onClick={() => navigate(s.href)}
              className="card-command p-4 text-left space-y-3 active:scale-[0.97] transition-all"
            >
              <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10 text-primary">
                  <AppIcon name={s.icon} size={20} />
                </div>
                {(counters[s.key] ?? 0) > 0 && (
                  <span className="text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                    {counters[s.key]}
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{s.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{s.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Settings Card */}
        <button
          onClick={() => navigate('/whatsapp/settings')}
          className="card-command p-4 w-full text-left flex items-center gap-3 active:scale-[0.98] transition-all"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-secondary text-muted-foreground">
            <AppIcon name="Settings" size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Configurações</p>
            <p className="text-[10px] text-muted-foreground">Conexão, IA, horários e personalidade</p>
          </div>
          <AppIcon name="ChevronRight" size={18} className="text-muted-foreground" />
        </button>
      </div>
    </AppLayout>
  );
}
