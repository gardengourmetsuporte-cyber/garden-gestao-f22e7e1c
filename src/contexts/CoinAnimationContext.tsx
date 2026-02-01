import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface CoinPosition {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface CoinAnimationContextType {
  coins: CoinPosition[];
  triggerCoin: (startX: number, startY: number) => void;
  removeCoin: (id: string) => void;
  triggerPulse: () => void;
  isPulsing: boolean;
}

const CoinAnimationContext = createContext<CoinAnimationContextType | null>(null);

export function CoinAnimationProvider({ children }: { children: ReactNode }) {
  const [coins, setCoins] = useState<CoinPosition[]>([]);
  const [isPulsing, setIsPulsing] = useState(false);

  const triggerCoin = useCallback((startX: number, startY: number) => {
    const pointsCounter = document.getElementById('points-counter');
    if (!pointsCounter) return;

    const rect = pointsCounter.getBoundingClientRect();
    const endX = rect.left + rect.width / 2;
    const endY = rect.top + rect.height / 2;

    const id = `coin-${Date.now()}-${Math.random()}`;
    setCoins(prev => [...prev, { id, startX, startY, endX, endY }]);
  }, []);

  const removeCoin = useCallback((id: string) => {
    setCoins(prev => prev.filter(c => c.id !== id));
  }, []);

  const triggerPulse = useCallback(() => {
    setIsPulsing(true);
    setTimeout(() => setIsPulsing(false), 300);
  }, []);

  return (
    <CoinAnimationContext.Provider value={{ coins, triggerCoin, removeCoin, triggerPulse, isPulsing }}>
      {children}
    </CoinAnimationContext.Provider>
  );
}

export function useCoinAnimation() {
  const context = useContext(CoinAnimationContext);
  if (!context) {
    throw new Error('useCoinAnimation must be used within a CoinAnimationProvider');
  }
  return context;
}
