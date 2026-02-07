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
function getCoinColors(points: number): { bg: string; glow: string } {
  switch (points) {
    case 1:
      return { bg: '#06B6D4', glow: '#06B6D4' }; // Ciano/Turquesa
    case 2:
      return { bg: '#FACC15', glow: '#FACC15' }; // Amarelo dourado
    case 3:
      return { bg: '#EC4899', glow: '#EC4899' }; // Rosa/Magenta
    case 4:
      return { bg: '#8B5CF6', glow: '#8B5CF6' }; // Roxo/Violeta
    default:
      return { bg: '#06B6D4', glow: '#06B6D4' };
  }
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
        className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{
          backgroundColor: colors.bg,
          boxShadow: `0 0 20px 8px ${colors.glow}80, 0 0 40px 16px ${colors.glow}40`,
        }}
      >
        <Star className="w-6 h-6 text-white fill-white" />
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
