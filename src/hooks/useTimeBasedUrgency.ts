import { useState, useEffect, useCallback } from 'react';
import { parseISO, isToday } from 'date-fns';

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

function computeModuleUrgency(currentHour: number): ModuleUrgency {
  // Finance: attention base -> warning at 16 -> critical at 18
  let finance: UrgencyLevel = 'attention';
  if (currentHour >= 18) finance = 'critical';
  else if (currentHour >= 16) finance = 'warning';

  // Checklist abertura: attention base -> warning at 12 -> critical at 14
  let checklistAbertura: UrgencyLevel = 'attention';
  if (currentHour >= 14) checklistAbertura = 'critical';
  else if (currentHour >= 12) checklistAbertura = 'warning';

  // Checklist fechamento: attention from 14 -> warning at 18:30 -> critical at 21
  let checklistFechamento: UrgencyLevel = 'attention';
  if (currentHour >= 21) checklistFechamento = 'critical';
  else if (currentHour >= 18.5) checklistFechamento = 'warning';

  // Cash closing: attention base -> critical at 22
  let cashClosing: UrgencyLevel = 'attention';
  if (currentHour >= 22) cashClosing = 'critical';

  return { finance, checklistAbertura, checklistFechamento, cashClosing };
}

export function useTimeBasedUrgency() {
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;
  const [urgencyBucket, setUrgencyBucket] = useState(() => getUrgencyBucket(currentHour));
  const [moduleUrgency, setModuleUrgency] = useState<ModuleUrgency>(() => computeModuleUrgency(currentHour));

  useEffect(() => {
    const update = () => {
      const n = new Date();
      const h = n.getHours() + n.getMinutes() / 60;
      const bucket = getUrgencyBucket(h);
      setUrgencyBucket(bucket);
      setModuleUrgency(computeModuleUrgency(h));
    };

    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, []);

  return { moduleUrgency, urgencyBucket };
}

/**
 * Returns urgency color class for a task's clock icon based on due time proximity.
 * - Green: >2h remaining
 * - Amber/Orange: <2h remaining  
 * - Red pulsing: <30min or overdue
 */
export function getTaskUrgencyColor(dueDate: string | null, dueTime: string | null): {
  colorClass: string;
  pulse: boolean;
} {
  if (!dueDate) return { colorClass: 'text-muted-foreground', pulse: false };

  const now = new Date();
  const date = parseISO(dueDate);

  if (!isToday(date)) {
    // Future date: muted. Past date: red.
    if (date > now) return { colorClass: 'text-muted-foreground', pulse: false };
    return { colorClass: 'text-destructive', pulse: true };
  }

  // Today - calculate time remaining
  if (!dueTime) {
    // No specific time, just today
    const hour = now.getHours();
    if (hour >= 20) return { colorClass: 'text-destructive', pulse: true };
    if (hour >= 16) return { colorClass: 'text-warning', pulse: false };
    return { colorClass: 'text-success', pulse: false };
  }

  // Parse due time (HH:MM)
  const [h, m] = dueTime.split(':').map(Number);
  const dueMs = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m).getTime();
  const diffMin = (dueMs - now.getTime()) / 60_000;

  if (diffMin <= 0) return { colorClass: 'text-destructive', pulse: true };
  if (diffMin <= 30) return { colorClass: 'text-destructive', pulse: true };
  if (diffMin <= 120) return { colorClass: 'text-warning', pulse: false };
  return { colorClass: 'text-success', pulse: false };
}
