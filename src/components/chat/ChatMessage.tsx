import { memo } from 'react';
import { ChatMessage as ChatMessageType } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { DefaultAvatar } from '@/components/profile/DefaultAvatar';
import { Pin, FileText, Download } from 'lucide-react';
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
    <div className={cn('flex gap-1.5 px-4 py-0.5 group', isMine ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar - 28px */}
      {!isMine && showAvatar ? (
        <div className="w-7 h-7 shrink-0 mt-1 rounded-full overflow-hidden">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <DefaultAvatar name={senderName} size={28} userId={message.sender_id} />
          )}
        </div>
      ) : !isMine ? (
        <div className="w-7 shrink-0" />
      ) : null}

      <div className={cn('max-w-[78%] flex flex-col', isMine ? 'items-end' : 'items-start')}>
        {/* Sender name */}
        {showAvatar && showName && !isMine && (
          <span className="text-[11px] text-muted-foreground/50 mb-0.5 px-2 font-medium">
            {senderName}
          </span>
        )}

        {/* Message bubble - flat style */}
        <div
          className={cn(
            'relative px-3.5 py-2 text-[14px] leading-[1.45] break-words',
            isMine
              ? 'rounded-2xl rounded-br-md bg-primary text-primary-foreground'
              : 'rounded-2xl rounded-bl-md bg-muted/60 text-foreground',
            message.is_pinned && 'ring-1 ring-amber-500/30'
          )}
        >
          {message.is_pinned && (
            <Pin className="absolute -top-1.5 -right-1.5 w-3 h-3 text-amber-400 fill-amber-400" />
          )}

          {/* Attachment */}
          {message.attachment_url && message.attachment_type === 'image' && (
            <a href={message.attachment_url} target="_blank" rel="noopener noreferrer" className="block mb-1.5 -mx-1 -mt-0.5">
              <img
                src={message.attachment_url}
                alt={message.attachment_name || 'Imagem'}
                className="rounded-lg max-w-full max-h-60 object-cover"
              />
            </a>
          )}
          {message.attachment_url && message.attachment_type === 'file' && (
            <a
              href={message.attachment_url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'flex items-center gap-2 mb-1.5 px-3 py-2 rounded-lg text-xs',
                isMine ? 'bg-primary-foreground/10' : 'bg-foreground/5'
              )}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span className="truncate flex-1">{message.attachment_name || 'Arquivo'}</span>
              <Download className="w-3.5 h-3.5 shrink-0 opacity-60" />
            </a>
          )}

          {/* Text content - hide if it's just the attachment placeholder */}
          {message.content && !(message.attachment_url && message.content.startsWith('📎')) && (
            <span className="whitespace-pre-wrap">{message.content}</span>
          )}
          <span className={cn(
            'inline-block ml-2 text-[10px] align-bottom opacity-50 float-right mt-1',
            isMine ? 'text-primary-foreground' : 'text-muted-foreground'
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
