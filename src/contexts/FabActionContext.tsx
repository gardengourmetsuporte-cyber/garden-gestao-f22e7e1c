import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export interface FabAction {
  icon: string;
  label: string;
  onClick: () => void;
  badge?: number;
}

interface FabActionContextType {
  fabAction: FabAction | null;
  fabActions: FabAction[];
  setFabAction: (action: FabAction | null) => void;
  setFabActions: (actions: FabAction[]) => void;
}

const FabActionContext = createContext<FabActionContextType>({
  fabAction: null,
  fabActions: [],
  setFabAction: () => {},
  setFabActions: () => {},
});

export function FabActionProvider({ children }: { children: ReactNode }) {
  const [fabAction, setFabAction] = useState<FabAction | null>(null);
  const [fabActions, setFabActions] = useState<FabAction[]>([]);

  return (
    <FabActionContext.Provider value={{ fabAction, fabActions, setFabAction, setFabActions }}>
      {children}
    </FabActionContext.Provider>
  );
}

/**
 * Hook for pages to register their primary action on the central FAB.
 * The action is automatically cleared on unmount or route change.
 */
export function useFabAction(action: FabAction | null, deps: any[] = []) {
  const { setFabAction, setFabActions } = useContext(FabActionContext);

  useEffect(() => {
    setFabAction(action);
    setFabActions([]);
    return () => { setFabAction(null); setFabActions([]); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * Hook for pages to register multiple actions on the FAB (speed dial).
 * When tapped, the FAB opens a radial/list menu with all actions.
 */
export function useFabActions(actions: FabAction[], deps: any[] = []) {
  const { setFabAction, setFabActions } = useContext(FabActionContext);

  useEffect(() => {
    if (actions.length === 1) {
      setFabAction(actions[0]);
      setFabActions([]);
    } else if (actions.length > 1) {
      setFabAction(null);
      setFabActions(actions);
    }
    return () => { setFabAction(null); setFabActions([]); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export function useFabContext() {
  return useContext(FabActionContext);
}
