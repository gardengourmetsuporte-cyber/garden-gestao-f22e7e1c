import { User } from 'lucide-react';
import { getRank } from '@/lib/ranks';
import { RANK_FRAMES } from './rank-frames';
import { cn } from '@/lib/utils';

interface RankedAvatarProps {
  avatarUrl?: string | null;
  earnedPoints: number;
  /** Size in pixels (avatar size — frame will be larger) */
  size?: number;
  showTitle?: boolean;
  className?: string;
}

export function RankedAvatar({ avatarUrl, earnedPoints, size = 40, showTitle = false, className }: RankedAvatarProps) {
  const rank = getRank(earnedPoints);
  const FrameComponent = RANK_FRAMES[rank.title];

  const avatar = (
    <div
      className="rounded-full overflow-hidden flex items-center justify-center bg-card border border-border/30"
      style={{ width: size, height: size }}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
      ) : (
        <User className="text-muted-foreground" style={{ width: size * 0.45, height: size * 0.45 }} />
      )}
    </div>
  );

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      {FrameComponent ? (
        <FrameComponent size={size}>
          {avatar}
        </FrameComponent>
      ) : (
        <div className="relative" style={{ width: size, height: size }}>
          {avatar}
        </div>
      )}
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
