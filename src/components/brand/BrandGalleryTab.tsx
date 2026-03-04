import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

export function BrandGalleryTab() {
  const { assets, assetsLoading, createAsset, deleteAsset, uploadAssetFile } = useBrandCore();
  const [filterType, setFilterType] = useState<string>('all');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<BrandAssetType>('product_photo');
  const [newTags, setNewTags] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const filtered = filterType === 'all' ? assets : assets.filter(a => a.type === filterType);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo máximo: 10MB');
      return;
    }
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

  if (assetsLoading) {
    return <div className="flex justify-center py-12"><AppIcon name="Loader2" className="animate-spin text-primary" size={24} /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Filter + Upload */}
      <div className="flex gap-2 items-center">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[140px] h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {ASSET_TYPES.map(t => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={() => fileRef.current?.click()}>
          <AppIcon name="Upload" size={14} className="mr-1" /> Upload
        </Button>
        <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileSelect} />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <Card className="border-dashed border-border/40">
          <CardContent className="py-12 text-center">
            <AppIcon name="ImagePlus" size={32} className="mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum asset encontrado</p>
            <p className="text-xs text-muted-foreground/70">Clique em Upload para adicionar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filtered.map(asset => (
            <Card key={asset.id} className="overflow-hidden border-border/40 group relative">
              <div className="aspect-square bg-muted/30 relative">
                <img
                  src={asset.file_url}
                  alt={asset.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <button
                  onClick={() => deleteAsset.mutate(asset.id)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive/80 text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <AppIcon name="X" size={12} />
                </button>
              </div>
              <CardContent className="p-2">
                <p className="text-xs font-medium truncate">{asset.title || 'Sem título'}</p>
                <div className="flex gap-1 mt-1 flex-wrap">
                  <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                    {ASSET_TYPES.find(t => t.value === asset.type)?.label || asset.type}
                  </Badge>
                  {asset.tags.slice(0, 2).map(tag => (
                    <Badge key={tag} variant="secondary" className="text-[9px] px-1 py-0 h-4">{tag}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[80vh]">
          <SheetHeader>
            <SheetTitle>Novo Asset</SheetTitle>
          </SheetHeader>
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
              <Input value={newTags} onChange={e => setNewTags(e.target.value)} placeholder="Ex: hamburguer, destaque, delivery" />
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
