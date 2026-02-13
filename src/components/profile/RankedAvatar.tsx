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
  const isRainbow = rank.borderColor === 'rainbow';
  const innerSize = size - rank.borderWidth * 2;

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div
        className={cn(
          "rounded-full flex items-center justify-center shrink-0 relative",
          isRainbow && "ranked-avatar-rainbow",
          rank.animated && !isRainbow && "ranked-avatar-pulse"
        )}
        style={{
          width: size,
          height: size,
          padding: rank.borderWidth,
          background: isRainbow
            ? `conic-gradient(from var(--neon-angle, 0deg), hsl(var(--neon-cyan)), hsl(var(--neon-purple)), hsl(var(--neon-amber)), hsl(var(--neon-red)), hsl(var(--neon-cyan)))`
            : rank.borderColor,
          boxShadow: rank.glow,
          animation: isRainbow ? 'neonRotate 3s linear infinite' : undefined,
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
