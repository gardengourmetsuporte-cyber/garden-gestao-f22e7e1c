import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { DesktopActionBar } from '@/components/layout/DesktopActionBar';
import { AppIcon } from '@/components/ui/app-icon';
import { useFabAction } from '@/contexts/FabActionContext';
import { AnimatedTabs } from '@/components/ui/animated-tabs';
import { useScrollToTopOnChange } from '@/components/ScrollToTop';
import { useMarketing } from '@/hooks/useMarketing';
import { MarketingDailyFeed } from '@/components/marketing/MarketingDailyFeed';
import { MarketingCalendarGrid } from '@/components/marketing/MarketingCalendarGrid';
import { MarketingBrandTab } from '@/components/marketing/MarketingBrandTab';
import { PostSheet } from '@/components/marketing/PostSheet';
import { PublishActions } from '@/components/marketing/PublishActions';
import { UpgradeWall } from '@/components/paywall/UpgradeWall';
import { useAuth } from '@/contexts/AuthContext';
import type { MarketingPost } from '@/types/marketing';

export default function Marketing() {
  const { hasPlan } = useAuth();
  const { posts, isLoading, createPost, updatePost, deletePost, markPublished, uploadMedia } = useMarketing();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<MarketingPost | null>(null);
  const [publishPost, setPublishPost] = useState<MarketingPost | null>(null);
  const [activeTab, setActiveTab] = useState('today');
  useScrollToTopOnChange(activeTab);
  const [prefillDate, setPrefillDate] = useState<Date | null>(null);
  const [prefillTitle, setPrefillTitle] = useState('');

  useFabAction({ icon: 'Plus', label: 'Novo Post', onClick: () => { setEditingPost(null); setPrefillDate(null); setPrefillTitle(''); setSheetOpen(true); } }, []);

  if (!hasPlan('business')) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-background pb-28 lg:pb-12">
          <UpgradeWall moduleKey="marketing" moduleLabel="Marketing" />
        </div>
      </AppLayout>
    );
  }

  const handleEdit = (post: MarketingPost) => {
    setEditingPost(post);
    setPrefillDate(null);
    setPrefillTitle('');
    setSheetOpen(true);
  };

  const handleNewPost = (date?: Date) => {
    setEditingPost(null);
    setPrefillDate(date || null);
    setPrefillTitle('');
    setSheetOpen(true);
  };

  const handleSave = (data: Partial<MarketingPost>) => {
    if (data.id) {
      updatePost.mutate({ id: data.id, ...data });
    } else {
      createPost.mutate(data);
    }
  };

  const handleAISchedule = (data: Partial<MarketingPost>) => {
    createPost.mutate(data);
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-background pb-24 lg:pb-12">
        <div className="px-4 py-3 lg:px-8 lg:max-w-6xl lg:mx-auto space-y-4">
          <DesktopActionBar label="Novo Post" onClick={() => { setEditingPost(null); setPrefillDate(null); setPrefillTitle(''); setSheetOpen(true); }} />

          <AnimatedTabs
            tabs={[
              { key: 'today', label: 'Hoje', icon: <AppIcon name="Sparkles" size={16} /> },
              { key: 'calendar', label: 'Calendário', icon: <AppIcon name="CalendarDays" size={16} /> },
              { key: 'brand', label: 'Marca', icon: <AppIcon name="Palette" size={16} /> },
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          <div className="animate-fade-in" key={activeTab}>
            {activeTab === 'today' && (
              <MarketingDailyFeed onSchedule={handleAISchedule} />
            )}
            {activeTab === 'calendar' && (
              <MarketingCalendarGrid
                posts={posts}
                onEdit={handleEdit}
                onDelete={id => deletePost.mutate(id)}
                onPublish={p => setPublishPost(p)}
                onNewPost={handleNewPost}
              />
            )}
            {activeTab === 'brand' && (
              <MarketingBrandTab />
            )}
          </div>
        </div>
      </div>

      <PostSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        post={editingPost}
        onSave={handleSave}
        onPublish={p => setPublishPost(p)}
        uploadMedia={uploadMedia}
        isSaving={createPost.isPending || updatePost.isPending}
        prefillDate={prefillDate}
        prefillTitle={prefillTitle}
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
