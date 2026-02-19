import { useState, useRef, useEffect, memo } from 'react';
import { ChatMessage, ChatConversation } from '@/hooks/useChat';
import { ChatMessageComponent } from './ChatMessage';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/ui/app-icon';
import { DefaultAvatar } from '@/components/profile/DefaultAvatar';
import { Skeleton } from '@/components/ui/skeleton';
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

function MessagesSkeleton() {
  return (
    <div className="flex-1 p-4 space-y-4">
      {[false, true, false, true, false].map((isMine, i) => (
        <div key={i} className={cn('flex gap-2', isMine ? 'justify-end' : 'justify-start')}>
          {!isMine && <Skeleton className="w-8 h-8 rounded-full shrink-0" />}
          <Skeleton className={cn('h-12 rounded-2xl', isMine ? 'w-44' : 'w-56')} />
        </div>
      ))}
    </div>
  );
}

export const ChatWindow = memo(function ChatWindow({ conversation, messages, isLoading, onSendMessage, onBack, onTogglePin, currentUserId }: ChatWindowProps) {
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { isAdmin } = useAuth();

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
        <div className="text-center text-muted-foreground/30">
          <div className="w-24 h-24 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-5">
            <AppIcon name="MessageCircle" size={40} className="text-muted-foreground/20" />
          </div>
          <p className="text-lg font-medium mb-1 text-muted-foreground/50">Suas mensagens</p>
          <p className="text-sm text-muted-foreground/30">Selecione uma conversa para começar</p>
        </div>
      </div>
    );
  }

  const isAnnouncement = conversation.type === 'announcement';
  const canSend = !isAnnouncement || isAdmin;

  const otherParticipant = conversation.type === 'direct'
    ? conversation.participants?.find(p => p.user_id !== currentUserId)
    : null;
  const displayName = conversation.type === 'direct'
    ? otherParticipant?.profile?.full_name || 'Conversa'
    : conversation.name || 'Grupo';

  const avatarUrl = conversation.type === 'direct' ? otherParticipant?.profile?.avatar_url : null;
  const isGroup = conversation.type !== 'direct';
  const pinnedMessages = messages.filter(m => m.is_pinned);

  let lastDate = '';

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 px-3 h-[60px] border-b border-border/10 bg-background/80 backdrop-blur-sm">
        <button onClick={onBack} className="lg:hidden p-2 -ml-1 rounded-xl hover:bg-muted/50 transition-colors active:scale-95">
          <AppIcon name="ArrowLeft" size={20} className="text-foreground" />
        </button>
        
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-border/20">
          {conversation.type === 'direct' && otherParticipant ? (
            avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <DefaultAvatar name={displayName} size={40} userId={otherParticipant.user_id} />
            )
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                background: conversation.type === 'announcement'
                  ? 'linear-gradient(135deg, hsl(45 90% 55%), hsl(35 90% 45%))'
                  : 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.7))',
              }}
            >
              <AppIcon
                name={conversation.type === 'announcement' ? 'Megaphone' : 'Users'}
                size={18}
                className="text-white"
              />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">{displayName}</p>
          <p className="text-[11px] text-muted-foreground/50">
            {conversation.type === 'announcement' ? 'Canal de comunicados' :
             conversation.type === 'group' ? `${conversation.participants?.length || 0} membros` :
             'Online'}
          </p>
        </div>
      </div>

      {/* Pinned */}
      {pinnedMessages.length > 0 && (
        <div className="shrink-0 px-4 py-2 flex items-center gap-2 text-xs bg-amber-500/5 border-b border-amber-500/10">
          <AppIcon name="Pin" size={12} className="text-amber-400 shrink-0" />
          <span className="text-muted-foreground truncate">{pinnedMessages[pinnedMessages.length - 1]?.content}</span>
        </div>
      )}

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto py-3"
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 0%, hsl(var(--primary) / 0.02), transparent 70%)',
        }}
      >
        {isLoading ? (
          <MessagesSkeleton />
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-3">
                <AppIcon name="MessageCircle" size={28} className="text-muted-foreground/20" />
              </div>
              <p className="text-muted-foreground/40 text-sm font-medium">Nenhuma mensagem</p>
              <p className="text-muted-foreground/25 text-xs mt-1">Diga olá! 👋</p>
            </div>
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
                    <div className="flex justify-center my-4">
                      <span className="text-[11px] text-muted-foreground/50 font-medium px-3 py-1 rounded-full bg-muted/30">
                        {getDateLabel(msg.created_at)}
                      </span>
                    </div>
                  )}
                  <ChatMessageComponent
                    message={msg}
                    onTogglePin={onTogglePin}
                    showAvatar={showAvatar}
                    showName={isGroup}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Input */}
      {canSend ? (
        <div className="shrink-0 px-3 py-2.5 border-t border-border/10 bg-background/80 backdrop-blur-sm">
          <div className="flex items-end gap-2">
            <div className="flex-1 flex items-end rounded-2xl px-4 py-2 bg-muted/40 border border-border/10 focus-within:border-primary/20 transition-colors">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isAnnouncement ? 'Escrever comunicado...' : 'Mensagem...'}
                rows={1}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 resize-none outline-none max-h-24 py-0.5"
                style={{ lineHeight: '1.5' }}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isSending}
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-90',
                input.trim()
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                  : 'bg-muted/50 text-muted-foreground/30'
              )}
            >
              <AppIcon name="Send" size={18} />
            </button>
          </div>
        </div>
      ) : (
        <div className="shrink-0 px-4 py-3 text-center border-t border-border/10 bg-muted/20">
          <p className="text-xs text-muted-foreground/40">Apenas administradores podem enviar comunicados</p>
        </div>
      )}
    </div>
  );
});
