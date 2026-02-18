import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, CalendarDays, LayoutList, Lightbulb } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
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
      <div className="page-header-bar">
        <div className="page-header-content flex items-center justify-between">
          <h1 className="page-title">Marketing</h1>
          <Button size="sm" onClick={handleNew} className="gap-1.5">
            <Plus className="w-4 h-4" /> Novo Post
          </Button>
        </div>
      </div>

      <div className="p-4 pb-24">
        <Tabs defaultValue="calendar" className="space-y-4">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="calendar" className="gap-1.5 text-xs">
              <CalendarDays className="w-3.5 h-3.5" /> Calendário
            </TabsTrigger>
            <TabsTrigger value="feed" className="gap-1.5 text-xs">
              <LayoutList className="w-3.5 h-3.5" /> Feed
            </TabsTrigger>
            <TabsTrigger value="ideas" className="gap-1.5 text-xs">
              <Lightbulb className="w-3.5 h-3.5" /> Ideias
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar">
            <MarketingCalendar
              posts={posts}
              onEdit={handleEdit}
              onDelete={id => deletePost.mutate(id)}
              onPublish={p => setPublishPost(p)}
            />
          </TabsContent>

          <TabsContent value="feed">
            <MarketingFeed
              posts={posts}
              onEdit={handleEdit}
              onDelete={id => deletePost.mutate(id)}
              onPublish={p => setPublishPost(p)}
            />
          </TabsContent>

          <TabsContent value="ideas">
            <MarketingIdeas
              posts={posts}
              onCreate={handleQuickIdea}
              onEdit={handleEdit}
              onDelete={id => deletePost.mutate(id)}
            />
          </TabsContent>
        </Tabs>
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
