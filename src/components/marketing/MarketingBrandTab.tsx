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
      const rawColors = identity.colors;
      const parsedColors = typeof rawColors === 'string' ? JSON.parse(rawColors) : rawColors;
      setColors(parsedColors || { primary: '#22c55e', secondary: '#0a1a10', accent: '#f59e0b', background: '#ffffff' });

      const rawTypo = identity.typography;
      const parsedTypo = typeof rawTypo === 'string' ? JSON.parse(rawTypo) : rawTypo;
      // Handle both 'heading' (singular) and 'headings' (plural) keys
      const typo = parsedTypo || { headings: 'Inter', body: 'Inter' };
      setTypography({ headings: typo.headings || typo.heading || 'Inter', body: typo.body || 'Inter' });

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
    <div className="space-y-4">
      {/* Section 1: Links */}
      <div className="card-surface rounded-2xl px-4 py-4 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <AppIcon name="Link" size={16} className="text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">Links da Marca</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <AppIcon name="Camera" size={11} /> Instagram
            </Label>
            <Input
              value={instagramUrl}
              onChange={e => setInstagramUrl(e.target.value)}
              placeholder="https://instagram.com/seurestaurante"
              className="text-xs h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <AppIcon name="Globe" size={11} /> Website
            </Label>
            <Input
              value={websiteUrl}
              onChange={e => setWebsiteUrl(e.target.value)}
              placeholder="https://seurestaurante.com.br"
              className="text-xs h-9"
            />
          </div>
        </div>
      </div>

      {/* Section 2: Identity */}
      <div className="card-surface rounded-2xl px-4 py-4 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <AppIcon name="Palette" size={16} className="text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">Identidade Visual</span>
        </div>

        {/* Colors - compact grid */}
        <div>
          <p className="text-[11px] font-medium text-muted-foreground mb-2">Paleta de Cores</p>
          <div className="grid grid-cols-4 gap-3">
            {Object.entries(colors).map(([key, value]) => {
              const label = key === 'background' ? 'Fundo' : key === 'primary' ? 'Primária' : key === 'secondary' ? 'Secundária' : 'Destaque';
              return (
                <div key={key} className="flex flex-col items-center gap-1.5">
                  <label className="relative cursor-pointer">
                    <input
                      type="color"
                      value={value}
                      onChange={e => setColors(prev => ({ ...prev, [key]: e.target.value }))}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div
                      className="w-10 h-10 rounded-xl ring-2 ring-border/20 hover:ring-primary/40 transition-all"
                      style={{ backgroundColor: value }}
                    />
                  </label>
                  <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
                  <span className="text-[9px] text-muted-foreground/60 font-mono">{value}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Typography */}
        <div>
          <p className="text-[11px] font-medium text-muted-foreground mb-2">Tipografia</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-secondary/40 rounded-xl p-3 space-y-1">
              <span className="text-[10px] text-muted-foreground">Títulos</span>
              <Input value={typography.headings} onChange={e => setTypography(prev => ({ ...prev, headings: e.target.value }))} className="text-xs h-8 bg-transparent border-0 px-0 focus-visible:ring-0" />
            </div>
            <div className="bg-secondary/40 rounded-xl p-3 space-y-1">
              <span className="text-[10px] text-muted-foreground">Corpo</span>
              <Input value={typography.body} onChange={e => setTypography(prev => ({ ...prev, body: e.target.value }))} className="text-xs h-8 bg-transparent border-0 px-0 focus-visible:ring-0" />
            </div>
          </div>
        </div>

        {/* Tagline & Tone */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground">Tagline</Label>
            <Input value={tagline} onChange={e => setTagline(e.target.value)} placeholder="O sabor que conecta" className="text-xs h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground">Tom de voz</Label>
            <Textarea value={toneOfVoice} onChange={e => setToneOfVoice(e.target.value)} placeholder="Informal, acolhedor..." rows={2} className="text-xs resize-none" />
          </div>
        </div>

        {/* Phrases */}
        <div className="space-y-2">
          <Label className="text-[11px] text-muted-foreground">Frases institucionais</Label>
          <div className="flex gap-2">
            <Input value={newPhrase} onChange={e => setNewPhrase(e.target.value)} placeholder="Adicionar frase..." className="text-xs h-9" onKeyDown={e => e.key === 'Enter' && addPhrase()} />
            <button onClick={addPhrase} className="h-9 w-9 shrink-0 rounded-xl bg-primary/10 hover:bg-primary/15 flex items-center justify-center transition-colors">
              <AppIcon name="Plus" size={14} className="text-primary" />
            </button>
          </div>
          {phrases.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {phrases.map((phrase, i) => (
                <span
                  key={i}
                  onClick={() => setPhrases(prev => prev.filter((_, idx) => idx !== i))}
                  className="inline-flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-full bg-secondary/60 text-foreground/80 cursor-pointer hover:bg-destructive/15 hover:text-destructive transition-colors"
                >
                  {phrase}
                  <AppIcon name="X" size={8} />
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Save button inside card */}
        <Button onClick={handleSaveIdentity} disabled={upsertIdentity.isPending} className="w-full">
          {upsertIdentity.isPending ? <AppIcon name="Loader2" size={16} className="animate-spin mr-2" /> : <AppIcon name="Save" size={16} className="mr-2" />}
          Salvar Identidade
        </Button>
      </div>

      {/* Section 3: Gallery */}
      <div className="card-surface rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <AppIcon name="Image" size={16} className="text-primary" />
            </div>
            <span className="text-sm font-semibold text-foreground">Galeria de Assets</span>
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 text-xs font-medium text-primary px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/15 transition-colors"
          >
            <AppIcon name="Upload" size={12} />
            Upload
          </button>
        </div>

        <div className="px-4 pb-4 space-y-3">
          <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileSelect} />

          {/* Filter chips */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
            <button
              onClick={() => setFilterType('all')}
              className={`shrink-0 text-[11px] font-medium px-3 py-1 rounded-full transition-colors ${
                filterType === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/60 text-muted-foreground hover:text-foreground'
              }`}
            >
              Todos
            </button>
            {ASSET_TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => setFilterType(t.value)}
                className={`shrink-0 text-[11px] font-medium px-3 py-1 rounded-full transition-colors ${
                  filterType === t.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary/60 text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Grid */}
          {assetsLoading ? (
            <div className="flex justify-center py-10"><AppIcon name="Loader2" className="animate-spin text-primary" size={20} /></div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-secondary/60 flex items-center justify-center mx-auto mb-3">
                <AppIcon name="ImagePlus" size={20} className="text-muted-foreground/50" />
              </div>
              <p className="text-xs text-muted-foreground">Nenhum asset encontrado</p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">Faça upload do primeiro arquivo</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {filtered.map(asset => (
                <div key={asset.id} className="relative group rounded-xl overflow-hidden bg-secondary/40">
                  <div className="aspect-square">
                    <img src={asset.file_url} alt={asset.title} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <button
                    onClick={() => deleteAsset.mutate(asset.id)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <AppIcon name="X" size={10} className="text-destructive" />
                  </button>
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-background/80 to-transparent px-2 py-1.5">
                    <p className="text-[10px] font-medium truncate text-foreground/90">{asset.title}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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
