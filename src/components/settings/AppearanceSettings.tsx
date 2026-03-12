import { useState, useRef } from 'react';
import { useTheme } from 'next-themes';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { useUnit } from '@/contexts/UnitContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import gardenLogo from '@/assets/logo.png';

const themes = [
  { value: 'light', icon: 'Sun', label: 'Claro', description: 'Fundo branco com texto escuro' },
  { value: 'dark', icon: 'Moon', label: 'Escuro', description: 'Fundo escuro premium' },
] as const;

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const { activeUnit, refetchUnits } = useUnit();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const currentLogo = activeUnit?.store_info?.logo_url;

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUnit) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Selecione uma imagem válida');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const path = `${activeUnit.id}/logo.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('brand-assets')
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('brand-assets')
        .getPublicUrl(path);

      const updated = { ...(activeUnit.store_info || {}), logo_url: publicUrl };
      const { error } = await supabase.from('units').update({ store_info: updated }).eq('id', activeUnit.id);
      if (error) throw error;

      await refetchUnits();
      toast.success('Logo atualizada!');
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao enviar logo');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    if (!activeUnit) return;
    setUploading(true);
    try {
      const updated = { ...(activeUnit.store_info || {}) };
      delete updated.logo_url;
      const { error } = await supabase.from('units').update({ store_info: updated }).eq('id', activeUnit.id);
      if (error) throw error;
      await refetchUnits();
      toast.success('Logo removida');
    } catch {
      toast.error('Erro ao remover logo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Logo da Empresa */}
      <div>
        <h3 className="text-lg font-semibold text-foreground">Logo da Empresa</h3>
        <p className="text-sm text-muted-foreground">Aparece no topo do app e na tela de carregamento</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-border bg-card flex items-center justify-center shrink-0">
          <img
            src={currentLogo || gardenLogo}
            alt="Logo"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <AppIcon name={uploading ? 'Loader2' : 'Upload'} size={16} className={uploading ? 'animate-spin' : ''} />
            {uploading ? 'Enviando...' : 'Enviar logo'}
          </button>

          {currentLogo && (
            <button
              onClick={handleRemoveLogo}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors disabled:opacity-50"
            >
              <AppIcon name="Trash2" size={16} />
              Remover
            </button>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleLogoUpload}
        />
      </div>

      {/* Tema */}
      <div>
        <h3 className="text-lg font-semibold text-foreground">Aparência</h3>
        <p className="text-sm text-muted-foreground">Escolha o tema visual do app</p>
      </div>

      <div className="grid gap-3">
        {themes.map((t) => {
          const isActive = theme === t.value;
          return (
            <button
              key={t.value}
              onClick={() => setTheme(t.value)}
              className={cn(
                "flex items-center gap-4 p-4 rounded-2xl border transition-all text-left",
                isActive
                  ? "border-primary bg-primary/10 shadow-glow-primary"
                  : "border-border bg-card hover:border-border/80"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                isActive ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              )}>
                <AppIcon name={t.icon} size={20} />
              </div>
              <div className="flex-1">
                <p className={cn("font-medium text-sm", isActive ? "text-primary" : "text-foreground")}>
                  {t.label}
                </p>
                <p className="text-xs text-muted-foreground">{t.description}</p>
              </div>
              {isActive && (
                <AppIcon name="Check" size={18} className="text-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
