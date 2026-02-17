import { LeaderboardEntry } from '@/hooks/useLeaderboard';
import { RankedAvatar } from '@/components/profile/RankedAvatar';
import { getRank } from '@/lib/ranks';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface PodiumProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  compact?: boolean;
}

const PODIUM_CONFIG = [
  { position: 1, order: 2, height: 'h-20', barColor: 'from-amber-500/30 to-amber-600/10', crownColor: 'hsl(var(--neon-amber))', label: '1º' },
  { position: 2, order: 1, height: 'h-14', barColor: 'from-slate-400/20 to-slate-500/10', crownColor: 'hsl(215 20% 65%)', label: '2º' },
  { position: 3, order: 3, height: 'h-10', barColor: 'from-orange-700/20 to-orange-800/10', crownColor: 'hsl(30 50% 45%)', label: '3º' },
];

export function Podium({ entries, currentUserId, compact = false }: PodiumProps) {
  const top3 = entries.slice(0, 3);
  if (top3.length === 0) return null;

  // Pad to 3 if needed
  while (top3.length < 3) {
    top3.push(null as any);
  }

  const avatarSize = compact ? 40 : 52;

  return (
    <div className="flex items-end justify-center gap-2 pt-4 pb-2">
      {PODIUM_CONFIG.map(({ position, order, height, barColor, crownColor, label }) => {
        const entry = top3[position - 1];
        if (!entry) {
          return (
            <div key={position} className="flex flex-col items-center" style={{ order }}>
              <div className={cn("w-16 rounded-t-xl bg-secondary/30", compact ? "w-14" : "w-18", height)} />
            </div>
          );
        }

        const isCurrentUser = entry.user_id === currentUserId;
        const entryRank = getRank(entry.total_score);

        return (
          <Link
            to={`/profile/${entry.user_id}`}
            key={entry.user_id}
            className="flex flex-col items-center animate-slide-up"
            style={{ order, animationDelay: `${(position - 1) * 100}ms` }}
          >
            {/* Crown for 1st */}
            {position === 1 && (
              <div className="mb-1 animate-pulse" style={{ animationDuration: '3s' }}>
                <AppIcon name="Crown" size={compact ? 18 : 22} style={{ color: crownColor }} />
              </div>
            )}

            {/* Avatar */}
            <div className={cn(
              "relative mb-2 rounded-full",
              position === 1 && "ring-2 ring-offset-2 ring-offset-background ring-amber-500/60",
              isCurrentUser && position !== 1 && "ring-2 ring-primary ring-offset-2 ring-offset-background"
            )}>
              <RankedAvatar
                avatarUrl={entry.avatar_url}
                earnedPoints={entry.total_score}
                size={avatarSize}
              />
              {/* Position badge */}
              <div
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-background"
                style={{ background: crownColor, color: position === 1 ? '#1a1a2e' : '#fff' }}
              >
                {position}
              </div>
            </div>

            {/* Name */}
            <p className={cn(
              "font-semibold text-center truncate max-w-[70px]",
              compact ? "text-[11px]" : "text-xs",
              isCurrentUser ? "text-primary" : "text-foreground"
            )}>
              {entry.full_name?.split(' ')[0]}
            </p>

            {/* Rank title */}
            {!compact && (
              <p className="text-[10px] text-muted-foreground" style={{ color: entryRank.color }}>
                {entryRank.title}
              </p>
            )}

            {/* Score */}
            <div className="flex items-center gap-0.5 mt-0.5">
              <AppIcon name="Star" size={10} style={{ color: crownColor }} />
              <span className="text-[11px] font-bold" style={{ color: crownColor }}>
                {entry.total_score}
              </span>
            </div>

            {/* Podium bar */}
            <div
              className={cn(
                "w-full rounded-t-xl mt-1.5 bg-gradient-to-t border border-border/30 border-b-0",
                compact ? "w-16" : "w-20",
                height
              )}
              style={{
                background: `linear-gradient(to top, ${crownColor}20, ${crownColor}05)`,
                borderColor: `${crownColor}30`,
              }}
            >
              <div className="flex items-center justify-center h-full">
                <span className="text-xs font-bold text-muted-foreground/50">{label}</span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
