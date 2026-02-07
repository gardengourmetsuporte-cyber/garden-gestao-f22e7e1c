import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Star } from 'lucide-react';
import { useCoinAnimation } from '@/contexts/CoinAnimationContext';

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
  const [position, setPosition] = useState({ x: startX, y: startY, scale: 1, opacity: 1, rotation: 0 });

  const colors = useMemo(() => getCoinColors(points), [points]);

  useEffect(() => {
    requestAnimationFrame(() => {
      setPosition({
        x: endX,
        y: endY,
        scale: 0.5,
        opacity: 0,
        rotation: 360,
      });
    });

    const timer = setTimeout(() => {
      triggerPulse();
      removeCoin(id);
    }, 600);

    return () => clearTimeout(timer);
  }, [id, endX, endY, removeCoin, triggerPulse]);

  return createPortal(
    <div
      className="fixed pointer-events-none z-[9999]"
      style={{
        left: position.x,
        top: position.y,
        transform: `translate(-50%, -50%) scale(${position.scale}) rotate(${position.rotation}deg)`,
        opacity: position.opacity,
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
        <Star className="w-7 h-7 text-primary-foreground fill-primary-foreground drop-shadow-lg" />
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
