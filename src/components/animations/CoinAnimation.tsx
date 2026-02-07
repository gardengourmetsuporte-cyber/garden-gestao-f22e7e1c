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

// Cores bem distintas e chamativas para cada nível de pontos
function getCoinColors(points: number) {
  switch (points) {
    case 1:
      return { bg: 'bg-blue-500', shadow: 'shadow-blue-500/60' }; // Azul
    case 2:
      return { bg: 'bg-emerald-500', shadow: 'shadow-emerald-500/60' }; // Verde
    case 3:
      return { bg: 'bg-orange-500', shadow: 'shadow-orange-500/60' }; // Laranja
    case 4:
      return { bg: 'bg-rose-500', shadow: 'shadow-rose-500/60' }; // Vermelho/Rosa
    default:
      return { bg: 'bg-blue-500', shadow: 'shadow-blue-500/60' };
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
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center shadow-lg",
        colors.bg,
        colors.shadow
      )}>
        <Star className="w-5 h-5 text-white fill-white" />
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
