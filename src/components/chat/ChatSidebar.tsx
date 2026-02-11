import { useState } from 'react';
import { ChatConversation } from '@/hooks/useChat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, Megaphone, Users, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday } from 'date-fns';

interface ChatSidebarProps {
  conversations: ChatConversation[];
  activeConversationId: string | null;
  onSelect: (id: string) => void;
  onNewConversation: () => void;
  currentUserId?: string;
  isLoading: boolean;
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, 'HH:mm');
  if (isYesterday(d)) return 'Ontem';
  return format(d, 'dd/MM');
}

export function ChatSidebar({ conversations, activeConversationId, onSelect, onNewConversation, currentUserId, isLoading }: ChatSidebarProps) {
  const [search, setSearch] = useState('');

  const filtered = conversations.filter(c => {
    if (!search) return true;
    const query = search.toLowerCase();
    if (c.name?.toLowerCase().includes(query)) return true;
    if (c.type === 'direct') {
      const other = c.participants?.find(p => p.user_id !== currentUserId);
      if (other?.profile?.full_name?.toLowerCase().includes(query)) return true;
    }
    return false;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-foreground">Chat</h2>
          <Button size="icon" variant="ghost" onClick={onNewConversation} className="w-9 h-9 rounded-xl">
            <Plus className="w-5 h-5" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar conversa..."
            className="pl-9 h-9 rounded-xl bg-secondary/50 border-border/20 text-sm"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-muted-foreground text-sm">Carregando...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/50">
            <Users className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm">{search ? 'Nenhum resultado' : 'Nenhuma conversa'}</p>
            <Button variant="link" onClick={onNewConversation} className="text-xs mt-1">
              Iniciar conversa
            </Button>
          </div>
        ) : (
          filtered.map(conv => {
            const isActive = conv.id === activeConversationId;
            const otherParticipant = conv.type === 'direct'
              ? conv.participants?.find(p => p.user_id !== currentUserId)
              : null;
            const displayName = conv.type === 'direct'
              ? otherParticipant?.profile?.full_name || 'Conversa'
              : conv.name || 'Grupo';
            const avatarUrl = conv.type === 'direct' ? otherParticipant?.profile?.avatar_url : null;
            const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
            const TypeIcon = conv.type === 'announcement' ? Megaphone : conv.type === 'group' ? Users : User;
            const lastMsg = conv.last_message;
            const lastMsgTime = lastMsg?.created_at || conv.updated_at;
            const hasUnread = (conv.unread_count || 0) > 0;

            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all',
                  isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
                )}
                style={isActive ? {
                  background: 'linear-gradient(135deg, hsl(var(--primary) / 0.1), hsl(var(--neon-cyan) / 0.05))',
                  border: '1px solid hsl(var(--neon-cyan) / 0.15)',
                } : undefined}
              >
                <div className="relative shrink-0">
                  {conv.type === 'direct' ? (
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={avatarUrl || undefined} />
                      <AvatarFallback className="text-xs bg-secondary">{initials}</AvatarFallback>
                    </Avatar>
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{
                        background: conv.type === 'announcement'
                          ? 'linear-gradient(135deg, hsl(45 100% 50% / 0.15), hsl(45 100% 50% / 0.05))'
                          : 'linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--neon-cyan) / 0.08))',
                        border: `1px solid ${conv.type === 'announcement' ? 'hsl(45 100% 50% / 0.2)' : 'hsl(var(--neon-cyan) / 0.2)'}`,
                      }}
                    >
                      <TypeIcon className={cn('w-4 h-4', conv.type === 'announcement' ? 'text-amber-400' : 'text-primary')} />
                    </div>
                  )}
                  {hasUnread && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[8px] font-bold flex items-center justify-center">
                      {conv.unread_count! > 9 ? '9+' : conv.unread_count}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={cn('text-sm font-medium truncate', hasUnread && 'text-foreground')}>{displayName}</span>
                    <span className="text-[10px] text-muted-foreground/50 shrink-0 ml-2">{formatTime(lastMsgTime)}</span>
                  </div>
                  {lastMsg && (
                    <p className={cn('text-xs truncate mt-0.5', hasUnread ? 'text-muted-foreground' : 'text-muted-foreground/50')}>
                      {lastMsg.content}
                    </p>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
