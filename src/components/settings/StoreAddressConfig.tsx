import { useState, useEffect } from 'react';
import { useUnit } from '@/contexts/UnitContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppIcon } from '@/components/ui/app-icon';
import { toast } from 'sonner';

export function StoreAddressConfig() {
  const { activeUnit } = useUnit();
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (activeUnit) {
      const info = (activeUnit as any).store_info;
      setAddress(info?.address || '');
    }
  }, [activeUnit]);

  const handleSave = async () => {
    if (!activeUnit) return;
    setSaving(true);
    try {
      const currentInfo = (activeUnit as any).store_info || {};
      const { error } = await supabase
        .from('units')
        .update({ store_info: { ...currentInfo, address: address.trim() } })
        .eq('id', activeUnit.id);
      if (error) throw error;
      toast.success('Endereço salvo!');
    } catch {
      toast.error('Erro ao salvar endereço');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card-base p-4 space-y-3">
      <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
        <AppIcon name="MapPin" size={16} className="text-primary" /> Endereço da Loja
      </h3>
      <p className="text-[10px] text-muted-foreground -mt-1">
        Usado como ponto de origem para calcular distância e taxa de entrega
      </p>
      <div>
        <Label className="text-xs">Endereço completo</Label>
        <Input
          value={address}
          onChange={e => setAddress(e.target.value)}
          placeholder="Rua Exemplo, 123 - Bairro - Cidade/UF"
        />
      </div>
      <Button size="sm" className="w-full" onClick={handleSave} disabled={saving || !address.trim()}>
        {saving ? 'Salvando...' : 'Salvar endereço'}
      </Button>
    </div>
  );
}
