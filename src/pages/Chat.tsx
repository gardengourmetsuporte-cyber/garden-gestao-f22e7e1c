import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { NewConversationSheet } from '@/components/chat/NewConversationSheet';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export default function Chat() {
  const { user } = useAuth();
  const chat = useChat();
  const [showNewConv, setShowNewConv] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const activeConversation = chat.conversations.find(c => c.id === chat.activeConversationId) || null;

  const handleSelectConversation = (id: string) => {
    chat.setActiveConversationId(id);
    setMobileShowChat(true);
  };

  const handleBack = () => {
    setMobileShowChat(false);
  };

  const handleNewDirect = async (userId: string) => {
    const convId = await chat.createDirectConversation(userId);
    if (convId) {
      chat.setActiveConversationId(convId);
      setMobileShowChat(true);
    }
    return convId;
  };

  const handleNewGroup = async (name: string, memberIds: string[], type: 'group' | 'announcement') => {
    const convId = await chat.createGroupConversation(name, memberIds, type);
    if (convId) {
      chat.setActiveConversationId(convId);
      setMobileShowChat(true);
    }
    return convId;
  };

  return (
    <AppLayout>
      <div className="h-[calc(100vh-env(safe-area-inset-top)-3.75rem)] lg:h-screen flex">
        {/* Sidebar - hidden on mobile when chat is open */}
        <div
          className={cn(
            'w-full lg:w-80 shrink-0 flex flex-col',
            'lg:border-r',
            mobileShowChat ? 'hidden lg:flex' : 'flex'
          )}
          style={{ borderColor: 'hsl(var(--border) / 0.2)' }}
        >
          <ChatSidebar
            conversations={chat.conversations}
            activeConversationId={chat.activeConversationId}
            onSelect={handleSelectConversation}
            onNewConversation={() => setShowNewConv(true)}
            currentUserId={user?.id}
            isLoading={chat.isLoadingConversations}
          />
        </div>

        {/* Chat Window - hidden on mobile when sidebar is shown */}
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

      <NewConversationSheet
        open={showNewConv}
        onOpenChange={setShowNewConv}
        onCreateDirect={handleNewDirect}
        onCreateGroup={handleNewGroup}
      />
    </AppLayout>
  );
}
