import { useState, useRef, useEffect } from 'react';
import { Bot, User, Send, ArrowLeftRight, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWhatsAppMessages, useWhatsAppSend } from '@/hooks/useWhatsApp';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { WhatsAppConversation } from '@/types/whatsapp';

interface Props {
  conversation: WhatsAppConversation;
  onStatusChange: (status: string) => void;
}

const senderColors: Record<string, string> = {
  customer: 'hsl(var(--foreground))',
  ai: 'hsl(var(--neon-cyan))',
  human: 'hsl(var(--neon-amber))',
};

const senderBg: Record<string, string> = {
  customer: 'hsl(var(--secondary))',
  ai: 'hsl(var(--neon-cyan) / 0.08)',
  human: 'hsl(var(--neon-amber) / 0.08)',
};

export function ConversationChat({ conversation, onStatusChange }: Props) {
  const { messages, isLoading } = useWhatsAppMessages(conversation.id);
  const sendMessage = useWhatsAppSend();
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage.mutate({ conversationId: conversation.id, content: input.trim() });
    setInput('');
  };

  const isHuman = conversation.status === 'human_active';
  const isAI = conversation.status === 'ai_active';
  const isClosed = conversation.status === 'closed';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 p-4 border-b border-border/30 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
            <MessageCircle className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold font-display text-sm text-foreground truncate">
              {conversation.contact?.name || conversation.contact?.phone || 'Cliente'}
            </p>
            <p className="text-xs text-muted-foreground">{conversation.contact?.phone}</p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          {isAI && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onStatusChange('human_active')}
              className="text-xs gap-1.5"
              style={{ borderColor: 'hsl(var(--neon-amber) / 0.3)', color: 'hsl(var(--neon-amber))' }}
            >
              <User className="w-3.5 h-3.5" /> Assumir
            </Button>
          )}
          {isHuman && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onStatusChange('ai_active')}
              className="text-xs gap-1.5"
              style={{ borderColor: 'hsl(var(--neon-cyan) / 0.3)', color: 'hsl(var(--neon-cyan))' }}
            >
              <Bot className="w-3.5 h-3.5" /> Devolver IA
            </Button>
          )}
          {!isClosed && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onStatusChange('closed')}
              className="text-xs gap-1.5 text-muted-foreground"
            >
              Fechar
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="text-center text-muted-foreground text-sm py-10">Carregando mensagens...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-10">Nenhuma mensagem ainda.</div>
        ) : (
          messages.map(msg => {
            const isInbound = msg.direction === 'inbound';
            return (
              <div key={msg.id} className={cn('flex', isInbound ? 'justify-start' : 'justify-end')}>
                <div
                  className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm"
                  style={{
                    background: senderBg[msg.sender_type] || senderBg.customer,
                    border: `1px solid ${senderColors[msg.sender_type]}15`,
                  }}
                >
                  {/* Sender label */}
                  <div className="flex items-center gap-1.5 mb-1">
                    {msg.sender_type === 'ai' && <Bot className="w-3 h-3" style={{ color: senderColors.ai }} />}
                    {msg.sender_type === 'human' && <User className="w-3 h-3" style={{ color: senderColors.human }} />}
                    <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: senderColors[msg.sender_type] }}>
                      {msg.sender_type === 'customer' ? 'Cliente' : msg.sender_type === 'ai' ? 'IA' : 'Atendente'}
                    </span>
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {format(new Date(msg.created_at), 'HH:mm', { locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-foreground whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input (only for human mode) */}
      {isHuman && (
        <div className="shrink-0 p-3 border-t border-border/30">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Digite sua mensagem..."
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || sendMessage.isPending}
              size="icon"
              className="shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {isClosed && (
        <div className="shrink-0 p-3 border-t border-border/30 text-center text-sm text-muted-foreground">
          Conversa encerrada
        </div>
      )}
    </div>
  );
}
