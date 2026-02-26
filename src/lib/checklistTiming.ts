/**
 * Centralized checklist timing logic.
 * Abertura deadline: same day at 19:30
 * Fechamento deadline: next day at 02:00
 */

import { ChecklistType } from '@/types/database';

interface DeadlineInfo {
  deadline: Date;
  passed: boolean;
  remainingMs: number;
  label: string; // e.g. "2h 15min" or "Encerrado"
}

export function getChecklistDeadline(dateStr: string, type: ChecklistType): Date | null {
  if (type === 'bonus') return null;

  // Parse date string safely (avoid UTC shift)
  const [y, m, d] = dateStr.split('-').map(Number);

  if (type === 'abertura') {
    return new Date(y, m - 1, d, 19, 30, 0, 0);
  }

  if (type === 'fechamento') {
    // Next day at 02:00
    return new Date(y, m - 1, d + 1, 2, 0, 0, 0);
  }

  return null;
}

export function getDeadlineInfo(dateStr: string, type: ChecklistType): DeadlineInfo | null {
  const deadline = getChecklistDeadline(dateStr, type);
  if (!deadline) return null;

  const now = new Date();
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

/** Get today's local date string yyyy-MM-dd */
export function getTodayDateStr(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
}

/**
 * Determines which checklist type is currently "active" (primary).
 * Before 19:30 → abertura, after → fechamento.
 */
export function getCurrentChecklistType(): ChecklistType {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  if (h < 19 || (h === 19 && m < 30)) return 'abertura';
  return 'fechamento';
}

/**
 * Whether auto-close should run for a given date/type.
 * Only valid for today's operational windows.
 */
export function shouldAutoClose(dateStr: string, type: ChecklistType): boolean {
  if (type === 'bonus') return false;
  const today = getTodayDateStr();

  if (type === 'abertura') {
    // Only auto-close abertura for today
    return dateStr === today;
  }

  if (type === 'fechamento') {
    // Fechamento closes at 02:00 next day, so valid for today AND yesterday
    // But only if the deadline has actually passed
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    return dateStr === today || dateStr === yesterdayStr;
  }

  return false;
}
