/**
 * Centralized checklist timing logic.
 * Supports custom deadline settings per unit.
 * All calculations use fixed UTC-3 (BRT) to avoid browser timezone issues.
 */

import { ChecklistType } from '@/types/database';

/** Fixed offset: UTC-3 (São Paulo / BRT) */
const BRT_OFFSET_MS = -3 * 60 * 60 * 1000;

/** Get current time as if we were in BRT, regardless of browser timezone */
function nowBRT(): Date {
  const now = new Date();
  // Convert to UTC ms, then apply BRT offset to get a Date whose getHours/getMinutes/etc reflect BRT
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000;
  return new Date(utcMs + BRT_OFFSET_MS);
}

export interface DeadlineSetting {
  checklist_type: string;
  deadline_hour: number;
  deadline_minute: number;
  is_next_day: boolean;
  is_active?: boolean;
}

interface DeadlineInfo {
  deadline: Date;
  passed: boolean;
  remainingMs: number;
  label: string;
}

/** Default deadlines used when no custom setting is configured */
const DEFAULT_DEADLINES: Record<string, DeadlineSetting> = {
  abertura: { checklist_type: 'abertura', deadline_hour: 19, deadline_minute: 30, is_next_day: false, is_active: true },
  fechamento: { checklist_type: 'fechamento', deadline_hour: 2, deadline_minute: 0, is_next_day: true, is_active: true },
};

function getSettingForType(type: ChecklistType, settings?: DeadlineSetting[] | null): DeadlineSetting | null {
  const custom = settings?.find(s => s.checklist_type === type);
  if (custom && custom.is_active === false) return null;
  if (custom) return custom;
  // Fall back to default for abertura/fechamento
  const def = DEFAULT_DEADLINES[type];
  return def || null;
}

export function getChecklistDeadline(dateStr: string, type: ChecklistType, settings?: DeadlineSetting[] | null): Date | null {
  const setting = getSettingForType(type, settings);
  if (!setting) return null;

  const [y, m, d] = dateStr.split('-').map(Number);
  const dayOffset = setting.is_next_day ? 1 : 0;
  // Build deadline in BRT-equivalent Date (local fields represent BRT)
  return new Date(y, m - 1, d + dayOffset, setting.deadline_hour, setting.deadline_minute, 0, 0);
}

export function getDeadlineInfo(dateStr: string, type: ChecklistType, settings?: DeadlineSetting[] | null): DeadlineInfo | null {
  const deadline = getChecklistDeadline(dateStr, type, settings);
  if (!deadline) return null;

  // Compare using BRT "now" so the comparison is timezone-safe
  const now = nowBRT();
  const remainingMs = deadline.getTime() - now.getTime();
  const passed = remainingMs <= 0;

  let label = 'Encerrado';
  if (!passed) {
    const totalMin = Math.floor(remainingMs / 60_000);
    const h = Math.floor(totalMin / 60);
    const min = totalMin % 60;
    label = h > 0 ? `${h}h ${min}min` : `${min}min`;
  }

  return { deadline, passed, remainingMs, label };
}

/** Get today's local date string yyyy-MM-dd in BRT */
export function getTodayDateStr(): string {
  const n = nowBRT();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
}

/**
 * Determines which checklist type is currently "active" (primary).
 * Uses custom settings if available.
 */
export function getCurrentChecklistType(settings?: DeadlineSetting[] | null): ChecklistType {
  const now = nowBRT();
  const todayStr = getTodayDateStr();
  const abDeadline = getChecklistDeadline(todayStr, 'abertura', settings);
  if (abDeadline && now < abDeadline) return 'abertura';
  return 'fechamento';
}

/**
 * Whether auto-close should run for a given date/type.
 */
export function shouldAutoClose(dateStr: string, type: ChecklistType, settings?: DeadlineSetting[] | null): boolean {
  if (type === 'bonus') {
    // Bonus auto-closes only if it has a custom deadline
    const setting = getSettingForType(type, settings);
    if (!setting) return false;
  }
  const today = getTodayDateStr();

  if (type === 'abertura') {
    return dateStr === today;
  }

  if (type === 'fechamento' || type === 'bonus') {
    const now = nowBRT();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    return dateStr === today || dateStr === yesterdayStr;
  }

  return false;
}

/** Format a deadline setting as human-readable string */
export function formatDeadlineSetting(setting: DeadlineSetting | null): string {
  if (!setting) return 'Sem limite';
  const h = String(setting.deadline_hour).padStart(2, '0');
  const m = String(setting.deadline_minute).padStart(2, '0');
  return `${h}:${m}${setting.is_next_day ? ' (dia seguinte)' : ''}`;
}
