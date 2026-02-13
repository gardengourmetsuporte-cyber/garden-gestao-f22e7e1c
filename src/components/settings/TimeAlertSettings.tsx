import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTimeAlertSettings, getDefaultSettings } from '@/hooks/useTimeAlertSettings';
import { DollarSign, ClipboardCheck, Vault, AlertTriangle, CircleAlert } from 'lucide-react';
import { useCallback } from 'react';

interface ModuleConfig {
  key: string;
  label: string;
  icon: React.ElementType;
  hasWarning: boolean;
  warningLabel: string;
  criticalLabel: string;
}

const MODULES: ModuleConfig[] = [
  { key: 'finance', label: 'Financeiro', icon: DollarSign, hasWarning: true, warningLabel: 'Aviso (laranja)', criticalLabel: 'Crítico (vermelho)' },
  { key: 'checklist_abertura', label: 'Checklist Abertura', icon: ClipboardCheck, hasWarning: true, warningLabel: 'Aviso', criticalLabel: 'Crítico' },
  { key: 'checklist_fechamento', label: 'Checklist Fechamento', icon: ClipboardCheck, hasWarning: true, warningLabel: 'Aviso', criticalLabel: 'Crítico' },
  { key: 'cash_closing', label: 'Fechamento de Caixa', icon: Vault, hasWarning: false, warningLabel: '', criticalLabel: 'Crítico' },
];

function hourToTime(hour: number | null): string {
  if (hour == null) return '';
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function timeToHour(time: string): number | null {
  if (!time) return null;
  const [h, m] = time.split(':').map(Number);
  if (isNaN(h)) return null;
  return h + (m || 0) / 60;
}

export function TimeAlertSettings() {
  const { settings, updateSetting } = useTimeAlertSettings();
  const defaults = getDefaultSettings();

  const handleTimeChange = useCallback(
    (moduleKey: string, field: 'warning_hour' | 'critical_hour', value: string) => {
      const numVal = timeToHour(value);
      if (numVal !== null) {
        updateSetting(moduleKey, field, numVal);
      }
    },
    [updateSetting]
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Configure os horários de sinalização e notificação para cada módulo. Quando desativado, o módulo não exibirá alertas temporais.
      </p>

      {MODULES.map((mod) => {
        const setting = settings[mod.key];
        const def = defaults[mod.key];
        const Icon = mod.icon;

        return (
          <Card key={mod.key} className="border-border/50">
            <CardHeader className="pb-3 pt-4 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium">{mod.label}</CardTitle>
                </div>
                <Switch
                  checked={setting.enabled}
                  onCheckedChange={(checked) => updateSetting(mod.key, 'enabled', checked)}
                />
              </div>
            </CardHeader>

            {setting.enabled && (
              <CardContent className="px-4 pb-4 pt-0 space-y-3">
                {mod.hasWarning && (
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
                    <Label className="text-xs text-muted-foreground w-24 shrink-0">{mod.warningLabel}</Label>
                    <Input
                      type="time"
                      className="w-28 h-8 text-xs"
                      defaultValue={hourToTime(setting.warningHour)}
                      placeholder={hourToTime(def.warningHour)}
                      onBlur={(e) => handleTimeChange(mod.key, 'warning_hour', e.target.value)}
                    />
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <CircleAlert className="w-4 h-4 text-destructive shrink-0" />
                  <Label className="text-xs text-muted-foreground w-24 shrink-0">{mod.criticalLabel}</Label>
                  <Input
                    type="time"
                    className="w-28 h-8 text-xs"
                    defaultValue={hourToTime(setting.criticalHour)}
                    placeholder={hourToTime(def.criticalHour)}
                    onBlur={(e) => handleTimeChange(mod.key, 'critical_hour', e.target.value)}
                  />
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
