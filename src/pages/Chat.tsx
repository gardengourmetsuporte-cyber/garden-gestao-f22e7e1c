import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { useChat, ChatConversation } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/ui/app-icon';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday } from 'date-fns';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';

interface Contact {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, 'HH:mm');
  if (isYesterday(d)) return 'Ontem';
  return format(d, 'dd/MM');
}

function ConversationSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3 py-3">
      <Skeleton className="w-14 h-14 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3 w-10" />
        </div>
        <Skeleton className="h-3 w-40" />
      </div>
    </div>
  );
}

export default function Chat() {
  const { user, isAdmin } = useAuth();
  const { activeUnitId } = useUnit();
  const chat = useChat();
  const [search, setSearch] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [showGroupSheet, setShowGroupSheet] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupType, setGroupType] = useState<'group' | 'announcement'>('group');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [groupSearch, setGroupSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const activeConversation = chat.conversations.find(c => c.id === chat.activeConversationId) || null;

  // Fetch contacts
  useEffect(() => {
    if (!activeUnitId || !user) return;
    (async () => {
      const { data: unitUsers } = await supabase
        .from('user_units')
        .select('user_id')
        .eq('unit_id', activeUnitId);
      if (!unitUsers) return;
      const userIds = unitUsers.map(u => u.user_id).filter(id => id !== user.id);
      if (userIds.length === 0) { setContacts([]); return; }
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds)
        .order('full_name');
      setContacts(profiles || []);
    })();
  }, [activeUnitId, user]);

  const contactsWithoutDM = contacts.filter(c =>
    !chat.conversations.some(conv =>
      conv.type === 'direct' && conv.participants?.some(p => p.user_id === c.user_id)
    )
  );

  const filteredConversations = chat.conversations.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    if (c.name?.toLowerCase().includes(q)) return true;
    if (c.type === 'direct') {
      const other = c.participants?.find(p => p.user_id !== user?.id);
      if (other?.profile?.full_name?.toLowerCase().includes(q)) return true;
    }
    return false;
  });

  const filteredNewContacts = contactsWithoutDM.filter(c =>
    !search || c.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectConversation = (id: string) => {
    chat.setActiveConversationId(id);
    setMobileShowChat(true);
  };

  const handleStartDM = async (userId: string) => {
    const convId = await chat.createDirectConversation(userId);
    if (convId) {
      chat.setActiveConversationId(convId);
      setMobileShowChat(true);
    }
  };

  const handleBack = () => setMobileShowChat(false);

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedIds.length === 0) return;
    setIsCreating(true);
    const convId = await chat.createGroupConversation(groupName.trim(), selectedIds, groupType);
    setIsCreating(false);
    if (convId) {
      chat.setActiveConversationId(convId);
      setMobileShowChat(true);
      setShowGroupSheet(false);
      setGroupName('');
      setSelectedIds([]);
    }
  };

  const openGroupSheet = (type: 'group' | 'announcement') => {
    setGroupType(type);
    setGroupName('');
    setSelectedIds([]);
    setGroupSearch('');
    setShowGroupSheet(true);
  };

  const filteredGroupContacts = contacts.filter(c =>
    !groupSearch || c.full_name.toLowerCase().includes(groupSearch.toLowerCase())
  );

  const renderConversationList = () => (
    <div className="flex flex-col h-full bg-background">
      {/* Instagram-style header */}
      <div className="shrink-0 px-5 pt-4 pb-1">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold tracking-tight">Mensagens</h1>
          {isAdmin && (
            <div className="flex items-center gap-0.5">
              <Button size="icon" variant="ghost" onClick={() => openGroupSheet('group')} className="w-9 h-9 rounded-full" title="Novo grupo">
                <AppIcon name="Users" size={20} />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => openGroupSheet('announcement')} className="w-9 h-9 rounded-full" title="Novo canal">
                <AppIcon name="Megaphone" size={20} />
              </Button>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <AppIcon name="Search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Pesquisar"
            className="pl-10 h-9 rounded-xl bg-muted/50 border-0 text-sm placeholder:text-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-primary/30"
          />
        </div>
      </div>

      {/* Stories-style online contacts bar */}
      {contacts.length > 0 && !search && (
        <div className="shrink-0 px-2 pb-3">
          <div className="flex gap-3 overflow-x-auto scrollbar-hide px-2 py-1">
            {contacts.slice(0, 12).map(contact => {
              const initials = contact.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
              const firstName = contact.full_name.split(' ')[0];
              return (
                <button
                  key={contact.user_id}
                  onClick={() => handleStartDM(contact.user_id)}
                  className="flex flex-col items-center gap-1 min-w-[60px] active:scale-95 transition-transform"
                >
                  <div className="relative">
                    <div className="w-[56px] h-[56px] rounded-full p-[2px] bg-gradient-to-br from-primary via-primary/60 to-accent">
                      <Avatar className="w-full h-full border-2 border-background">
                        <AvatarImage src={contact.avatar_url || undefined} />
                        <AvatarFallback className="text-xs bg-muted font-semibold">{initials}</AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                  <span className="text-[11px] text-muted-foreground truncate w-[60px] text-center">{firstName}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {chat.isLoadingConversations ? (
          <div className="px-2">
            {Array.from({ length: 6 }).map((_, i) => <ConversationSkeleton key={i} />)}
          </div>
        ) : (
          <>
            {filteredConversations.map(conv => {
              const otherParticipant = conv.type === 'direct'
                ? conv.participants?.find(p => p.user_id !== user?.id)
                : null;
              const displayName = conv.type === 'direct'
                ? otherParticipant?.profile?.full_name || 'Conversa'
                : conv.name || 'Grupo';
              const avatarUrl = conv.type === 'direct' ? otherParticipant?.profile?.avatar_url : null;
              const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
              const lastMsg = conv.last_message;
              const lastMsgTime = lastMsg?.created_at || conv.updated_at;
              const hasUnread = (conv.unread_count || 0) > 0;
              const isActive = conv.id === chat.activeConversationId;

              return (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors active:bg-muted/60',
                    isActive ? 'bg-muted/40' : 'hover:bg-muted/20'
                  )}
                >
                  <div className="relative shrink-0">
                    {conv.type === 'direct' ? (
                      <Avatar className="w-14 h-14">
                        <AvatarImage src={avatarUrl || undefined} />
                        <AvatarFallback className="text-sm bg-muted font-semibold">{initials}</AvatarFallback>
                      </Avatar>
                    ) : (
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center"
                        style={{
                          background: conv.type === 'announcement'
                            ? 'hsl(45 100% 50% / 0.1)'
                            : 'hsl(var(--primary) / 0.1)',
                        }}
                      >
                        <AppIcon
                          name={conv.type === 'announcement' ? 'Megaphone' : 'Users'}
                          size={22}
                          className={conv.type === 'announcement' ? 'text-amber-400' : 'text-primary'}
                        />
                      </div>
                    )}
                    {hasUnread && (
                      <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow-sm">
                        {conv.unread_count! > 9 ? '9+' : conv.unread_count}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={cn('text-[15px] truncate', hasUnread ? 'font-semibold text-foreground' : 'font-medium text-foreground/90')}>
                        {displayName}
                      </span>
                      <span className={cn('text-xs shrink-0 ml-2', hasUnread ? 'text-primary font-medium' : 'text-muted-foreground/50')}>
                        {formatTime(lastMsgTime)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {lastMsg ? (
                        <p className={cn('text-[13px] truncate', hasUnread ? 'text-foreground/70 font-medium' : 'text-muted-foreground/50')}>
                          {lastMsg.content}
                        </p>
                      ) : (
                        <p className="text-[13px] text-muted-foreground/40 italic">Sem mensagens</p>
                      )}
                    </div>
                  </div>

                  {hasUnread && (
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                  )}
                </button>
              );
            })}

            {/* New contacts section */}
            {filteredNewContacts.length > 0 && search && (
              <div className="px-4 pt-4">
                <p className="text-xs font-semibold text-muted-foreground/50 uppercase tracking-wider mb-2">Iniciar conversa</p>
                {filteredNewContacts.map(contact => {
                  const initials = contact.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                  return (
                    <button
                      key={contact.user_id}
                      onClick={() => handleStartDM(contact.user_id)}
                      className="w-full flex items-center gap-3 px-1 py-2.5 transition-colors active:bg-muted/60 hover:bg-muted/20"
                    >
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={contact.avatar_url || undefined} />
                        <AvatarFallback className="text-sm bg-muted font-semibold">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <p className="text-[15px] font-medium text-foreground">{contact.full_name}</p>
                        <p className="text-xs text-muted-foreground/40">Enviar mensagem</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Empty */}
            {filteredConversations.length === 0 && filteredNewContacts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/30">
                <AppIcon name="MessageCircle" size={48} className="mb-3 opacity-40" />
                <p className="text-sm font-medium">{search ? 'Nenhum resultado' : 'Nenhuma conversa'}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <AppLayout>
      <div className="h-[calc(100vh-env(safe-area-inset-top)-3.75rem)] lg:h-screen flex">
        {/* Left: Conversation list */}
        <div className={cn(
          'w-full lg:w-[380px] shrink-0 flex flex-col',
          'lg:border-r border-border/10',
          mobileShowChat ? 'hidden lg:flex' : 'flex'
        )}>
          {renderConversationList()}
        </div>

        {/* Right: Chat window */}
        <div className={cn('flex-1 flex flex-col', mobileShowChat ? 'flex' : 'hidden lg:flex')}>
          <ChatWindow
            conversation={activeConversation}
            messages={chat.messages}
            isLoading={chat.isLoadingMessages}
            onSendMessage={chat.sendMessage}
            onBack={handleBack}
            onTogglePin={chat.togglePin}
            currentUserId={user?.id}
          />
        </div>
      </div>

      {/* Group/Announcement creation sheet */}
      <Sheet open={showGroupSheet} onOpenChange={setShowGroupSheet}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl bg-background border-border/20">
          <SheetHeader>
            <SheetTitle className="text-foreground">
              {groupType === 'announcement' ? 'Novo Canal de Comunicados' : 'Novo Grupo'}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 flex flex-col h-[calc(100%-80px)]">
            <div className="mb-3">
              <Input
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                placeholder={groupType === 'announcement' ? 'Nome do canal...' : 'Nome do grupo...'}
                className="h-10 rounded-xl bg-muted/50 border-border/20"
              />
            </div>
            <div className="relative mb-3">
              <AppIcon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
              <Input
                value={groupSearch}
                onChange={e => setGroupSearch(e.target.value)}
                placeholder="Buscar contato..."
                className="pl-9 h-9 rounded-xl bg-muted/50 border-border/20 text-sm"
              />
            </div>
            {selectedIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {selectedIds.map(id => {
                  const c = contacts.find(x => x.user_id === id);
                  return (
                    <button
                      key={id}
                      onClick={() => setSelectedIds(prev => prev.filter(x => x !== id))}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/15 text-primary text-xs font-medium"
                    >
                      {c?.full_name?.split(' ')[0]}
                      <span className="text-primary/50">×</span>
                    </button>
                  );
                })}
              </div>
            )}
            <div className="flex-1 overflow-y-auto space-y-0.5">
              {filteredGroupContacts.map(contact => {
                const initials = contact.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                const isSelected = selectedIds.includes(contact.user_id);
                return (
                  <button
                    key={contact.user_id}
                    onClick={() => setSelectedIds(prev =>
                      prev.includes(contact.user_id) ? prev.filter(x => x !== contact.user_id) : [...prev, contact.user_id]
                    )}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all',
                      isSelected ? 'bg-primary/10' : 'hover:bg-muted/50'
                    )}
                  >
                    <Checkbox checked={isSelected} className="pointer-events-none" />
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={contact.avatar_url || undefined} />
                      <AvatarFallback className="text-xs bg-muted">{initials}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-foreground">{contact.full_name}</span>
                  </button>
                );
              })}
            </div>
            <div className="shrink-0 pt-3">
              <Button
                onClick={handleCreateGroup}
                disabled={!groupName.trim() || selectedIds.length === 0 || isCreating}
                className="w-full rounded-xl"
              >
                {isCreating ? 'Criando...' : `Criar ${groupType === 'announcement' ? 'Canal' : 'Grupo'} (${selectedIds.length})`}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
}
