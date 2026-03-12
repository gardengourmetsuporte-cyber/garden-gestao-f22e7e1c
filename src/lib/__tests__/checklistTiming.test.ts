import { describe, it, expect } from 'vitest';
import {
  getChecklistDeadline,
  getDeadlineInfo,
  shouldAutoClose,
  formatDeadlineSetting,
  type DeadlineSetting,
} from '../checklistTiming';

describe('getChecklistDeadline', () => {
  it('returns null when no setting and default is inactive', () => {
    // Default abertura has is_active: false
    const result = getChecklistDeadline('2026-03-12', 'abertura');
    expect(result).toBeNull();
  });

  it('returns deadline with custom active setting', () => {
    const settings: DeadlineSetting[] = [
      { checklist_type: 'abertura', deadline_hour: 10, deadline_minute: 30, is_next_day: false, is_active: true },
    ];
    const result = getChecklistDeadline('2026-03-12', 'abertura', settings);
    expect(result).not.toBeNull();
    expect(result!.getHours()).toBe(10);
    expect(result!.getMinutes()).toBe(30);
  });

  it('adds day offset for is_next_day', () => {
    const settings: DeadlineSetting[] = [
      { checklist_type: 'fechamento', deadline_hour: 2, deadline_minute: 0, is_next_day: true, is_active: true },
    ];
    const result = getChecklistDeadline('2026-03-12', 'fechamento', settings);
    expect(result!.getDate()).toBe(13);
  });
});

describe('formatDeadlineSetting', () => {
  it('returns "Sem limite" for null', () => {
    expect(formatDeadlineSetting(null)).toBe('Sem limite');
  });
  it('formats time', () => {
    expect(formatDeadlineSetting({ checklist_type: 'abertura', deadline_hour: 9, deadline_minute: 5, is_next_day: false }))
      .toBe('09:05');
  });
  it('adds (dia seguinte) when is_next_day', () => {
    expect(formatDeadlineSetting({ checklist_type: 'fechamento', deadline_hour: 2, deadline_minute: 0, is_next_day: true }))
      .toBe('02:00 (dia seguinte)');
  });
});

describe('shouldAutoClose', () => {
  it('returns false for bonus without custom setting', () => {
    expect(shouldAutoClose('2026-03-12', 'bonus')).toBe(false);
  });
});
