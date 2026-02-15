import { User } from 'lucide-react';
import { getRank, type RankInfo } from '@/lib/ranks';
import { cn } from '@/lib/utils';

interface RankedAvatarProps {
  avatarUrl?: string | null;
  earnedPoints: number;
  /** Size in pixels */
  size?: number;
  showTitle?: boolean;
  className?: string;
}

export function RankedAvatar({ avatarUrl, earnedPoints, size = 40, showTitle = false, className }: RankedAvatarProps) {
  const rank = getRank(earnedPoints);
  const isRainbow = rank.effect === 'rainbow';
  const isPrisma = rank.effect === 'prisma';
  const innerSize = size - rank.borderWidth * 2;

  const getBorderBackground = () => {
    if (isRainbow) {
      return `conic-gradient(from var(--neon-angle, 0deg), hsl(var(--neon-cyan)), hsl(var(--neon-purple)), hsl(var(--neon-amber)), hsl(var(--neon-red)), hsl(var(--neon-cyan)))`;
    }
    if (isPrisma) {
      return rank.borderColor;
    }
    return rank.borderColor;
  };

  const effectClass = (() => {
    switch (rank.effect) {
      case 'pulse': return 'ranked-avatar-pulse';
      case 'double-ring': return 'ranked-avatar-double-ring';
      case 'orbit': return 'ranked-avatar-orbit';
      case 'fire': return 'ranked-avatar-fire';
      case 'rainbow': return 'ranked-avatar-rainbow';
      case 'prisma': return 'ranked-avatar-prisma';
      default: return '';
    }
  })();

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        {/* Outer ring for double-ring effect */}
        {rank.effect === 'double-ring' && (
          <div
            className="absolute inset-0 rounded-full ranked-avatar-outer-ring"
            style={{
              border: `1px solid ${rank.borderColor}`,
              transform: 'scale(1.15)',
              opacity: 0.4,
            }}
          />
        )}

        {/* Orbit particles for Mestre */}
        {rank.effect === 'orbit' && (
          <div className="absolute inset-0 ranked-avatar-orbit-ring" style={{ width: size, height: size }}>
            <span className="orbit-particle orbit-particle-1" />
            <span className="orbit-particle orbit-particle-2" />
            <span className="orbit-particle orbit-particle-3" />
          </div>
        )}

        {/* Main border circle */}
        <div
          className={cn(
            "rounded-full flex items-center justify-center shrink-0 relative",
            effectClass
          )}
          style={{
            width: size,
            height: size,
            padding: rank.borderWidth,
            background: getBorderBackground(),
            boxShadow: rank.glow,
            animation: (isRainbow || isPrisma) ? 'neonRotate 3s linear infinite' : undefined,
          }}
        >
          <div
            className="rounded-full overflow-hidden flex items-center justify-center bg-card"
            style={{ width: innerSize, height: innerSize }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="text-muted-foreground" style={{ width: innerSize * 0.45, height: innerSize * 0.45 }} />
            )}
          </div>
        </div>
      </div>
      {showTitle && (
        <span
          className="text-[9px] font-bold uppercase tracking-wider"
          style={{ color: rank.color }}
        >
          {rank.title}
        </span>
      )}
    </div>
  );
}
