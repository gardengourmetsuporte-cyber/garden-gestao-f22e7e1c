import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface FabAction {
  icon: string;
  label: string;
  onClick: () => void;
}

interface FabActionContextType {
  fabAction: FabAction | null;
  setFabAction: (action: FabAction | null) => void;
}

const FabActionContext = createContext<FabActionContextType>({
  fabAction: null,
  setFabAction: () => {},
});

export function FabActionProvider({ children }: { children: ReactNode }) {
  const [fabAction, setFabAction] = useState<FabAction | null>(null);

  return (
    <FabActionContext.Provider value={{ fabAction, setFabAction }}>
      {children}
    </FabActionContext.Provider>
  );
}

/**
 * Hook for pages to register their primary action on the central FAB.
 * The action is automatically cleared on unmount or route change.
 */
export function useFabAction(action: FabAction | null, deps: any[] = []) {
  const { setFabAction } = useContext(FabActionContext);

  useEffect(() => {
    setFabAction(action);
    return () => setFabAction(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export function useFabContext() {
  return useContext(FabActionContext);
}
