import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { AppIcon } from '@/components/ui/app-icon';
import { ConversationList } from '@/components/whatsapp/ConversationList';
import { ConversationChat } from '@/components/whatsapp/ConversationChat';
import { useWhatsAppConversations } from '@/hooks/useWhatsApp';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export default function WhatsAppChatsPage() {
  const navigate = useNavigate();
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
      <div className="flex flex-col h-[calc(100vh-3.5rem-5rem)] lg:h-screen">
        {/* Sub-header */}
        <div className="shrink-0 px-4 py-2 flex items-center gap-2 border-b border-border/20">
          <button onClick={() => navigate('/whatsapp')} className="p-1.5 rounded-lg hover:bg-secondary transition-colors lg:hidden">
            <AppIcon name="ArrowLeft" size={18} className="text-foreground" />
          </button>
          <h2 className="text-sm font-semibold text-foreground">Conversas</h2>
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="flex h-full">
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
            <div className={cn(
              'flex-1 h-full',
              !selectedConvId ? 'hidden lg:flex' : 'flex'
            )}>
              {selectedConv ? (
                <div className="w-full h-full flex flex-col">
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
        </div>
      </div>
    </AppLayout>
  );
}
