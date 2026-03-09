import { useState } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface Props {
  unitId?: string;
  storeInfo: any;
}

export function AutoConfirmWidget({ unitId, storeInfo }: Props) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState<string | null>(null);

  const autoConfirm = storeInfo?.auto_confirm || {};
  const channels = [
    { key: 'mesa', label: 'Mesa (Tablet)', icon: 'TableRestaurant', desc: 'Pedidos feitos pelo tablet da mesa' },
    { key: 'delivery', label: 'Delivery', icon: 'Truck', desc: 'Pedidos do cardápio digital' },
    { key: 'rodizio', label: 'Rodízio', icon: 'UtensilsCrossed', desc: 'Pedidos do modo rodízio' },
  ];

  const toggle = async (key: string, value: boolean) => {
    if (!unitId) return;
    setSaving(key);
    try {
      const updated = { ...storeInfo, auto_confirm: { ...autoConfirm, [key]: value } };
      const { error } = await supabase
        .from('units')
        .update({ store_info: updated })
        .eq('id', unitId);
      if (error) throw error;

      // Refresh cached menu data immediately (tablet + delivery)
      queryClient.invalidateQueries({ queryKey: ['store-info', unitId] });
      queryClient.invalidateQueries({ queryKey: ['digital-menu', unitId] });

      toast.success(value ? 'Confirmação automática ativada' : 'Confirmação automática desativada');
    } catch {
      toast.error('Erro ao salvar configuração');
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="rounded-2xl bg-card border border-border/30 p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
          <AppIcon name="Zap" size={16} className="text-primary" />
        </div>
        <div>
          <p className="text-xs font-bold text-foreground">Confirmação Automática</p>
          <p className="text-[10px] text-muted-foreground">Pedidos entram direto como confirmados</p>
        </div>
      </div>
      {channels.map(ch => (
        <div key={ch.key} className="flex items-center justify-between py-2 border-t border-border/20 first:border-t-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <AppIcon name={ch.icon} size={16} className="text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground">{ch.label}</p>
              <p className="text-[10px] text-muted-foreground truncate">{ch.desc}</p>
            </div>
          </div>
          <Switch
            checked={!!autoConfirm[ch.key]}
            onCheckedChange={(v) => toggle(ch.key, v)}
            disabled={saving === ch.key}
          />
        </div>
      ))}
    </div>
  );
}
