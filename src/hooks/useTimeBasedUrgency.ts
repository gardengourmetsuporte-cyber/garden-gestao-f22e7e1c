import { useState, useEffect } from 'react';
import { parseISO, isToday } from 'date-fns';
import { useTimeAlertSettings, type EffectiveAlertSetting } from '@/hooks/useTimeAlertSettings';

export type UrgencyLevel = 'ok' | 'attention' | 'warning' | 'critical';

interface ModuleUrgency {
  finance: UrgencyLevel;
  checklistAbertura: UrgencyLevel;
  checklistFechamento: UrgencyLevel;
  cashClosing: UrgencyLevel;
}

function getUrgencyBucket(hour: number): string {
  if (hour >= 22) return '22';
  if (hour >= 21) return '21';
  if (hour >= 18.5) return '18.5';
  if (hour >= 18) return '18';
  if (hour >= 16) return '16';
  if (hour >= 14) return '14';
  if (hour >= 12) return '12';
  return '0';
}

function computeUrgency(
  currentHour: number,
  setting: EffectiveAlertSetting | undefined
): UrgencyLevel {
  if (!setting || !setting.enabled) return 'ok';
  if (setting.criticalHour != null && currentHour >= setting.criticalHour) return 'critical';
  if (setting.warningHour != null && currentHour >= setting.warningHour) return 'warning';
  return 'attention';
}

function computeModuleUrgency(
  currentHour: number,
  settings: Record<string, EffectiveAlertSetting>
): ModuleUrgency {
  return {
    finance: computeUrgency(currentHour, settings.finance),
    checklistAbertura: computeUrgency(currentHour, settings.checklist_abertura),
    checklistFechamento: computeUrgency(currentHour, settings.checklist_fechamento),
    cashClosing: computeUrgency(currentHour, settings.cash_closing),
  };
}

export function useTimeBasedUrgency() {
  const { settings } = useTimeAlertSettings();
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;
  const [urgencyBucket, setUrgencyBucket] = useState(() => getUrgencyBucket(currentHour));
  const [moduleUrgency, setModuleUrgency] = useState<ModuleUrgency>(() =>
    computeModuleUrgency(currentHour, settings)
  );

  useEffect(() => {
    const update = () => {
      const n = new Date();
      const h = n.getHours() + n.getMinutes() / 60;
      setUrgencyBucket(getUrgencyBucket(h));
      setModuleUrgency(computeModuleUrgency(h, settings));
    };

    // Recalculate immediately when settings change
    update();

    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, [settings]);

  return { moduleUrgency, urgencyBucket };
}

/**
 * Returns urgency color class for a task's clock icon based on due time proximity.
 */
export function getTaskUrgencyColor(dueDate: string | null, dueTime: string | null): {
  colorClass: string;
  pulse: boolean;
} {
  if (!dueDate) return { colorClass: 'text-muted-foreground', pulse: false };

  const now = new Date();
  const date = parseISO(dueDate);

  if (!isToday(date)) {
    if (date > now) return { colorClass: 'text-muted-foreground', pulse: false };
    return { colorClass: 'text-destructive', pulse: true };
  }

  if (!dueTime) {
    const hour = now.getHours();
    if (hour >= 20) return { colorClass: 'text-destructive', pulse: true };
    if (hour >= 16) return { colorClass: 'text-warning', pulse: false };
    return { colorClass: 'text-success', pulse: false };
  }

  const [h, m] = dueTime.split(':').map(Number);
  const dueMs = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m).getTime();
  const diffMin = (dueMs - now.getTime()) / 60_000;

  if (diffMin <= 0) return { colorClass: 'text-destructive', pulse: true };
  if (diffMin <= 30) return { colorClass: 'text-destructive', pulse: true };
  if (diffMin <= 120) return { colorClass: 'text-warning', pulse: false };
  return { colorClass: 'text-success', pulse: false };
}
