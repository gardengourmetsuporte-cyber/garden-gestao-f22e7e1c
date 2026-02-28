import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useCoinAnimation } from '@/contexts/CoinAnimationContext';
import { AppIcon } from '@/components/ui/app-icon';

interface FlyingCoinProps {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  points?: number;
}

function clampPoints(points: number): 1 | 2 | 3 | 4 {
  const p = Math.round(Number(points) || 1);
  if (p <= 1) return 1;
  if (p === 2) return 2;
  if (p === 3) return 3;
  return 4;
}

// Usa tokens HSL do design system (definidos em src/index.css)
function getCoinColors(points: number): { bg: string; glow: string } {
  const p = clampPoints(points);

  const bg = `hsl(var(--coin-${p}))`;
  const glow = `hsl(var(--coin-${p}-glow))`;

  return { bg, glow };
}

function FlyingCoin({ id, startX, startY, endX, endY, points = 1 }: FlyingCoinProps) {
  const { removeCoin, triggerPulse } = useCoinAnimation();
  const [arrived, setArrived] = useState(false);

  const colors = useMemo(() => getCoinColors(points), [points]);

  useEffect(() => {
    // Use double-rAF to ensure the browser paints the start position first
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => {
        setArrived(true);
      });
      return () => cancelAnimationFrame(raf2);
    });

    const timer = setTimeout(() => {
      triggerPulse();
      removeCoin(id);
    }, 600);

    return () => {
      cancelAnimationFrame(raf1);
      clearTimeout(timer);
    };
  }, [id, removeCoin, triggerPulse]);

  return createPortal(
    <div
      className="fixed pointer-events-none z-[9999]"
      style={{
        left: arrived ? endX : startX,
        top: arrived ? endY : startY,
        transform: `translate(-50%, -50%) scale(${arrived ? 0.5 : 1}) rotate(${arrived ? 360 : 0}deg)`,
        opacity: arrived ? 0 : 1,
        transition: 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      }}
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center animate-pulse"
        style={{
          backgroundColor: colors.bg,
          boxShadow: `0 0 25px 10px ${colors.glow}, 0 0 50px 20px ${colors.glow}`,
          border: '3px solid hsl(var(--background))',
        }}
      >
        <AppIcon name="Star" className="w-7 h-7 text-primary-foreground fill-primary-foreground drop-shadow-lg" />
      </div>
    </div>,
    document.body
  );
}

export function CoinAnimationLayer() {
  const { coins } = useCoinAnimation();

  return (
    <>
      {coins.map((coin) => (
        <FlyingCoin key={coin.id} {...coin} />
      ))}
    </>
  );
}
