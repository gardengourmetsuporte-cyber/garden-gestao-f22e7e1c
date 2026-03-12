import { describe, it, expect } from 'vitest';
import {
  clampPoints,
  calculateEarnedPoints,
  calculateSpentPoints,
  calculatePointsSummary,
  getPointsColors,
  getBonusPointsColors,
  formatPoints,
  getPointsLabel,
} from '../points';

describe('clampPoints', () => {
  it.each([
    [0, 1], [-1, 1], [1, 1], [2, 2], [3, 3], [4, 4], [5, 4], [100, 4],
  ])('clampPoints(%d) → %d', (input, expected) => {
    expect(clampPoints(input)).toBe(expected);
  });
});

describe('calculateEarnedPoints', () => {
  it('sums points where awarded_points is not false', () => {
    const completions = [
      { points_awarded: 3, awarded_points: true },
      { points_awarded: 2, awarded_points: false },
      { points_awarded: 5 },
    ];
    expect(calculateEarnedPoints(completions)).toBe(8);
  });
  it('returns 0 for empty array', () => {
    expect(calculateEarnedPoints([])).toBe(0);
  });
});

describe('calculateSpentPoints', () => {
  it('sums only approved/delivered', () => {
    const redemptions = [
      { points_spent: 10, status: 'approved' },
      { points_spent: 5, status: 'pending' },
      { points_spent: 3, status: 'delivered' },
    ];
    expect(calculateSpentPoints(redemptions)).toBe(13);
  });
  it('returns 0 for empty', () => {
    expect(calculateSpentPoints([])).toBe(0);
  });
});

describe('calculatePointsSummary', () => {
  it('returns correct balance', () => {
    const completions = [{ points_awarded: 10, awarded_points: true }];
    const redemptions = [{ points_spent: 4, status: 'approved' }];
    const summary = calculatePointsSummary(completions, redemptions);
    expect(summary).toEqual({ earned: 10, spent: 4, balance: 6 });
  });
});

describe('getPointsColors', () => {
  it('returns CSS variable references', () => {
    const colors = getPointsColors(2);
    expect(colors.color).toBe('hsl(var(--coin-2))');
    expect(colors.bg).toBe('hsl(var(--coin-2) / 0.18)');
  });
});

describe('getBonusPointsColors', () => {
  it('uses coin colors for 1-4', () => {
    expect(getBonusPointsColors(3).color).toBe('hsl(var(--coin-3))');
  });
  it('uses bonus tier for 5+', () => {
    expect(getBonusPointsColors(7).color).toBe('hsl(var(--bonus-10))');
  });
});

describe('formatPoints', () => {
  it('formats with locale', () => {
    expect(formatPoints(1000)).toBe('1.000');
  });
});

describe('getPointsLabel', () => {
  it('zero → sem pontos', () => expect(getPointsLabel(0)).toBe('sem pontos'));
  it('1 → 1 ponto', () => expect(getPointsLabel(1)).toBe('1 ponto'));
  it('5 → 5 pontos', () => expect(getPointsLabel(5)).toBe('5 pontos'));
});
