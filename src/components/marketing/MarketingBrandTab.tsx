import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AppIcon } from '@/components/ui/app-icon';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useBrandCore } from '@/hooks/useBrandCore';
import type { BrandAssetType } from '@/types/brand';
import { toast } from 'sonner';

const ASSET_TYPES: { value: BrandAssetType; label: string; icon: string }[] = [
  { value: 'logo', label: 'Logo', icon: 'Stamp' },
  { value: 'product_photo', label: 'Produto', icon: 'ShoppingBag' },
  { value: 'environment', label: 'Ambiente', icon: 'Home' },
  { value: 'menu', label: 'Cardápio', icon: 'BookOpen' },
  { value: 'manual', label: 'Manual', icon: 'FileText' },
  { value: 'reference', label: 'Referência', icon: 'Image' },
];

export function MarketingBrandTab() {
  const {
    identity, identityLoading, upsertIdentity,
    assets, assetsLoading, createAsset, deleteAsset, uploadAssetFile,
  } = useBrandCore();

  // Identity state
  const [instagramUrl, setInstagramUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [colors, setColors] = useState({ primary: '#22c55e', secondary: '#0a1a10', accent: '#f59e0b', background: '#ffffff' });
  const [typography, setTypography] = useState({ headings: 'Inter', body: 'Inter' });
  const [toneOfVoice, setToneOfVoice] = useState('');
  const [tagline, setTagline] = useState('');
  const [phrases, setPhrases] = useState<string[]>([]);
  const [newPhrase, setNewPhrase] = useState('');

  // Gallery state
  const [filterType, setFilterType] = useState<string>('all');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<BrandAssetType>('product_photo');
  const [newTags, setNewTags] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (identity) {
      setColors(identity.colors || { primary: '#22c55e', secondary: '#0a1a10', accent: '#f59e0b', background: '#ffffff' });
      setTypography(identity.typography || { headings: 'Inter', body: 'Inter' });
      setToneOfVoice(identity.tone_of_voice || '');
      setTagline(identity.tagline || '');
      setPhrases(identity.institutional_phrases || []);
      setInstagramUrl((identity as any).instagram_url || '');
      setWebsiteUrl((identity as any).website_url || '');
    }
  }, [identity]);

  const handleSaveIdentity = () => {
    upsertIdentity.mutate({
      colors,
      typography,
      tone_of_voice: toneOfVoice,
      tagline,
      institutional_phrases: phrases,
      instagram_url: instagramUrl,
      website_url: websiteUrl,
    } as any);
  };

  const addPhrase = () => {
    if (newPhrase.trim()) {
      setPhrases(prev => [...prev, newPhrase.trim()]);
      setNewPhrase('');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('Arquivo máximo: 10MB'); return; }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setNewTitle(file.name.split('.')[0]);
    setSheetOpen(true);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const url = await uploadAssetFile(selectedFile);
      await createAsset.mutateAsync({
        type: newType,
        file_url: url,
        title: newTitle,
        tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
      });
      setSheetOpen(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      setNewTitle('');
      setNewTags('');
    } catch {
      toast.error('Erro no upload');
    } finally {
      setUploading(false);
    }
  };

  const filtered = filterType === 'all' ? assets : assets.filter(a => a.type === filterType);

  if (identityLoading) {
    return <div className="flex justify-center py-12"><AppIcon name="Loader2" className="animate-spin text-primary" size={24} /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Section 1: Links */}
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <AppIcon name="Link" size={16} className="text-primary" />
            Links da Marca
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1">
                <AppIcon name="Instagram" size={12} /> Instagram
              </Label>
              <Input
                value={instagramUrl}
                onChange={e => setInstagramUrl(e.target.value)}
                placeholder="https://instagram.com/seurestaurante"
                className="text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1">
                <AppIcon name="Globe" size={12} /> Website
              </Label>
              <Input
                value={websiteUrl}
                onChange={e => setWebsiteUrl(e.target.value)}
                placeholder="https://seurestaurante.com.br"
                className="text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Identity (compact) */}
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <AppIcon name="Palette" size={16} className="text-primary" />
            Identidade Visual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Colors */}
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(colors).map(([key, value]) => (
              <div key={key} className="space-y-1">
                <Label className="text-[10px] capitalize">
                  {key === 'background' ? 'Fundo' : key === 'primary' ? 'Primária' : key === 'secondary' ? 'Secundária' : 'Destaque'}
                </Label>
                <div className="flex gap-1 items-center">
                  <input
                    type="color"
                    value={value}
                    onChange={e => setColors(prev => ({ ...prev, [key]: e.target.value }))}
                    className="w-8 h-8 rounded-md border border-border/40 cursor-pointer"
                  />
                  <span className="text-[9px] text-muted-foreground">{value}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Typography */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Fonte títulos</Label>
              <Input value={typography.headings} onChange={e => setTypography(prev => ({ ...prev, headings: e.target.value }))} className="text-xs h-8" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fonte corpo</Label>
              <Input value={typography.body} onChange={e => setTypography(prev => ({ ...prev, body: e.target.value }))} className="text-xs h-8" />
            </div>
          </div>

          {/* Tone */}
          <div className="space-y-1">
            <Label className="text-xs">Tagline</Label>
            <Input value={tagline} onChange={e => setTagline(e.target.value)} placeholder="O sabor que conecta" className="text-xs h-8" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Tom de voz</Label>
            <Textarea value={toneOfVoice} onChange={e => setToneOfVoice(e.target.value)} placeholder="Informal, acolhedor..." rows={2} className="text-xs" />
          </div>

          {/* Phrases */}
          <div className="space-y-2">
            <Label className="text-xs">Frases institucionais</Label>
            <div className="flex gap-2">
              <Input value={newPhrase} onChange={e => setNewPhrase(e.target.value)} placeholder="Adicionar frase..." className="text-xs h-8" onKeyDown={e => e.key === 'Enter' && addPhrase()} />
              <Button size="icon" variant="outline" onClick={addPhrase} className="h-8 w-8"><AppIcon name="Plus" size={14} /></Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {phrases.map((phrase, i) => (
                <Badge key={i} variant="secondary" className="gap-1 cursor-pointer text-[10px]" onClick={() => setPhrases(prev => prev.filter((_, idx) => idx !== i))}>
                  {phrase} <AppIcon name="X" size={10} />
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSaveIdentity} disabled={upsertIdentity.isPending} className="w-full">
        {upsertIdentity.isPending ? <AppIcon name="Loader2" size={16} className="animate-spin mr-2" /> : <AppIcon name="Save" size={16} className="mr-2" />}
        Salvar Identidade
      </Button>

      {/* Section 3: Gallery */}
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AppIcon name="Image" size={16} className="text-primary" />
              Galeria de Assets
            </span>
            <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} className="h-7 text-xs">
              <AppIcon name="Upload" size={12} className="mr-1" /> Upload
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileSelect} />

          {/* Filter */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
            <Badge
              variant={filterType === 'all' ? 'default' : 'outline'}
              className="cursor-pointer text-[10px] shrink-0"
              onClick={() => setFilterType('all')}
            >
              Todos
            </Badge>
            {ASSET_TYPES.map(t => (
              <Badge
                key={t.value}
                variant={filterType === t.value ? 'default' : 'outline'}
                className="cursor-pointer text-[10px] shrink-0"
                onClick={() => setFilterType(t.value)}
              >
                {t.label}
              </Badge>
            ))}
          </div>

          {/* Grid */}
          {assetsLoading ? (
            <div className="flex justify-center py-8"><AppIcon name="Loader2" className="animate-spin text-primary" size={20} /></div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center">
              <AppIcon name="ImagePlus" size={24} className="mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-xs text-muted-foreground">Nenhum asset encontrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {filtered.map(asset => (
                <div key={asset.id} className="relative group rounded-lg overflow-hidden border border-border/30">
                  <div className="aspect-square bg-muted/20">
                    <img src={asset.file_url} alt={asset.title} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <button
                    onClick={() => deleteAsset.mutate(asset.id)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive/80 text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <AppIcon name="X" size={10} />
                  </button>
                  <p className="text-[9px] p-1 truncate text-muted-foreground">{asset.title}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[80vh]">
          <SheetHeader><SheetTitle>Novo Asset</SheetTitle></SheetHeader>
          <div className="space-y-4 py-4">
            {previewUrl && (
              <div className="w-full aspect-video bg-muted/30 rounded-lg overflow-hidden">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-xs">Título</Label>
              <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tipo</Label>
              <Select value={newType} onValueChange={v => setNewType(v as BrandAssetType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ASSET_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tags (separadas por vírgula)</Label>
              <Input value={newTags} onChange={e => setNewTags(e.target.value)} placeholder="hamburguer, destaque" />
            </div>
            <Button onClick={handleUpload} disabled={uploading} className="w-full">
              {uploading ? <AppIcon name="Loader2" size={16} className="animate-spin mr-2" /> : <AppIcon name="Upload" size={16} className="mr-2" />}
              Salvar
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
