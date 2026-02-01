import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Star } from 'lucide-react';
import { useCoinAnimation } from '@/contexts/CoinAnimationContext';

interface FlyingCoinProps {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

function FlyingCoin({ id, startX, startY, endX, endY }: FlyingCoinProps) {
  const { removeCoin, triggerPulse } = useCoinAnimation();
  const [position, setPosition] = useState({ x: startX, y: startY, scale: 1, opacity: 1, rotation: 0 });

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
      <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/50">
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
