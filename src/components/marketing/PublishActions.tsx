import { toast } from 'sonner';
import type { MarketingPost } from '@/types/marketing';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';

async function copyToClipboard(text: string) {
  try { await navigator.clipboard.writeText(text); } catch { /* silent */ }
}

async function downloadImage(url: string) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `post-${Date.now()}.jpg`;
    a.click();
    URL.revokeObjectURL(blobUrl);
  } catch { /* silent */ }
}

async function shareToInstagram(post: MarketingPost) {
  // 1. Copy caption
  if (post.caption) await copyToClipboard(post.caption);

  // 2. Download image so user has it in gallery
  if (post.media_urls.length > 0) {
    await downloadImage(post.media_urls[0]);
  }

  // 3. Open Instagram app directly (Stories camera as entry point)
  toast.success('Legenda copiada! Imagem salva. Abrindo Instagram...');

  // Try Instagram deep link — works on iOS/Android
  setTimeout(() => {
    window.location.href = 'instagram://camera';
    // Fallback to web if app not installed
    setTimeout(() => {
      window.open('https://instagram.com', '_blank');
    }, 1500);
  }, 300);
}

async function shareToWhatsApp(post: MarketingPost) {
  if (post.caption) await copyToClipboard(post.caption);
  const text = encodeURIComponent(post.caption || '');

  // Try native share with file for WhatsApp (this works well since WhatsApp appears in share sheet)
  if (navigator.share && post.media_urls.length > 0) {
    try {
      const res = await fetch(post.media_urls[0]);
      const blob = await res.blob();
      const file = new File([blob], 'post.jpg', { type: blob.type });
      await navigator.share({ text: post.caption || '', files: [file] });
      return;
    } catch { /* fall through */ }
  }

  window.open(`whatsapp://send?text=${text}`, '_blank');
}

interface PublishActionsProps { post: MarketingPost | null; open: boolean; onOpenChange: (open: boolean) => void; onConfirmPublished: (id: string) => void; }

export function PublishActions({ post, open, onOpenChange, onConfirmPublished }: PublishActionsProps) {
  if (!post) return null;

  const handlePublish = (channel: 'instagram' | 'whatsapp_status') => {
    if (channel === 'instagram') {
      shareToInstagram(post);
    } else {
      shareToWhatsApp(post);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="space-y-4">
        <SheetHeader><SheetTitle>Publicar Post</SheetTitle><SheetDescription>Escolha o canal e publique com 1 toque</SheetDescription></SheetHeader>
        <div className="space-y-3">
          {post.channels.includes('instagram') && (
            <Button variant="outline" className="w-full justify-start gap-3 h-14 border-pink-500/30 hover:bg-pink-500/10" onClick={() => handlePublish('instagram')}>
              <AppIcon name="photo_camera" size={20} className="text-pink-400" />
              <div className="text-left"><p className="text-sm font-medium">Instagram</p><p className="text-[10px] text-muted-foreground">Salva imagem + copia legenda + abre Instagram</p></div>
            </Button>
          )}
          {post.channels.includes('whatsapp_status') && (
            <Button variant="outline" className="w-full justify-start gap-3 h-14 border-emerald-500/30 hover:bg-emerald-500/10" onClick={() => handlePublish('whatsapp_status')}>
              <AppIcon name="MessageCircle" size={20} className="text-emerald-400" />
              <div className="text-left"><p className="text-sm font-medium">WhatsApp Status</p><p className="text-[10px] text-muted-foreground">Compartilha via WhatsApp</p></div>
            </Button>
          )}
        </div>
        <Button className="w-full" onClick={() => { onConfirmPublished(post.id); onOpenChange(false); }}>
          <AppIcon name="Check" size={16} className="mr-2" />Confirmar Publicação
        </Button>
      </SheetContent>
    </Sheet>
  );
}
