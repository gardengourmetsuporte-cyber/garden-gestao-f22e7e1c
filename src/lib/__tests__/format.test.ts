import { describe, it, expect } from 'vitest';
import { formatCurrency, formatCurrencyCompact, formatCurrencySimple } from '../format';

describe('formatCurrency', () => {
  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('R$\u00a00,00');
  });
  it('formats positive value', () => {
    expect(formatCurrency(1234.56)).toBe('R$\u00a01.234,56');
  });
  it('formats negative value', () => {
    expect(formatCurrency(-500)).toBe('-R$\u00a0500,00');
  });
  it('formats millions', () => {
    const result = formatCurrency(1_000_000);
    expect(result).toContain('1.000.000');
  });
  it('formats cents only', () => {
    expect(formatCurrency(0.99)).toBe('R$\u00a00,99');
  });
});

describe('formatCurrencyCompact', () => {
  it('formats thousands', () => {
    const result = formatCurrencyCompact(1500);
    expect(result).toContain('mil');
  });
  it('formats small values without compact notation', () => {
    const result = formatCurrencyCompact(50);
    expect(result).toContain('50');
  });
});

describe('formatCurrencySimple', () => {
  it('formats with R$ prefix', () => {
    expect(formatCurrencySimple(1234.56)).toBe('R$ 1.234,56');
  });
  it('formats zero', () => {
    expect(formatCurrencySimple(0)).toBe('R$ 0,00');
  });
});
