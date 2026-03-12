import { describe, it, expect } from 'vitest';
import {
  getModuleKeyFromRoute,
  getSubModuleKeys,
  isSubModuleKey,
  getParentModuleKey,
  ALL_MODULES,
} from '../modules';

describe('getModuleKeyFromRoute', () => {
  it('returns "dashboard" for /', () => {
    expect(getModuleKeyFromRoute('/')).toBe('dashboard');
  });
  it('returns "finance" for /finance', () => {
    expect(getModuleKeyFromRoute('/finance')).toBe('finance');
  });
  it('returns null for unknown route', () => {
    expect(getModuleKeyFromRoute('/nonexistent')).toBeNull();
  });
  it('maps /whatsapp to whatsapp', () => {
    expect(getModuleKeyFromRoute('/whatsapp')).toBe('whatsapp');
  });
});

describe('getSubModuleKeys', () => {
  it('returns children keys for finance', () => {
    const keys = getSubModuleKeys('finance');
    expect(keys).toContain('finance.view');
    expect(keys).toContain('finance.create');
    expect(keys.length).toBeGreaterThan(0);
  });
  it('returns empty for module without children', () => {
    expect(getSubModuleKeys('dashboard')).toEqual([]);
  });
  it('returns empty for nonexistent module', () => {
    expect(getSubModuleKeys('nope')).toEqual([]);
  });
});

describe('isSubModuleKey', () => {
  it('true for dotted keys', () => {
    expect(isSubModuleKey('finance.view')).toBe(true);
  });
  it('false for top-level keys', () => {
    expect(isSubModuleKey('finance')).toBe(false);
  });
});

describe('getParentModuleKey', () => {
  it('extracts parent from sub-module', () => {
    expect(getParentModuleKey('finance.view')).toBe('finance');
  });
  it('returns key itself if no dot', () => {
    expect(getParentModuleKey('dashboard')).toBe('dashboard');
  });
});

describe('ALL_MODULES integrity', () => {
  it('has unique keys', () => {
    const keys = ALL_MODULES.map(m => m.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
  it('every module has a route', () => {
    ALL_MODULES.forEach(m => {
      expect(m.route).toBeTruthy();
      expect(m.routes.length).toBeGreaterThan(0);
    });
  });
});
