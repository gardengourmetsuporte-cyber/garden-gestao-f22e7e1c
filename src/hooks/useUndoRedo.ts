import { useCallback, useRef, useSyncExternalStore } from 'react';
import { FinanceTransaction, TransactionFormData } from '@/types/finance';

export type UndoAction =
  | { type: 'create'; transactionId: string; data: TransactionFormData }
  | { type: 'delete'; transactionId: string; snapshot: FinanceTransaction }
  | { type: 'update'; transactionId: string; before: Partial<TransactionFormData>; after: Partial<TransactionFormData> }
  | { type: 'toggle_paid'; transactionId: string; wasPaid: boolean };

const MAX_STACK = 20;

export function useUndoRedo() {
  const undoRef = useRef<UndoAction[]>([]);
  const redoRef = useRef<UndoAction[]>([]);
  const versionRef = useRef(0);
  const listenersRef = useRef(new Set<() => void>());

  const notify = useCallback(() => {
    versionRef.current++;
    listenersRef.current.forEach(l => l());
  }, []);

  const subscribe = useCallback((cb: () => void) => {
    listenersRef.current.add(cb);
    return () => { listenersRef.current.delete(cb); };
  }, []);

  const getSnapshot = useCallback(() => versionRef.current, []);

  // Force re-render on changes
  useSyncExternalStore(subscribe, getSnapshot);

  const pushAction = useCallback((action: UndoAction) => {
    undoRef.current = [...undoRef.current.slice(-(MAX_STACK - 1)), action];
    redoRef.current = [];
    notify();
  }, [notify]);

  const popUndo = useCallback((): UndoAction | null => {
    if (undoRef.current.length === 0) return null;
    const action = undoRef.current[undoRef.current.length - 1];
    undoRef.current = undoRef.current.slice(0, -1);
    notify();
    return action;
  }, [notify]);

  const popRedo = useCallback((): UndoAction | null => {
    if (redoRef.current.length === 0) return null;
    const action = redoRef.current[redoRef.current.length - 1];
    redoRef.current = redoRef.current.slice(0, -1);
    notify();
    return action;
  }, [notify]);

  const pushToRedo = useCallback((action: UndoAction) => {
    redoRef.current = [...redoRef.current.slice(-(MAX_STACK - 1)), action];
    notify();
  }, [notify]);

  const pushToUndo = useCallback((action: UndoAction) => {
    undoRef.current = [...undoRef.current.slice(-(MAX_STACK - 1)), action];
    notify();
  }, [notify]);

  return {
    canUndo: undoRef.current.length > 0,
    canRedo: redoRef.current.length > 0,
    pushAction,
    popUndo,
    popRedo,
    pushToRedo,
    pushToUndo,
  };
}
