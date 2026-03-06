import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AppIcon } from '@/components/ui/app-icon';
import { Badge } from '@/components/ui/badge';
import { useBrandCore } from '@/hooks/useBrandCore';

export function BrandIdentityTab() {
  const { identity, identityLoading, upsertIdentity } = useBrandCore();

  const [colors, setColors] = useState({ primary: '#c8ff00', secondary: '#1a1024', accent: '#f59e0b', background: '#ffffff' });
  const [typography, setTypography] = useState({ headings: 'Inter', body: 'Inter' });
  const [toneOfVoice, setToneOfVoice] = useState('');
  const [tagline, setTagline] = useState('');
  const [phrases, setPhrases] = useState<string[]>([]);
  const [newPhrase, setNewPhrase] = useState('');

  useEffect(() => {
    if (identity) {
      setColors(identity.colors || { primary: '#c8ff00', secondary: '#1a1024', accent: '#f59e0b', background: '#ffffff' });
      setTypography(identity.typography || { headings: 'Inter', body: 'Inter' });
      setToneOfVoice(identity.tone_of_voice || '');
      setTagline(identity.tagline || '');
      setPhrases(identity.institutional_phrases || []);
    }
  }, [identity]);

  const handleSave = () => {
    upsertIdentity.mutate({
      colors,
      typography,
      tone_of_voice: toneOfVoice,
      tagline,
      institutional_phrases: phrases,
    });
  };

  const addPhrase = () => {
    if (newPhrase.trim()) {
      setPhrases(prev => [...prev, newPhrase.trim()]);
      setNewPhrase('');
    }
  };

  const removePhrase = (index: number) => {
    setPhrases(prev => prev.filter((_, i) => i !== index));
  };

  if (identityLoading) {
    return <div className="flex justify-center py-12"><AppIcon name="Loader2" className="animate-spin text-primary" size={24} /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Colors */}
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <AppIcon name="Palette" size={16} className="text-primary" />
            Cores da Marca
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(colors).map(([key, value]) => (
              <div key={key} className="space-y-1">
                <Label className="text-xs capitalize">{key === 'background' ? 'Fundo' : key === 'primary' ? 'Primária' : key === 'secondary' ? 'Secundária' : 'Destaque'}</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={value}
                    onChange={e => setColors(prev => ({ ...prev, [key]: e.target.value }))}
                    className="w-10 h-10 rounded-lg border border-border/40 cursor-pointer"
                  />
                  <Input
                    value={value}
                    onChange={e => setColors(prev => ({ ...prev, [key]: e.target.value }))}
                    className="text-xs h-10"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Typography */}
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <AppIcon name="Type" size={16} className="text-primary" />
            Tipografia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Títulos</Label>
              <Input value={typography.headings} onChange={e => setTypography(prev => ({ ...prev, headings: e.target.value }))} placeholder="Ex: Plus Jakarta Sans" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Corpo</Label>
              <Input value={typography.body} onChange={e => setTypography(prev => ({ ...prev, body: e.target.value }))} placeholder="Ex: Inter" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tone of Voice */}
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <AppIcon name="MessageCircle" size={16} className="text-primary" />
            Tom de Voz
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Tagline / Slogan</Label>
            <Input value={tagline} onChange={e => setTagline(e.target.value)} placeholder="Ex: O sabor que conecta" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Descrição do tom de voz</Label>
            <Textarea value={toneOfVoice} onChange={e => setToneOfVoice(e.target.value)} placeholder="Ex: Informal, acolhedor, com toques de humor. Fala diretamente com o cliente usando 'você'..." rows={3} />
          </div>
        </CardContent>
      </Card>

      {/* Institutional Phrases */}
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <AppIcon name="Quote" size={16} className="text-primary" />
            Frases Institucionais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input value={newPhrase} onChange={e => setNewPhrase(e.target.value)} placeholder="Adicionar frase..." onKeyDown={e => e.key === 'Enter' && addPhrase()} />
            <Button size="icon" variant="outline" onClick={addPhrase}><AppIcon name="Plus" size={16} /></Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {phrases.map((phrase, i) => (
              <Badge key={i} variant="secondary" className="gap-1 cursor-pointer" onClick={() => removePhrase(i)}>
                {phrase}
                <AppIcon name="X" size={12} />
              </Badge>
            ))}
            {phrases.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma frase adicionada</p>}
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={upsertIdentity.isPending} className="w-full">
        {upsertIdentity.isPending ? <AppIcon name="Loader2" size={16} className="animate-spin mr-2" /> : <AppIcon name="Save" size={16} className="mr-2" />}
        Salvar Identidade
      </Button>
    </div>
  );
}
