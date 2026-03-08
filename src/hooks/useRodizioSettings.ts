import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { toast } from 'sonner';

export interface RodizioSettings {
  id?: string;
  unit_id: string;
  is_active: boolean;
  price: number;
  time_limit_minutes: number;
  max_item_quantity: number;
  description: string;
  allowed_category_ids: string[];
  allowed_group_ids: string[];
  rules: Record<string, any>;
}

const defaults = (unitId: string): RodizioSettings => ({
  unit_id: unitId,
  is_active: false,
  price: 0,
  time_limit_minutes: 120,
  max_item_quantity: 2,
  description: '',
  allowed_category_ids: [],
  allowed_group_ids: [],
  rules: {},
});

export function useRodizioSettings() {
  const { activeUnit } = useUnit();
  const unitId = activeUnit?.id;

  const [settings, setSettings] = useState<RodizioSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!unitId) return;
    setLoading(true);
    const { data } = await supabase
      .from('rodizio_settings')
      .select('*')
      .eq('unit_id', unitId)
      .maybeSingle();

    setSettings(data ? (data as any) : defaults(unitId));
    setLoading(false);
  }, [unitId]);

  useEffect(() => { fetch(); }, [fetch]);

  const save = useCallback(async (updates: Partial<RodizioSettings>) => {
    if (!unitId) return;
    const merged = { ...settings, ...updates, unit_id: unitId };

    if (merged.id) {
      const { error } = await supabase
        .from('rodizio_settings')
        .update({
          is_active: merged.is_active,
          price: merged.price,
          time_limit_minutes: merged.time_limit_minutes,
          max_item_quantity: merged.max_item_quantity,
          description: merged.description,
          allowed_category_ids: merged.allowed_category_ids,
          allowed_group_ids: merged.allowed_group_ids,
          rules: merged.rules,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', merged.id);

      if (error) { toast.error('Erro ao salvar'); console.error(error); return; }
    } else {
      const { data, error } = await supabase
        .from('rodizio_settings')
        .insert({
          unit_id: unitId,
          is_active: merged.is_active,
          price: merged.price,
          time_limit_minutes: merged.time_limit_minutes,
          max_item_quantity: merged.max_item_quantity,
          description: merged.description,
          allowed_category_ids: merged.allowed_category_ids,
          allowed_group_ids: merged.allowed_group_ids,
          rules: merged.rules,
        } as any)
        .select('id')
        .single();

      if (error) { toast.error('Erro ao salvar'); console.error(error); return; }
      merged.id = (data as any)?.id;
    }

    setSettings(merged as RodizioSettings);
    toast.success('Configurações do rodízio salvas!');
  }, [unitId, settings]);

  return { settings, loading, save };
}
