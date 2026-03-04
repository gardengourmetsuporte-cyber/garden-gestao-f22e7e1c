import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AppIcon } from '@/components/ui/app-icon';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useBrandCore } from '@/hooks/useBrandCore';
import type { BrandReferenceType } from '@/types/brand';

const REF_TYPES: { value: BrandReferenceType; label: string; icon: string }[] = [
  { value: 'strategy', label: 'Estratégia', icon: 'Target' },
  { value: 'campaign_history', label: 'Histórico de Campanha', icon: 'History' },
  { value: 'visual_reference', label: 'Referência Visual', icon: 'Image' },
];

export function BrandReferencesTab() {
  const { references, refsLoading, createReference, deleteReference } = useBrandCore();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<BrandReferenceType>('strategy');

  const handleSave = () => {
    createReference.mutate({ type, title, content }, {
      onSuccess: () => {
        setSheetOpen(false);
        setTitle('');
        setContent('');
      },
    });
  };

  if (refsLoading) {
    return <div className="flex justify-center py-12"><AppIcon name="Loader2" className="animate-spin text-primary" size={24} /></div>;
  }

  return (
    <div className="space-y-4">
      <Button size="sm" onClick={() => setSheetOpen(true)}>
        <AppIcon name="Plus" size={14} className="mr-1" /> Nova Referência
      </Button>

      {references.length === 0 ? (
        <Card className="border-dashed border-border/40">
          <CardContent className="py-12 text-center">
            <AppIcon name="BookOpen" size={32} className="mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">Nenhuma referência ainda</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {references.map(ref => (
            <Card key={ref.id} className="border-border/40">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge variant="outline" className="text-[9px] mb-1">
                      {REF_TYPES.find(t => t.value === ref.type)?.label || ref.type}
                    </Badge>
                    <CardTitle className="text-sm">{ref.title || 'Sem título'}</CardTitle>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteReference.mutate(ref.id)}>
                    <AppIcon name="Trash2" size={14} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-4">{ref.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[80vh]">
          <SheetHeader>
            <SheetTitle>Nova Referência</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <Label className="text-xs">Tipo</Label>
              <Select value={type} onValueChange={v => setType(v as BrandReferenceType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REF_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Título</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Campanha de Natal 2025" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Conteúdo</Label>
              <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Descreva a estratégia, resultados, aprendizados..." rows={5} />
            </div>
            <Button onClick={handleSave} disabled={createReference.isPending} className="w-full">
              {createReference.isPending ? <AppIcon name="Loader2" size={16} className="animate-spin mr-2" /> : <AppIcon name="Save" size={16} className="mr-2" />}
              Salvar
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
