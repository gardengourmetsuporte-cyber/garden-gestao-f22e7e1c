import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Star } from 'lucide-react';
import { useCoinAnimation } from '@/contexts/CoinAnimationContext';
import { cn } from '@/lib/utils';

interface FlyingCoinProps {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  points?: number;
}

// Cores MUITO distintas e chamativas para cada nível de pontos
// 1pt = Ciano, 2pt = Amarelo Dourado, 3pt = Rosa/Magenta, 4pt = Roxo/Violeta
const COIN_COLORS: Record<number, { bg: string; glow: string }> = {
  1: { bg: '#22D3EE', glow: '#22D3EE' }, // Ciano brilhante (cyan-400)
  2: { bg: '#FCD34D', glow: '#FCD34D' }, // Amarelo dourado (amber-300)
  3: { bg: '#F472B6', glow: '#F472B6' }, // Rosa pink (pink-400)
  4: { bg: '#A78BFA', glow: '#A78BFA' }, // Roxo violeta (violet-400)
};

function getCoinColors(points: number): { bg: string; glow: string } {
  return COIN_COLORS[points] || COIN_COLORS[1];
}

function FlyingCoin({ id, startX, startY, endX, endY, points = 1 }: FlyingCoinProps) {
  const { removeCoin, triggerPulse } = useCoinAnimation();
  const [position, setPosition] = useState({ x: startX, y: startY, scale: 1, opacity: 1, rotation: 0 });
  const colors = getCoinColors(points);

  useEffect(() => {
    // Start animation after a frame
    requestAnimationFrame(() => {
      setPosition({
        x: endX,
        y: endY,
        scale: 0.5,
        opacity: 0,
        rotation: 360,
      });
    });

    // Trigger pulse on destination and remove coin
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
          boxShadow: `0 0 25px 10px ${colors.glow}, 0 0 50px 20px ${colors.glow}80`,
          border: '3px solid white',
        }}
      >
        <Star className="w-7 h-7 text-white fill-white drop-shadow-lg" />
      </div>
    </div>,
    document.body
  );
}

export function CoinAnimationLayer() {
  const { coins } = useCoinAnimation();

  return (
    <>
      {coins.map(coin => (
        <FlyingCoin key={coin.id} {...coin} />
      ))}
    </>
  );
}
