import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { useCallback } from 'react';

export interface TimeAlertSettingRow {
  id: string;
  user_id: string;
  unit_id: string | null;
  module_key: string;
  enabled: boolean;
  warning_hour: number | null;
  critical_hour: number | null;
}

export interface EffectiveAlertSetting {
  enabled: boolean;
  warningHour: number | null;
  criticalHour: number | null;
}

const DEFAULTS: Record<string, EffectiveAlertSetting> = {
  finance: { enabled: true, warningHour: 16, criticalHour: 18 },
  checklist_abertura: { enabled: true, warningHour: 12, criticalHour: 14 },
  checklist_fechamento: { enabled: true, warningHour: 18.5, criticalHour: 21 },
  cash_closing: { enabled: true, warningHour: null, criticalHour: 22 },
};

export function getDefaultSettings() {
  return DEFAULTS;
}

export function useTimeAlertSettings() {
  const { user } = useAuth();
  const { activeUnitId } = useUnit();
  const queryClient = useQueryClient();

  const queryKey = ['time-alert-settings', user?.id, activeUnitId];

  const { data: rows } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data } = await supabase
        .from('time_alert_settings')
        .select('*')
        .eq('user_id', user!.id)
        .eq('unit_id', activeUnitId!);
      return (data || []) as TimeAlertSettingRow[];
    },
    enabled: !!user && !!activeUnitId,
    staleTime: 5 * 60_000,
  });

  // Build effective settings map
  const settings: Record<string, EffectiveAlertSetting> = {};
  for (const [key, def] of Object.entries(DEFAULTS)) {
    const row = rows?.find(r => r.module_key === key);
    if (row) {
      settings[key] = {
        enabled: row.enabled,
        warningHour: row.warning_hour ?? def.warningHour,
        criticalHour: row.critical_hour ?? def.criticalHour,
      };
    } else {
      settings[key] = { ...def };
    }
  }

  const mutation = useMutation({
    mutationFn: async (params: { moduleKey: string; field: string; value: any }) => {
      const { moduleKey, field, value } = params;
      const updateData: Record<string, any> = {
        user_id: user!.id,
        unit_id: activeUnitId!,
        module_key: moduleKey,
        [field]: value,
      };

      const { error } = await supabase
        .from('time_alert_settings')
        .upsert(updateData as any, { onConflict: 'user_id,unit_id,module_key' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateSetting = useCallback(
    (moduleKey: string, field: string, value: any) => {
      mutation.mutate({ moduleKey, field, value });
    },
    [mutation]
  );

  return { settings, updateSetting };
}
