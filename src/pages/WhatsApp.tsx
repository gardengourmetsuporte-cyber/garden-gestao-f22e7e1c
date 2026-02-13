import { useState } from 'react';
import { MessageSquare, Settings, ShoppingBag, Brain } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ConversationList } from '@/components/whatsapp/ConversationList';
import { ConversationChat } from '@/components/whatsapp/ConversationChat';
import { WhatsAppSettings } from '@/components/whatsapp/WhatsAppSettings';
import { WhatsAppOrders } from '@/components/whatsapp/WhatsAppOrders';
import { WhatsAppLogs } from '@/components/whatsapp/WhatsAppLogs';
import { useWhatsAppConversations } from '@/hooks/useWhatsApp';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const tabs = [
  { key: 'conversations', label: 'Conversas', icon: MessageSquare },
  { key: 'orders', label: 'Pedidos', icon: ShoppingBag },
  { key: 'logs', label: 'Logs IA', icon: Brain },
  { key: 'settings', label: 'Config', icon: Settings },
];

export default function WhatsAppPage() {
  const [activeTab, setActiveTab] = useState('conversations');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const { conversations, isLoading, updateStatus } = useWhatsAppConversations(statusFilter);
  const { user } = useAuth();

  const selectedConv = conversations.find(c => c.id === selectedConvId) || null;

  const handleStatusChange = (status: string) => {
    if (!selectedConvId) return;
    updateStatus.mutate({
      id: selectedConvId,
      status,
      assigned_to: status === 'human_active' ? user?.id : null,
    });
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-3.5rem)] lg:h-screen">
        {/* Header */}
        <div className="page-header-bar shrink-0">
          <div className="page-header-content">
            <div className="flex items-center gap-3">
              <div
                className="page-header-icon"
                style={{
                  background: 'linear-gradient(135deg, hsl(var(--neon-green) / 0.15), hsl(var(--neon-cyan) / 0.08))',
                  border: '1px solid hsl(var(--neon-green) / 0.3)',
                }}
              >
                <MessageSquare className="w-5 h-5" style={{ color: 'hsl(var(--neon-green))' }} />
              </div>
              <div>
                <h1 className="page-title">WhatsApp</h1>
                <p className="page-subtitle">Atendimento inteligente</p>
              </div>
            </div>
          </div>
          {/* Tab bar */}
          <div className="px-4 pb-2">
            <div className="tab-command">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => { setActiveTab(tab.key); setSelectedConvId(null); }}
                  className={cn(
                    'tab-command-item text-xs gap-1.5',
                    activeTab === tab.key ? 'tab-command-active' : 'tab-command-inactive'
                  )}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'conversations' && (
            <div className="flex h-full">
              {/* Left: list */}
              <div className={cn(
                'w-full lg:w-[340px] lg:border-r border-border/20 h-full overflow-hidden',
                selectedConvId ? 'hidden lg:block' : ''
              )}>
                <ConversationList
                  conversations={conversations}
                  selectedId={selectedConvId}
                  onSelect={setSelectedConvId}
                  statusFilter={statusFilter}
                  onFilterChange={setStatusFilter}
                  isLoading={isLoading}
                />
              </div>
              {/* Right: chat */}
              <div className={cn(
                'flex-1 h-full',
                !selectedConvId ? 'hidden lg:flex' : 'flex'
              )}>
                {selectedConv ? (
                  <div className="w-full h-full flex flex-col">
                    {/* Back on mobile */}
                    <button
                      onClick={() => setSelectedConvId(null)}
                      className="lg:hidden p-3 text-xs text-primary font-medium"
                    >
                      ← Voltar
                    </button>
                    <div className="flex-1 overflow-hidden">
                      <ConversationChat conversation={selectedConv} onStatusChange={handleStatusChange} />
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                    Selecione uma conversa
                  </div>
                )}
              </div>
            </div>
          )}
          {activeTab === 'orders' && (
            <div className="h-full overflow-y-auto">
              <WhatsAppOrders />
            </div>
          )}
          {activeTab === 'logs' && (
            <div className="h-full overflow-y-auto">
              <WhatsAppLogs />
            </div>
          )}
          {activeTab === 'settings' && (
            <div className="h-full overflow-y-auto">
              <WhatsAppSettings />
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
