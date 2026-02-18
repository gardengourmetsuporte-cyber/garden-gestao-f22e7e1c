import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { AppIcon } from '@/components/ui/app-icon';
import { AnimatedTabs } from '@/components/ui/animated-tabs';
import { useMarketing } from '@/hooks/useMarketing';
import { MarketingCalendar } from '@/components/marketing/MarketingCalendar';
import { MarketingFeed } from '@/components/marketing/MarketingFeed';
import { MarketingIdeas } from '@/components/marketing/MarketingIdeas';
import { PostSheet } from '@/components/marketing/PostSheet';
import { PublishActions } from '@/components/marketing/PublishActions';
import type { MarketingPost } from '@/types/marketing';

export default function Marketing() {
  const { posts, isLoading, createPost, updatePost, deletePost, markPublished, uploadMedia } = useMarketing();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<MarketingPost | null>(null);
  const [publishPost, setPublishPost] = useState<MarketingPost | null>(null);
  const [activeTab, setActiveTab] = useState('calendar');

  const handleEdit = (post: MarketingPost) => {
    setEditingPost(post);
    setSheetOpen(true);
  };

  const handleNew = () => {
    setEditingPost(null);
    setSheetOpen(true);
  };

  const handleSave = (data: Partial<MarketingPost>) => {
    if (data.id) {
      updatePost.mutate({ id: data.id, ...data });
    } else {
      createPost.mutate(data);
    }
  };

  const handleQuickIdea = (title: string) => {
    createPost.mutate({ title, status: 'draft' });
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-background pb-24">
        <header className="page-header-bar">
          <div className="page-header-content flex items-center justify-between">
            <h1 className="page-title">Marketing</h1>
          </div>
        </header>

        <div className="px-4 py-4 space-y-4">
          <AnimatedTabs
            tabs={[
              { key: 'calendar', label: 'Calendário', icon: <AppIcon name="CalendarDays" size={16} /> },
              { key: 'feed', label: 'Feed', icon: <AppIcon name="LayoutList" size={16} /> },
              { key: 'ideas', label: 'Ideias', icon: <AppIcon name="Lightbulb" size={16} /> },
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          <div className="animate-fade-in" key={activeTab}>
            {activeTab === 'calendar' && (
              <MarketingCalendar
                posts={posts}
                onEdit={handleEdit}
                onDelete={id => deletePost.mutate(id)}
                onPublish={p => setPublishPost(p)}
              />
            )}
            {activeTab === 'feed' && (
              <MarketingFeed
                posts={posts}
                onEdit={handleEdit}
                onDelete={id => deletePost.mutate(id)}
                onPublish={p => setPublishPost(p)}
              />
            )}
            {activeTab === 'ideas' && (
              <MarketingIdeas
                posts={posts}
                onCreate={handleQuickIdea}
                onEdit={handleEdit}
                onDelete={id => deletePost.mutate(id)}
              />
            )}
          </div>
        </div>

        {/* FAB */}
        <button onClick={handleNew} className="fab">
          <AppIcon name="Plus" size={24} />
        </button>
      </div>

      <PostSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        post={editingPost}
        onSave={handleSave}
        onPublish={p => setPublishPost(p)}
        uploadMedia={uploadMedia}
        isSaving={createPost.isPending || updatePost.isPending}
      />

      <PublishActions
        post={publishPost}
        open={!!publishPost}
        onOpenChange={open => !open && setPublishPost(null)}
        onConfirmPublished={id => markPublished.mutate(id)}
      />
    </AppLayout>
  );
}
