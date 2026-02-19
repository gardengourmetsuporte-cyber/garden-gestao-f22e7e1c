import { getRank } from '@/lib/ranks';
import { RANK_FRAMES } from './rank-frames';
import { DefaultAvatar } from './DefaultAvatar';
import { cn } from '@/lib/utils';

interface RankedAvatarProps {
  avatarUrl?: string | null;
  earnedPoints: number;
  /** Size in pixels (avatar size — frame will be larger) */
  size?: number;
  showTitle?: boolean;
  className?: string;
  /** Override the frame to display (rank title). null = auto based on points */
  overrideFrame?: string | null;
  /** User's full name for default avatar */
  userName?: string;
  /** User ID for deterministic color */
  userId?: string;
}

export function RankedAvatar({ avatarUrl, earnedPoints, size = 40, showTitle = false, className, overrideFrame, userName, userId }: RankedAvatarProps) {
  const rank = getRank(earnedPoints);

  // Determine which frame to use
  const frameTitle = overrideFrame || rank.title;
  const FrameComponent = RANK_FRAMES[frameTitle];

  const avatar = (
    <div
      className="rounded-full overflow-hidden flex items-center justify-center bg-card border border-border/30"
      style={{ width: size, height: size }}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
      ) : userName ? (
        <DefaultAvatar name={userName} size={size} userId={userId} />
      ) : (
        <DefaultAvatar name={userId || '?'} size={size} userId={userId} />
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
