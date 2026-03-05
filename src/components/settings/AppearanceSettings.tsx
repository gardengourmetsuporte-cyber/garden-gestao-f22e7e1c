import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { useUnitLogo } from '@/hooks/useUnitLogo';
import { toast } from 'sonner';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import gardenLogo from '@/assets/logo.png';

const COLOR_PRESETS = [
  { label: 'Verde', hsl: '156 72% 40%', hex: '#1a9b6c' },
  { label: 'Azul', hsl: '220 80% 50%', hex: '#1a66e6' },
  { label: 'Roxo', hsl: '262 70% 55%', hex: '#7c3aed' },
  { label: 'Laranja', hsl: '25 95% 53%', hex: '#f97316' },
  { label: 'Vermelho', hsl: '0 72% 50%', hex: '#db2626' },
  { label: 'Rosa', hsl: '330 80% 55%', hex: '#e6198c' },
  { label: 'Ciano', hsl: '190 85% 45%', hex: '#0ea5c4' },
];

export function AppearanceSettings() {
  const { activeUnit, refetchUnits } = useUnit();
  const currentLogo = useUnitLogo();
  const storeInfo = (activeUnit as any)?.store_info as Record<string, any> | undefined;

  const [selectedColor, setSelectedColor] = useState(storeInfo?.theme_color || '156 72% 40%');
  const [logoUrl, setLogoUrl] = useState<string>(storeInfo?.logo_url || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sync when unit changes
  useEffect(() => {
    setSelectedColor(storeInfo?.theme_color || '156 72% 40%');
    setLogoUrl(storeInfo?.logo_url || '');
  }, [activeUnit?.id]); // eslint-disable-line

  // Live preview of color
  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty('--primary', selectedColor);
    root.setProperty('--neon-cyan', selectedColor);
    root.setProperty('--ring', selectedColor);
    root.setProperty('--glow-primary', `0 0 24px hsl(${selectedColor} / 0.25), 0 0 48px hsl(${selectedColor} / 0.12)`);
    root.setProperty('--glow-cyan', `0 0 24px hsl(${selectedColor} / 0.25), 0 0 48px hsl(${selectedColor} / 0.12)`);
  }, [selectedColor]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUnit) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Envie uma imagem (PNG, JPG, etc.)');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${activeUnit.id}/logo.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('brand-assets')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('brand-assets')
        .getPublicUrl(path);

      setLogoUrl(urlData.publicUrl);
      toast.success('Logo enviado!');
    } catch (err: any) {
      toast.error('Erro ao enviar logo: ' + (err.message || ''));
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl('');
  };

  const handleSave = async () => {
    if (!activeUnit) return;
    setSaving(true);
    try {
      const newStoreInfo = {
        ...(storeInfo || {}),
        theme_color: selectedColor,
        logo_url: logoUrl || null,
      };

      const { error } = await supabase
        .from('units')
        .update({ store_info: newStoreInfo } as any)
        .eq('id', activeUnit.id);

      if (error) throw error;

      await refetchUnits();
      toast.success('Aparência salva com sucesso!');
    } catch (err: any) {
      toast.error('Erro ao salvar: ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-lg">
      {/* Color picker */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Cor primária</Label>
        <p className="text-sm text-muted-foreground">Escolha a cor principal do sistema. Ela será aplicada em botões, links e destaques.</p>

        <div className="flex flex-wrap gap-3 mt-2">
          {COLOR_PRESETS.map((preset) => {
            const isActive = selectedColor === preset.hsl;
            return (
              <button
                key={preset.hsl}
                onClick={() => setSelectedColor(preset.hsl)}
                className={cn(
                  "w-12 h-12 rounded-xl border-2 transition-all duration-200 relative group",
                  isActive ? "border-foreground scale-110 shadow-lg" : "border-transparent hover:scale-105"
                )}
                style={{ backgroundColor: `hsl(${preset.hsl})` }}
                title={preset.label}
              >
                {isActive && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <AppIcon name="Check" size={20} className="text-white drop-shadow-md" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Custom HSL input */}
        <div className="flex items-center gap-2 mt-3">
          <Label className="text-xs text-muted-foreground shrink-0">HSL customizado:</Label>
          <Input
            value={selectedColor}
            onChange={(e) => setSelectedColor(e.target.value)}
            placeholder="220 80% 50%"
            className="h-9 text-xs max-w-[200px]"
          />
          <div
            className="w-9 h-9 rounded-lg border border-border shrink-0"
            style={{ backgroundColor: `hsl(${selectedColor})` }}
          />
        </div>
      </div>

      {/* Logo upload */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Logo da empresa</Label>
        <p className="text-sm text-muted-foreground">Substitui o logo padrão no cabeçalho e na tela de carregamento.</p>

        <div className="flex items-center gap-4 mt-2">
          <div className="w-16 h-16 rounded-xl border border-border bg-secondary/50 flex items-center justify-center overflow-hidden">
            <img
              src={logoUrl || gardenLogo}
              alt="Logo preview"
              className="w-12 h-12 object-contain"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="cursor-pointer">
              <Button variant="outline" size="sm" asChild disabled={uploading}>
                <span>
                  <AppIcon name={uploading ? "Loader2" : "Upload"} size={16} className={uploading ? "animate-spin" : ""} />
                  {uploading ? 'Enviando...' : 'Enviar logo'}
                </span>
              </Button>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
                disabled={uploading}
              />
            </label>
            {logoUrl && (
              <Button variant="ghost" size="sm" onClick={handleRemoveLogo} className="text-destructive text-xs">
                <AppIcon name="Trash2" size={14} />
                Remover logo
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Save */}
      <Button onClick={handleSave} disabled={saving} className="w-full h-12">
        {saving ? (
          <>
            <AppIcon name="Loader2" size={18} className="animate-spin" />
            Salvando...
          </>
        ) : (
          <>
            <AppIcon name="Save" size={18} />
            Salvar aparência
          </>
        )}
      </Button>
    </div>
  );
}

export default AppearanceSettings;
