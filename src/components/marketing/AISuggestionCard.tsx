import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AppIcon } from '@/components/ui/app-icon';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface AISuggestion {
  title: string;
  caption: string;
  hashtags: string;
  best_time: string;
  image_prompt: string;
  category: string;
  image_url?: string;
}

interface Props {
  suggestion: AISuggestion;
  onSchedule: (data: any) => void;
  onGenerateImage: (prompt: string) => Promise<string | null>;
}

const categoryLabels: Record<string, { label: string; icon: string }> = {
  product: { label: 'Produto', icon: 'ShoppingBag' },
  engagement: { label: 'Engajamento', icon: 'Heart' },
  seasonal: { label: 'Sazonal', icon: 'Calendar' },
  behind_scenes: { label: 'Bastidores', icon: 'Camera' },
};

export function AISuggestionCard({ suggestion, onSchedule, onGenerateImage }: Props) {
  const [editing, setEditing] = useState(false);
  const [caption, setCaption] = useState(suggestion.caption);
  const [imageUrl, setImageUrl] = useState(suggestion.image_url || '');
  const [generatingImage, setGeneratingImage] = useState(false);
  const [sharing, setSharing] = useState(false);

  const cat = categoryLabels[suggestion.category] || categoryLabels.product;

  const handleGenerateImage = async () => {
    setGeneratingImage(true);
    try {
      const url = await onGenerateImage(suggestion.image_prompt);
      if (url) setImageUrl(url);
    } catch {
      toast.error('Erro ao gerar imagem');
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const fullCaption = `${caption}\n\n${suggestion.hashtags}`;

      // Copy caption to clipboard
      try { await navigator.clipboard.writeText(fullCaption); } catch { /* silent */ }

      // Download image so user has it in gallery
      if (imageUrl) {
        try {
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = `post-${Date.now()}.png`;
          a.click();
          URL.revokeObjectURL(blobUrl);
        } catch { /* silent */ }
      }

      // Open Instagram directly
      toast.success('Legenda copiada! Imagem salva. Abrindo Instagram...');
      setTimeout(() => {
        window.location.href = 'instagram://camera';
        setTimeout(() => {
          window.open('https://instagram.com', '_blank');
        }, 1500);
      }, 300);

      // Schedule as published
      onSchedule({
        title: suggestion.title,
        caption: fullCaption,
        media_urls: imageUrl ? [imageUrl] : [],
        channels: ['instagram'],
        status: 'published',
        published_at: new Date().toISOString(),
        tags: [suggestion.category],
      });
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        toast.error('Erro ao compartilhar');
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <Card className="border-border/40 overflow-hidden">
      {/* Image area */}
      <div className="aspect-square bg-muted/20 relative">
        {imageUrl ? (
          <img src={imageUrl} alt={suggestion.title} className="w-full h-full object-cover" />
        ) : generatingImage ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3">
            <AppIcon name="Loader2" size={32} className="animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Gerando criativo...</p>
          </div>
        ) : (
          <button
            onClick={handleGenerateImage}
            className="w-full h-full flex flex-col items-center justify-center gap-3 hover:bg-muted/30 transition-colors"
          >
            <AppIcon name="Wand2" size={32} className="text-primary/60" />
            <p className="text-xs text-muted-foreground">Gerar imagem com IA</p>
          </button>
        )}
      </div>

      <CardContent className="p-3 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 flex-1 min-w-0">
            <h3 className="text-sm font-bold text-foreground truncate">{suggestion.title}</h3>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 gap-1">
                <AppIcon name={cat.icon as any} size={10} />
                {cat.label}
              </Badge>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <AppIcon name="Clock" size={10} />
                {suggestion.best_time}
              </span>
            </div>
          </div>
        </div>

        {/* Caption */}
        {editing ? (
          <Textarea
            value={caption}
            onChange={e => setCaption(e.target.value)}
            className="text-xs min-h-[80px]"
            onBlur={() => setEditing(false)}
            autoFocus
          />
        ) : (
          <p
            className="text-xs text-muted-foreground line-clamp-4 cursor-pointer hover:text-foreground transition-colors"
            onClick={() => setEditing(true)}
          >
            {caption}
          </p>
        )}

        {/* Hashtags */}
        <p className="text-[10px] text-primary/80 line-clamp-1">{suggestion.hashtags}</p>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 h-9 text-xs"
            onClick={handleShare}
            disabled={sharing}
          >
            {sharing ? (
              <AppIcon name="Loader2" size={14} className="animate-spin mr-1" />
            ) : (
              <AppIcon name="Share2" size={14} className="mr-1" />
            )}
            Compartilhar
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-9 text-xs"
            onClick={() => setEditing(!editing)}
          >
            <AppIcon name="Pencil" size={14} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
