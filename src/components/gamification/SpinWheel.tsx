import { useState, useCallback, useMemo } from 'react';
import type { GamificationPrize } from '@/hooks/useGamification';
import { weightedRandom } from '@/hooks/useGamification';

interface SpinWheelProps {
  prizes: GamificationPrize[];
  onResult: (prize: GamificationPrize) => void;
  disabled?: boolean;
}

export function SpinWheel({ prizes, onResult, disabled }: SpinWheelProps) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);

  const totalWeight = useMemo(() => prizes.reduce((s, p) => s + p.probability, 0), [prizes]);

  const segments = useMemo(() => {
    let offset = 0;
    return prizes.map(p => {
      const angle = (p.probability / totalWeight) * 360;
      const seg = { ...p, startAngle: offset, angle };
      offset += angle;
      return seg;
    });
  }, [prizes, totalWeight]);

  const conicGradient = useMemo(() => {
    const parts: string[] = [];
    let pct = 0;
    segments.forEach(seg => {
      const end = pct + (seg.angle / 360) * 100;
      parts.push(`${seg.color} ${pct}% ${end}%`);
      pct = end;
    });
    return `conic-gradient(from 0deg, ${parts.join(', ')})`;
  }, [segments]);

  const spin = useCallback(() => {
    if (spinning || disabled || prizes.length === 0) return;
    setSpinning(true);

    const winner = weightedRandom(prizes);
    const winSeg = segments.find(s => s.id === winner.id)!;
    const centerAngle = winSeg.startAngle + winSeg.angle / 2;

    // Pointer is at top (0°). In CSS conic-gradient, 0° is at top going clockwise.
    // We rotate the wheel so the winner's center aligns with the top pointer.
    // Extra full rotations for drama.
    const extraSpins = 5 + Math.floor(Math.random() * 3); // 5-7 full rotations
    const targetAngle = extraSpins * 360 + (360 - centerAngle);

    setRotation(prev => prev + targetAngle);

    setTimeout(() => {
      setSpinning(false);
      onResult(winner);
    }, 4200);
  }, [spinning, disabled, prizes, segments, onResult]);

  if (prizes.length === 0) {
    return (
      <div className="flex items-center justify-center w-72 h-72 rounded-full bg-muted">
        <p className="text-muted-foreground text-sm">Nenhum prêmio configurado</p>
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center">
      {/* Pointer (top) */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 w-0 h-0"
        style={{
          borderLeft: '14px solid transparent',
          borderRight: '14px solid transparent',
          borderTop: '22px solid hsl(var(--primary))',
          filter: 'drop-shadow(0 2px 6px hsl(var(--primary) / 0.5))',
        }}
      />

      {/* Wheel */}
      <div
        className="w-72 h-72 sm:w-80 sm:h-80 rounded-full border-4 border-border/30 shadow-2xl relative overflow-hidden cursor-pointer"
        style={{
          background: conicGradient,
          transform: `rotate(${rotation}deg)`,
          transition: spinning
            ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)'
            : 'none',
        }}
        onClick={spin}
      >
        {/* Segment labels */}
        {segments.map(seg => {
          const midAngle = seg.startAngle + seg.angle / 2;
          const radians = (midAngle - 90) * (Math.PI / 180);
          const labelR = 38; // % from center
          const x = 50 + labelR * Math.cos(radians);
          const y = 50 + labelR * Math.sin(radians);
          return (
            <div
              key={seg.id}
              className="absolute text-center pointer-events-none"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: `translate(-50%, -50%) rotate(${midAngle}deg)`,
                fontSize: seg.angle < 30 ? '10px' : '13px',
                fontWeight: 700,
                textShadow: '0 1px 3px rgba(0,0,0,0.6)',
                color: '#fff',
                maxWidth: '60px',
                lineHeight: '1.1',
              }}
            >
              <span className="block text-lg">{seg.icon}</span>
            </div>
          );
        })}
      </div>

      {/* Center button */}
      <button
        onClick={spin}
        disabled={spinning || disabled}
        className="absolute z-10 w-16 h-16 rounded-full bg-card border-4 border-primary/50 flex items-center justify-center shadow-lg disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
        style={{ boxShadow: '0 0 20px hsl(var(--primary) / 0.3)' }}
      >
        <span className="text-primary font-bold text-xs uppercase tracking-wider">
          {spinning ? '...' : 'Girar'}
        </span>
      </button>
    </div>
  );
}
