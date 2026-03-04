import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppIcon } from '@/components/ui/app-icon';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface TimerSettingsPanelProps {
  checklistType: string;
}

export function TimerSettingsPanel({ checklistType }: TimerSettingsPanelProps) {
  const { activeUnitId } = useUnit();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const settingsQueryKey = ['checklist-timer-settings-ui', activeUnitId, checklistType] as const;

  const { data: settings, isLoading } = useQuery({
    queryKey: settingsQueryKey,
    queryFn: async () => {
      if (!activeUnitId) return null;
      const { data } = await supabase
        .from('checklist_timer_settings')
        .select('*')
        .eq('unit_id', activeUnitId)
        .eq('checklist_type', checklistType)
        .maybeSingle();
      return data;
    },
    enabled: !!activeUnitId,
  });

  const handleToggle = async (enabled: boolean) => {
    if (!activeUnitId) return;
    setSaving(true);

    // Optimistic update — reflect immediately in both caches
    const previousUI = queryClient.getQueryData(settingsQueryKey);
    const hookKey = ['checklist-timer-settings', activeUnitId, checklistType];
    const previousHook = queryClient.getQueryData(hookKey);

    const optimistic = {
      ...(settings ?? {
        unit_id: activeUnitId,
        checklist_type: checklistType,
        min_executions_for_stats: 3,
        bonus_points_avg: 2,
        bonus_points_record: 5,
      }),
      is_enabled: enabled,
    };
    queryClient.setQueryData(settingsQueryKey, optimistic);
    queryClient.setQueryData(hookKey, {
      isEnabled: enabled,
      minExecutionsForStats: optimistic.min_executions_for_stats ?? 3,
      bonusPointsAvg: optimistic.bonus_points_avg ?? 2,
      bonusPointsRecord: optimistic.bonus_points_record ?? 5,
    });

    try {
      const { error } = await supabase
        .from('checklist_timer_settings')
        .upsert({
          unit_id: activeUnitId,
          checklist_type: checklistType,
          is_enabled: enabled,
          min_executions_for_stats: settings?.min_executions_for_stats ?? 3,
          bonus_points_avg: settings?.bonus_points_avg ?? 2,
          bonus_points_record: settings?.bonus_points_record ?? 5,
        } as any, { onConflict: 'unit_id,checklist_type' });
      if (error) throw error;

      // Refetch to confirm server state
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: settingsQueryKey }),
        queryClient.invalidateQueries({ queryKey: hookKey }),
      ]);

      toast.success(enabled ? 'Modo timer ativado' : 'Modo timer desativado');
    } catch {
      // Rollback on error
      queryClient.setQueryData(settingsQueryKey, previousUI);
      queryClient.setQueryData(hookKey, previousHook);
      toast.error('Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateField = async (field: string, value: number) => {
    if (!activeUnitId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('checklist_timer_settings')
        .upsert({
          unit_id: activeUnitId,
          checklist_type: checklistType,
          is_enabled: settings?.is_enabled ?? false,
          min_executions_for_stats: field === 'min_executions_for_stats' ? value : (settings?.min_executions_for_stats ?? 3),
          bonus_points_avg: field === 'bonus_points_avg' ? value : (settings?.bonus_points_avg ?? 2),
          bonus_points_record: field === 'bonus_points_record' ? value : (settings?.bonus_points_record ?? 5),
        } as any, { onConflict: 'unit_id,checklist_type' });
      if (error) throw error;

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: settingsQueryKey }),
        queryClient.invalidateQueries({ queryKey: ['checklist-timer-settings', activeUnitId, checklistType] }),
      ]);
    } catch {
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const isEnabled = settings?.is_enabled ?? false;

  if (isLoading) return null;

  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <AppIcon name="Timer" className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">Modo Timer</p>
            <p className="text-[11px] text-muted-foreground">Cronômetro por tarefa com PIN</p>
          </div>
        </div>
        <Switch
          checked={isEnabled}
          onCheckedChange={handleToggle}
          disabled={saving}
        />
      </div>

      {isEnabled && (
        <div className="space-y-3 pt-2 border-t animate-fade-in">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Mín. execuções</Label>
              <Input
                type="number"
                min={1}
                max={20}
                defaultValue={settings?.min_executions_for_stats ?? 3}
                onBlur={(e) => handleUpdateField('min_executions_for_stats', parseInt(e.target.value) || 3)}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Bônus média</Label>
              <Input
                type="number"
                min={0}
                max={50}
                defaultValue={settings?.bonus_points_avg ?? 2}
                onBlur={(e) => handleUpdateField('bonus_points_avg', parseInt(e.target.value) || 2)}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Bônus recorde</Label>
              <Input
                type="number"
                min={0}
                max={100}
                defaultValue={settings?.bonus_points_record ?? 5}
                onBlur={(e) => handleUpdateField('bonus_points_record', parseInt(e.target.value) || 5)}
                className="h-9 text-sm"
              />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground leading-tight">
            💡 O sistema calcula média e recorde automaticamente. Funcionários precisam ter um PIN de 4 dígitos configurado em Funcionários.
          </p>
        </div>
      )}
    </div>
  );
}
