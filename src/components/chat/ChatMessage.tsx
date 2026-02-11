import { ChatMessage as ChatMessageType } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Pin } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: ChatMessageType;
  onTogglePin?: (messageId: string, isPinned: boolean) => void;
  showAvatar?: boolean;
}

export function ChatMessageComponent({ message, onTogglePin, showAvatar = true }: ChatMessageProps) {
  const { user, isAdmin } = useAuth();
  const isMine = message.sender_id === user?.id;
  const initials = (message.sender_profile?.full_name || 'U')
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={cn('flex gap-2 px-4 py-1 group', isMine ? 'flex-row-reverse' : 'flex-row')}>
      {showAvatar ? (
        <Avatar className="w-8 h-8 shrink-0 mt-1">
          <AvatarImage src={message.sender_profile?.avatar_url || undefined} />
          <AvatarFallback className="text-[10px] bg-secondary text-muted-foreground">{initials}</AvatarFallback>
        </Avatar>
      ) : (
        <div className="w-8 shrink-0" />
      )}

      <div className={cn('max-w-[75%] flex flex-col', isMine ? 'items-end' : 'items-start')}>
        {showAvatar && !isMine && (
          <span className="text-[10px] text-muted-foreground mb-0.5 px-1">
            {message.sender_profile?.full_name}
          </span>
        )}
        <div
          className={cn(
            'relative rounded-2xl px-3.5 py-2 text-sm leading-relaxed break-words',
            isMine
              ? 'rounded-tr-md'
              : 'rounded-tl-md',
            message.is_pinned && 'ring-1 ring-amber-500/40'
          )}
          style={
            isMine
              ? {
                  background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.85))',
                  color: 'hsl(var(--primary-foreground))',
                }
              : {
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border) / 0.3)',
                  color: 'hsl(var(--foreground))',
                }
          }
        >
          {message.is_pinned && (
            <Pin className="absolute -top-1.5 -right-1.5 w-3 h-3 text-amber-400 fill-amber-400" />
          )}
          {message.content}
        </div>
        <span className="text-[9px] text-muted-foreground/60 mt-0.5 px-1">
          {format(new Date(message.created_at), 'HH:mm', { locale: ptBR })}
        </span>
      </div>

      {/* Pin action for admins */}
      {isAdmin && onTogglePin && (
        <button
          onClick={() => onTogglePin(message.id, message.is_pinned)}
          className="opacity-0 group-hover:opacity-100 self-center p-1 rounded hover:bg-secondary transition-all"
          title={message.is_pinned ? 'Desafixar' : 'Fixar'}
        >
          <Pin className={cn('w-3 h-3', message.is_pinned ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground')} />
        </button>
      )}
    </div>
  );
}
