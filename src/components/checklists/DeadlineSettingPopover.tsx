import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppIcon } from '@/components/ui/app-icon';
import { DeadlineSetting, formatDeadlineSetting } from '@/lib/checklistTiming';
import { cn } from '@/lib/utils';

interface Props {
  type: string;
  currentSetting: DeadlineSetting | null;
  onSave: (setting: DeadlineSetting) => void;
  onRemove?: (type: string) => void;
  isSaving?: boolean;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];

const DEFAULTS: Record<string, { hour: number; minute: number; nextDay: boolean }> = {
  abertura: { hour: 19, minute: 30, nextDay: false },
  fechamento: { hour: 2, minute: 0, nextDay: true },
  bonus: { hour: 23, minute: 59, nextDay: false },
};

export function DeadlineSettingPopover({ type, currentSetting, onSave, onRemove, isSaving }: Props) {
  const defaults = DEFAULTS[type] || DEFAULTS.abertura;
  const [hour, setHour] = useState(currentSetting?.deadline_hour ?? defaults.hour);
  const [minute, setMinute] = useState(currentSetting?.deadline_minute ?? defaults.minute);
  const [isNextDay, setIsNextDay] = useState(currentSetting?.is_next_day ?? defaults.nextDay);
  const [open, setOpen] = useState(false);

  const handleSave = () => {
    onSave({ checklist_type: type, deadline_hour: hour, deadline_minute: minute, is_next_day: isNextDay });
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "absolute top-2 right-2 z-10 w-7 h-7 rounded-lg flex items-center justify-center",
            "bg-secondary/80 hover:bg-secondary transition-colors",
            "ring-1 ring-border/30"
          )}
        >
          <AppIcon name="Clock" size={14} className="text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-4 space-y-4"
        align="end"
        side="bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h4 className="text-sm font-semibold mb-1">Horário Limite</h4>
          <p className="text-[11px] text-muted-foreground">
            {currentSetting ? formatDeadlineSetting(currentSetting) : 'Usando padrão'}
          </p>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">Hora</label>
            <Select value={String(hour)} onValueChange={(v) => setHour(Number(v))}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HOURS.map(h => (
                  <SelectItem key={h} value={String(h)}>{String(h).padStart(2, '0')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">Minuto</label>
            <Select value={String(minute)} onValueChange={(v) => setMinute(Number(v))}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MINUTES.map(m => (
                  <SelectItem key={m} value={String(m)}>{String(m).padStart(2, '0')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="text-xs font-medium">Dia seguinte</label>
          <Switch checked={isNextDay} onCheckedChange={setIsNextDay} />
        </div>

        <div className="flex gap-2">
          {type === 'bonus' && currentSetting && onRemove && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => { onRemove(type); setOpen(false); }}
            >
              Remover
            </Button>
          )}
          <Button
            size="sm"
            className="flex-1 text-xs"
            onClick={handleSave}
            disabled={isSaving}
          >
            Salvar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
