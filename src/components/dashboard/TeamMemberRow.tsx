import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import type { TeamMemberStats } from '@/hooks/useTeamDashboard';

function getInitials(name: string): string {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return (parts[0]?.[0] || '?').toUpperCase();
}

const AVATAR_COLORS = [
  'bg-amber-500', 'bg-rose-500', 'bg-blue-500', 'bg-emerald-500',
  'bg-violet-500', 'bg-cyan-500', 'bg-orange-500', 'bg-pink-500',
];

function hashColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

interface Props {
  member: TeamMemberStats;
  compact?: boolean;
}

export function TeamMemberRow({ member, compact }: Props) {
  const initials = getInitials(member.full_name);
  const color = hashColor(member.full_name);
  const firstName = member.full_name.split(' ')[0];
  const lastInitial = member.full_name.split(' ')[1]?.[0];
  const shortName = lastInitial ? `${firstName} ${lastInitial}.` : firstName;

  const pctColor = member.utilizationPct >= 80 ? 'text-emerald-400' :
    member.utilizationPct >= 50 ? 'text-amber-400' : 'text-muted-foreground';

  return (
    <div className={cn('flex items-center gap-2.5 rounded-xl hover:bg-muted/20 transition-colors', compact ? 'px-1.5 py-1.5' : 'px-2.5 py-2')}>
      {/* Avatar */}
      {member.avatar_url ? (
        <img
          src={member.avatar_url}
          alt={member.full_name}
          className={cn('rounded-full object-cover shrink-0', compact ? 'w-6 h-6' : 'w-8 h-8')}
        />
      ) : (
        <div className={cn('rounded-full flex items-center justify-center text-white font-bold shrink-0', color, compact ? 'w-6 h-6 text-[9px]' : 'w-8 h-8 text-xs')}>
          {initials}
        </div>
      )}

      {/* Name + Progress */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className={cn('font-medium text-foreground truncate', compact ? 'text-[11px]' : 'text-xs')}>{shortName}</span>
          <span className={cn('font-bold tabular-nums ml-2', pctColor, compact ? 'text-[10px]' : 'text-[10px]')}>
            {member.utilizationPct}%
          </span>
        </div>
        {!compact && <Progress value={member.utilizationPct} className="h-1.5" />}
      </div>
    </div>
  );
}
