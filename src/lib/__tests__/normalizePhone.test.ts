import { describe, it, expect } from 'vitest';
import { normalizePhone, formatPhoneDisplay } from '../normalizePhone';

describe('normalizePhone', () => {
  it('returns null for null/undefined/empty', () => {
    expect(normalizePhone(null)).toBeNull();
    expect(normalizePhone(undefined)).toBeNull();
    expect(normalizePhone('')).toBeNull();
  });
  it('normalizes 11-digit mobile', () => {
    expect(normalizePhone('11999887766')).toBe('5511999887766');
  });
  it('normalizes 10-digit landline', () => {
    expect(normalizePhone('1133445566')).toBe('551133445566');
  });
  it('strips formatting', () => {
    expect(normalizePhone('(11) 99988-7766')).toBe('5511999887766');
  });
  it('removes country code 55 if already present', () => {
    expect(normalizePhone('+5511999887766')).toBe('5511999887766');
  });
  it('removes leading 0', () => {
    expect(normalizePhone('01199988-7766')).toBe('5511999887766');
  });
  it('returns null for too short', () => {
    expect(normalizePhone('12345')).toBeNull();
  });
  it('caps at 11 digits + country code', () => {
    expect(normalizePhone('119998877661234')).toBe('5511999887766');
  });
});

describe('formatPhoneDisplay', () => {
  it('formats 11-digit mobile', () => {
    expect(formatPhoneDisplay('5511999887766')).toBe('(11) 99988-7766');
  });
  it('formats 10-digit landline', () => {
    expect(formatPhoneDisplay('551133445566')).toBe('(11) 3344-5566');
  });
  it('returns empty for null', () => {
    expect(formatPhoneDisplay(null)).toBe('');
  });
});
