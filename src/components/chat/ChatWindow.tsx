import { useState, useRef, useEffect } from 'react';
import { ChatMessage, ChatConversation } from '@/hooks/useChat';
import { ChatMessageComponent } from './ChatMessage';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Send, Megaphone, Users, User, Pin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChatWindowProps {
  conversation: ChatConversation | null;
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (content: string) => Promise<void>;
  onBack: () => void;
  onTogglePin: (messageId: string, isPinned: boolean) => void;
  currentUserId?: string;
}

function getDateLabel(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return 'Hoje';
  if (isYesterday(d)) return 'Ontem';
  return format(d, "dd 'de' MMMM", { locale: ptBR });
}

export function ChatWindow({ conversation, messages, isLoading, onSendMessage, onBack, onTogglePin, currentUserId }: ChatWindowProps) {
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { isAdmin } = useAuth();

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;
    setIsSending(true);
    const msg = input;
    setInput('');
    await onSendMessage(msg);
    setIsSending(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-muted-foreground/60">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Selecione uma conversa</p>
        </div>
      </div>
    );
  }

  const isAnnouncement = conversation.type === 'announcement';
  const canSend = !isAnnouncement || isAdmin;

  // Get display name
  const otherParticipant = conversation.type === 'direct'
    ? conversation.participants?.find(p => p.user_id !== currentUserId)
    : null;
  const displayName = conversation.type === 'direct'
    ? otherParticipant?.profile?.full_name || 'Conversa'
    : conversation.name || 'Grupo';

  const TypeIcon = conversation.type === 'announcement' ? Megaphone : conversation.type === 'group' ? Users : User;

  // Pinned messages
  const pinnedMessages = messages.filter(m => m.is_pinned);

  // Group messages by date
  let lastDate = '';

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div
        className="shrink-0 flex items-center gap-3 px-4 h-14"
        style={{
          background: 'hsl(var(--card) / 0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid hsl(var(--border) / 0.2)',
        }}
      >
        <button onClick={onBack} className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-secondary transition-all">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--neon-cyan) / 0.08))',
            border: '1px solid hsl(var(--neon-cyan) / 0.2)',
          }}
        >
          <TypeIcon className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">{displayName}</p>
          <p className="text-[10px] text-muted-foreground">
            {conversation.type === 'announcement' ? 'Canal de comunicados' :
             conversation.type === 'group' ? `${conversation.participants?.length || 0} membros` :
             'Conversa direta'}
          </p>
        </div>
      </div>

      {/* Pinned messages bar */}
      {pinnedMessages.length > 0 && (
        <div
          className="shrink-0 px-4 py-2 flex items-center gap-2 text-xs"
          style={{
            background: 'hsl(45 100% 50% / 0.06)',
            borderBottom: '1px solid hsl(45 100% 50% / 0.15)',
          }}
        >
          <Pin className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
          <span className="text-amber-300/80 truncate">{pinnedMessages[pinnedMessages.length - 1]?.content}</span>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-pulse text-muted-foreground text-sm">Carregando...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground/50 text-sm">Nenhuma mensagem ainda</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {messages.map((msg, i) => {
              const msgDate = format(new Date(msg.created_at), 'yyyy-MM-dd');
              const showDate = msgDate !== lastDate;
              if (showDate) lastDate = msgDate;

              const prevMsg = messages[i - 1];
              const showAvatar = !prevMsg || prevMsg.sender_id !== msg.sender_id || showDate;

              return (
                <div key={msg.id}>
                  {showDate && (
                    <div className="flex justify-center my-3">
                      <span className="text-[10px] text-muted-foreground/50 bg-background/80 px-3 py-1 rounded-full backdrop-blur-sm">
                        {getDateLabel(msg.created_at)}
                      </span>
                    </div>
                  )}
                  <ChatMessageComponent
                    message={msg}
                    onTogglePin={onTogglePin}
                    showAvatar={showAvatar}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Input */}
      {canSend ? (
        <div className="shrink-0 p-3">
          <div
            className="flex items-end gap-2 rounded-2xl px-4 py-2"
            style={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--neon-cyan) / 0.15)',
              boxShadow: '0 0 20px hsl(var(--neon-cyan) / 0.05)',
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isAnnouncement ? 'Enviar comunicado...' : 'Mensagem...'}
              rows={1}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 resize-none outline-none max-h-24 py-1"
              style={{ lineHeight: '1.5' }}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || isSending}
              className="w-8 h-8 rounded-xl shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="shrink-0 px-4 py-3 text-center">
          <p className="text-xs text-muted-foreground/50">Apenas administradores podem enviar comunicados</p>
        </div>
      )}
    </div>
  );
}
