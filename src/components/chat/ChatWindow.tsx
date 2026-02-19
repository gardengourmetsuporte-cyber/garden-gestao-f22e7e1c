import { useState, useRef, useEffect, memo, useCallback } from 'react';
import { ChatMessage, ChatConversation } from '@/hooks/useChat';
import { ChatMessageComponent } from './ChatMessage';
import { AppIcon } from '@/components/ui/app-icon';
import { DefaultAvatar } from '@/components/profile/DefaultAvatar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface ChatWindowProps {
  conversation: ChatConversation | null;
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (content: string, attachment?: { url: string; type: string; name: string }) => Promise<void>;
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
    <div className="flex-1 p-4 space-y-3">
      {[false, true, false, true, false].map((isMine, i) => (
        <div key={i} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
          <div className={cn(
            'h-10 rounded-2xl bg-secondary/40 animate-pulse',
            isMine ? 'w-44 rounded-tr-md' : 'w-56 rounded-tl-md'
          )} />
        </div>
      ))}
    </div>
  );
}

export const ChatWindow = memo(function ChatWindow({ conversation, messages, isLoading, onSendMessage, onBack, onTogglePin, currentUserId }: ChatWindowProps) {
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [plusOpen, setPlusOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isAdmin } = useAuth();

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
  };

  const handleFileUpload = useCallback(async (file: File) => {
    if (!conversation) return;
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('Arquivo muito grande (máx 10MB)');
      return;
    }

    setIsUploading(true);
    setPlusOpen(false);

    try {
      const ext = file.name.split('.').pop() || 'bin';
      const path = `${conversation.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(path, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(path);

      const isImage = file.type.startsWith('image/');

      await onSendMessage(
        input.trim(),
        {
          url: urlData.publicUrl,
          type: isImage ? 'image' : 'file',
          name: file.name,
        }
      );
      setInput('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Erro ao enviar arquivo');
    } finally {
      setIsUploading(false);
    }
  }, [conversation, input, onSendMessage]);

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
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    await onSendMessage(msg);
    setIsSending(false);
    textareaRef.current?.focus();
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
      <div className="shrink-0 border-b border-border/20 bg-card">
        <div className="flex items-center gap-3 h-16 px-4">
          <button onClick={onBack} className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-secondary transition-colors active:scale-95">
            <AppIcon name="ArrowLeft" size={20} className="text-foreground" />
          </button>

          {/* Avatar with online indicator */}
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-full overflow-hidden">
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
            {conversation.type === 'direct' && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-card" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-foreground truncate leading-none">{displayName}</p>
            <p className="text-[11px] text-muted-foreground/60 mt-0.5">
              {conversation.type === 'announcement' ? 'Canal de comunicados' :
               conversation.type === 'group' ? `${conversation.participants?.length || 0} membros` :
               'Online'}
            </p>
          </div>
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
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
        style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, hsl(var(--muted) / 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, hsl(var(--muted) / 0.1) 0%, transparent 50%)' }}
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
        <div
          className="shrink-0 border-t border-border/20 bg-card px-4 py-3"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
        >
          <div className="flex items-end gap-2">
            <Popover open={plusOpen} onOpenChange={setPlusOpen}>
              <PopoverTrigger asChild>
                <button
                  disabled={isUploading}
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all mb-0.5',
                    isUploading
                      ? 'text-muted-foreground/20 animate-pulse'
                      : 'text-muted-foreground/40 hover:bg-muted/50 hover:text-muted-foreground/70'
                  )}
                >
                  <AppIcon name={isUploading ? 'Loader2' : 'Plus'} size={20} className={isUploading ? 'animate-spin' : ''} />
                </button>
              </PopoverTrigger>
              <PopoverContent side="top" align="start" className="w-48 p-1.5 rounded-xl">
                <button
                  onClick={() => { imageInputRef.current?.click(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-muted/50 transition-colors"
                >
                  <AppIcon name="Image" size={18} className="text-primary" />
                  <span>Imagem / Foto</span>
                </button>
                <button
                  onClick={() => { fileInputRef.current?.click(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-muted/50 transition-colors"
                >
                  <AppIcon name="FileText" size={18} className="text-primary" />
                  <span>Arquivo</span>
                </button>
              </PopoverContent>
            </Popover>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]); e.target.value = ''; }}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar"
              className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]); e.target.value = ''; }}
            />
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={isAnnouncement ? 'Escrever comunicado...' : 'Mensagem...'}
              rows={1}
              className="flex-1 min-h-[44px] max-h-24 text-sm rounded-2xl bg-secondary/50 border border-border/30 focus:border-primary/30 focus:outline-none px-4 py-3 text-foreground placeholder:text-muted-foreground/40 transition-colors resize-none"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isSending}
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-90 mb-0.5',
                input.trim()
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-100'
                  : 'bg-transparent text-muted-foreground/20 scale-90 pointer-events-none'
              )}
            >
              <AppIcon name="Send" size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div className="shrink-0 px-4 py-3 text-center border-t border-border/30 bg-muted/20">
          <p className="text-xs text-muted-foreground/40">Apenas administradores podem enviar comunicados</p>
        </div>
      )}
    </div>
  );
});
