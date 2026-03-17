import { useCallback, useSyncExternalStore } from 'react';
import { ALL_MODULES } from '@/lib/modules';
import { useUserModules } from '@/hooks/useAccessLevels';

const STORAGE_KEY = 'bottombar-pinned-tabs';
const DEFAULT_KEYS = ['checklists', 'finance'];
// Preferred order for auto-selecting tabs the user has access to
const PREFERRED_ORDER = ['checklists', 'deliveries', 'finance', 'ranking', 'inventory', 'employees', 'agenda', 'rewards', 'cash-closing'];
const PINNED_COUNT = 2;

export interface BottomTabDef {
  key: string;
  icon: string;
  customIcon?: string;
  label: string;
  path: string;
  moduleKey: string;
}

function resolveTab(moduleKey: string): BottomTabDef | null {
  const mod = ALL_MODULES.find(m => m.key === moduleKey);
  if (!mod || mod.key === 'dashboard' || mod.key === 'settings') return null;
  return {
    key: mod.key,
    icon: mod.icon,
    customIcon: mod.customIcon,
    label: mod.label,
    path: mod.route,
    moduleKey: mod.key,
  };
}

function hasCustomPinnedTabs(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

function readFromStorage(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_KEYS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((k: unknown) => typeof k === 'string')) {
      const trimmed = parsed.slice(0, PINNED_COUNT);
      if (trimmed.length === PINNED_COUNT) return trimmed;
    }
  } catch {}
  return DEFAULT_KEYS;
}

// Shared reactive store so all consumers stay in sync
let _snapshot = readFromStorage();
const _listeners = new Set<() => void>();

function notify() {
  _snapshot = readFromStorage();
  _listeners.forEach(fn => fn());
}

function subscribe(cb: () => void) {
  _listeners.add(cb);
  return () => { _listeners.delete(cb); };
}

function getSnapshot() {
  return _snapshot;
}

export function useBottomBarTabs() {
  const storedKeys = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const { hasAccess } = useUserModules();
  const isCustomized = hasCustomPinnedTabs();

  // If user hasn't customized tabs, pick the best defaults based on their access
  let pinnedKeys = storedKeys;
  if (!isCustomized) {
    const accessibleKeys: string[] = [];
    for (const key of PREFERRED_ORDER) {
      if (accessibleKeys.length >= PINNED_COUNT) break;
      if (hasAccess(key)) {
        accessibleKeys.push(key);
      }
    }
    // If we found enough accessible modules, use them; otherwise fall back to defaults
    if (accessibleKeys.length >= PINNED_COUNT) {
      pinnedKeys = accessibleKeys.slice(0, PINNED_COUNT);
    }
  }

  const pinnedTabs: BottomTabDef[] = pinnedKeys
    .map(resolveTab)
    .filter((t): t is BottomTabDef => t !== null);

  if (pinnedTabs.length < PINNED_COUNT) {
    const fallbacks = DEFAULT_KEYS.map(resolveTab).filter((t): t is BottomTabDef => t !== null);
    while (pinnedTabs.length < PINNED_COUNT && fallbacks.length > 0) {
      const fb = fallbacks.shift()!;
      if (!pinnedTabs.find(t => t.key === fb.key)) pinnedTabs.push(fb);
    }
  }

  const setPinnedTabs = useCallback((keys: string[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
    notify();
  }, []);

  return { pinnedTabs, pinnedKeys, setPinnedTabs };
}
