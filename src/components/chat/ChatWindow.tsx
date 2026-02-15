import { useState, useRef, useEffect } from 'react';
import { ChatMessage, ChatConversation } from '@/hooks/useChat';
import { ChatMessageComponent } from './ChatMessage';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Send, Megaphone, Users, User, Pin, Camera, Smile } from 'lucide-react';
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
          <Skeleton className={cn('h-10 rounded-2xl', isMine ? 'w-40' : 'w-52')} />
        </div>
      ))}
    </div>
  );
}

export function ChatWindow({ conversation, messages, isLoading, onSendMessage, onBack, onTogglePin, currentUserId }: ChatWindowProps) {
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
        <div className="text-center text-muted-foreground/40">
          <div className="w-20 h-20 rounded-full border-2 border-muted-foreground/20 flex items-center justify-center mx-auto mb-4">
            <Send className="w-8 h-8 text-muted-foreground/30 -rotate-45" />
          </div>
          <p className="text-lg font-light mb-1">Suas mensagens</p>
          <p className="text-sm text-muted-foreground/40">Envie mensagens para a sua equipe</p>
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

  const TypeIcon = conversation.type === 'announcement' ? Megaphone : conversation.type === 'group' ? Users : User;

  const pinnedMessages = messages.filter(m => m.is_pinned);

  let lastDate = '';

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Instagram-style header */}
      <div className="shrink-0 flex items-center gap-3 px-3 h-[60px] border-b border-border/10 bg-background">
        <button onClick={onBack} className="lg:hidden p-1.5 -ml-1 rounded-full hover:bg-muted/50 transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        
        {conversation.type === 'direct' && otherParticipant ? (
          <Avatar className="w-9 h-9">
            <AvatarImage src={otherParticipant.profile?.avatar_url || undefined} />
            <AvatarFallback className="text-xs bg-muted font-semibold">
              {displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: conversation.type === 'announcement' ? 'hsl(45 100% 50% / 0.1)' : 'hsl(var(--primary) / 0.1)',
            }}
          >
            <TypeIcon className={cn('w-4 h-4', conversation.type === 'announcement' ? 'text-amber-400' : 'text-primary')} />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">{displayName}</p>
          <p className="text-[11px] text-muted-foreground/50">
            {conversation.type === 'announcement' ? 'Canal' :
             conversation.type === 'group' ? `${conversation.participants?.length || 0} membros` :
             'Ativo agora'}
          </p>
        </div>
      </div>

      {/* Pinned */}
      {pinnedMessages.length > 0 && (
        <div className="shrink-0 px-4 py-2 flex items-center gap-2 text-xs bg-muted/30 border-b border-border/10">
          <Pin className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
          <span className="text-muted-foreground truncate">{pinnedMessages[pinnedMessages.length - 1]?.content}</span>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-3">
        {isLoading ? (
          <MessagesSkeleton />
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground/30 text-sm">Nenhuma mensagem ainda</p>
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
                      <span className="text-[11px] text-muted-foreground/40 font-medium">
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

      {/* Instagram-style input */}
      {canSend ? (
        <div className="shrink-0 px-3 py-2 border-t border-border/10">
          <div className="flex items-end gap-2 rounded-full px-4 py-1.5 bg-muted/40 border border-border/10">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isAnnouncement ? 'Enviar comunicado...' : 'Mensagem...'}
              rows={1}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 resize-none outline-none max-h-24 py-1.5"
              style={{ lineHeight: '1.4' }}
            />
            {input.trim() ? (
              <Button
                size="sm"
                onClick={handleSend}
                disabled={isSending}
                className="rounded-full h-8 px-4 text-xs font-semibold shrink-0"
              >
                Enviar
              </Button>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="shrink-0 px-4 py-3 text-center border-t border-border/10">
          <p className="text-xs text-muted-foreground/40">Apenas administradores podem enviar comunicados</p>
        </div>
      )}
    </div>
  );
}
