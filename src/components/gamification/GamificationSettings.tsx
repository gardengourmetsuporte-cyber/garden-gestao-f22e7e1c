import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import type { GamificationSettings as SettingsType } from '@/hooks/useGamification';

interface GamificationSettingsProps {
  settings: SettingsType | null | undefined;
  onToggle: (enabled: boolean) => void;
  onUpdate: (data: Partial<SettingsType>) => void;
}

export function GamificationSettingsPanel({ settings, onToggle, onUpdate }: GamificationSettingsProps) {
  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Jogo Ativo</h3>
          <p className="text-sm text-muted-foreground">Ativar ou desativar a roleta para os clientes</p>
        </div>
        <Switch
          checked={settings?.is_enabled ?? false}
          onCheckedChange={onToggle}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Teto custo diário (R$)</Label>
          <Input
            type="number"
            value={settings?.max_daily_cost ?? 100}
            onChange={e => onUpdate({ max_daily_cost: Number(e.target.value) })}
            min="0"
          />
        </div>
        <div>
          <Label className="text-xs">Cooldown (min)</Label>
          <Input
            type="number"
            value={settings?.cooldown_minutes ?? 0}
            onChange={e => onUpdate({ cooldown_minutes: Number(e.target.value) })}
            min="0"
          />
        </div>
      </div>
    </Card>
  );
}
