import { useState, useEffect, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Instagram, MessageCircle, CalendarIcon, ImagePlus, X, Save, Send } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { MarketingPost, MarketingChannel } from '@/types/marketing';

interface PostSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: MarketingPost | null;
  onSave: (data: Partial<MarketingPost>) => void;
  onPublish: (post: MarketingPost) => void;
  uploadMedia: (file: File) => Promise<string>;
  isSaving: boolean;
}

export function PostSheet({ open, onOpenChange, post, onSave, onPublish, uploadMedia, isSaving }: PostSheetProps) {
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [channels, setChannels] = useState<MarketingChannel[]>([]);
  const [scheduledAt, setScheduledAt] = useState<Date | undefined>();
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (post) {
      setTitle(post.title);
      setCaption(post.caption || '');
      setChannels(post.channels || []);
      setScheduledAt(post.scheduled_at ? new Date(post.scheduled_at) : undefined);
      setTags((post.tags || []).join(', '));
      setNotes(post.notes || '');
      setMediaUrls(post.media_urls || []);
    } else {
      setTitle(''); setCaption(''); setChannels([]); setScheduledAt(undefined);
      setTags(''); setNotes(''); setMediaUrls([]);
    }
  }, [post, open]);

  const toggleChannel = (ch: MarketingChannel) => {
    setChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadMedia(file);
        urls.push(url);
      }
      setMediaUrls(prev => [...prev, ...urls]);
    } catch {
      // toast handled in hook
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removeMedia = (idx: number) => {
    setMediaUrls(prev => prev.filter((_, i) => i !== idx));
  };

  const buildData = (): Partial<MarketingPost> => ({
    ...(post ? { id: post.id } : {}),
    title: title.trim() || 'Sem título',
    caption,
    channels,
    scheduled_at: scheduledAt?.toISOString() || null,
    status: scheduledAt ? 'scheduled' : 'draft',
    tags: tags.split(',').map(t => t.trim()).filter(Boolean),
    notes: notes || null,
    media_urls: mediaUrls,
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="space-y-4 max-h-[90vh]">
        <SheetHeader>
          <SheetTitle>{post ? 'Editar Post' : 'Novo Post'}</SheetTitle>
          <SheetDescription>Planeje seu conteúdo de marketing</SheetDescription>
        </SheetHeader>

        <div className="space-y-4">
          <div>
            <Label>Título</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título do post" />
          </div>

          <div>
            <Label>Legenda <span className="text-muted-foreground text-xs">({caption.length}/2200)</span></Label>
            <Textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Escreva a legenda..."
              rows={4}
              maxLength={2200}
            />
          </div>

          {/* Media */}
          <div>
            <Label>Mídia</Label>
            <div className="flex gap-2 flex-wrap mt-1">
              {mediaUrls.map((url, i) => (
                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border/40">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeMedia(i)}
                    className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 flex items-center justify-center"
                  >
                    <X className="w-2.5 h-2.5 text-white" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-16 h-16 rounded-lg border-2 border-dashed border-border/60 flex items-center justify-center hover:bg-secondary transition-colors"
              >
                <ImagePlus className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          {/* Channels */}
          <div>
            <Label>Canais</Label>
            <div className="flex gap-3 mt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={channels.includes('instagram')} onCheckedChange={() => toggleChannel('instagram')} />
                <Instagram className="w-4 h-4 text-pink-400" />
                <span className="text-sm">Instagram</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={channels.includes('whatsapp_status')} onCheckedChange={() => toggleChannel('whatsapp_status')} />
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-sm">WhatsApp</span>
              </label>
            </div>
          </div>

          {/* Schedule */}
          <div>
            <Label>Agendar para</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal mt-1">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {scheduledAt ? format(scheduledAt, "PPP", { locale: ptBR }) : 'Sem agendamento'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={scheduledAt} onSelect={setScheduledAt} locale={ptBR} />
              </PopoverContent>
            </Popover>
          </div>

          {/* Tags */}
          <div>
            <Label>Tags <span className="text-muted-foreground text-xs">(separadas por vírgula)</span></Label>
            <Input value={tags} onChange={e => setTags(e.target.value)} placeholder="promoção, cardápio, novidade" />
          </div>

          {/* Notes */}
          <div>
            <Label>Notas internas</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Anotações..." rows={2} />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => { onSave(buildData()); onOpenChange(false); }}
              disabled={isSaving || !title.trim()}
            >
              <Save className="w-4 h-4 mr-2" /> Salvar
            </Button>
            {post && post.media_urls.length > 0 && channels.length > 0 && (
              <Button
                className="flex-1"
                onClick={() => { onSave(buildData()); onPublish({ ...post, ...buildData() } as MarketingPost); }}
                disabled={isSaving}
              >
                <Send className="w-4 h-4 mr-2" /> Publicar
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
