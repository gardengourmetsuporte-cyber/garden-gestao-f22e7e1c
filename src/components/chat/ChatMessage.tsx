import { memo } from 'react';
import { ChatMessage as ChatMessageType } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { DefaultAvatar } from '@/components/profile/DefaultAvatar';
import { Pin } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: ChatMessageType;
  onTogglePin?: (messageId: string, isPinned: boolean) => void;
  showAvatar?: boolean;
  showName?: boolean;
}

export const ChatMessageComponent = memo(function ChatMessageComponent({ message, onTogglePin, showAvatar = true, showName = true }: ChatMessageProps) {
  const { user, isAdmin } = useAuth();
  const isMine = message.sender_id === user?.id;
  const senderName = message.sender_profile?.full_name || 'Usuário';
  const avatarUrl = message.sender_profile?.avatar_url;

  return (
    <div className={cn('flex gap-2 px-4 py-0.5 group', isMine ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      {!isMine && showAvatar ? (
        <div className="w-8 h-8 shrink-0 mt-1 rounded-full overflow-hidden border border-border/20">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <DefaultAvatar name={senderName} size={32} userId={message.sender_id} />
          )}
        </div>
      ) : !isMine ? (
        <div className="w-8 shrink-0" />
      ) : null}

      <div className={cn('max-w-[78%] flex flex-col', isMine ? 'items-end' : 'items-start')}>
        {/* Sender name */}
        {showAvatar && showName && !isMine && (
          <span className="text-[11px] text-muted-foreground/60 mb-0.5 px-2 font-semibold tracking-wide">
            {senderName}
          </span>
        )}

        {/* Message bubble */}
        <div
          className={cn(
            'relative px-3.5 py-2.5 text-[14px] leading-[1.45] break-words',
            isMine
              ? 'rounded-[20px] rounded-br-[6px]'
              : 'rounded-[20px] rounded-bl-[6px]',
            message.is_pinned && 'ring-1 ring-amber-500/30'
          )}
          style={
            isMine
              ? {
                  background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.85))',
                  color: 'hsl(var(--primary-foreground))',
                  boxShadow: '0 1px 3px hsl(var(--primary) / 0.15)',
                }
              : {
                  background: 'hsl(var(--muted) / 0.5)',
                  color: 'hsl(var(--foreground))',
                  boxShadow: '0 1px 2px hsl(var(--foreground) / 0.04)',
                }
          }
        >
          {message.is_pinned && (
            <Pin className="absolute -top-1.5 -right-1.5 w-3 h-3 text-amber-400 fill-amber-400" />
          )}
          <span className="whitespace-pre-wrap">{message.content}</span>
          <span className={cn(
            'inline-block ml-2 text-[10px] align-bottom opacity-60 float-right mt-1',
            isMine ? 'text-primary-foreground/70' : 'text-muted-foreground/50'
          )}>
            {format(new Date(message.created_at), 'HH:mm', { locale: ptBR })}
          </span>
        </div>
      </div>

      {/* Pin action */}
      {isAdmin && onTogglePin && (
        <button
          onClick={() => onTogglePin(message.id, message.is_pinned)}
          className="opacity-0 group-hover:opacity-100 self-center p-1 rounded-full hover:bg-muted/50 transition-all"
          title={message.is_pinned ? 'Desafixar' : 'Fixar'}
        >
          <Pin className={cn('w-3 h-3', message.is_pinned ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/40')} />
        </button>
      )}
    </div>
  );
});
