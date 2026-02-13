import { RankedAvatar } from './RankedAvatar';
import { getRank, getNextRank } from '@/lib/ranks';
import { formatPoints } from '@/lib/points';
import { Progress } from '@/components/ui/progress';

interface ProfileHeaderProps {
  fullName: string;
  avatarUrl?: string | null;
  jobTitle?: string | null;
  earnedPoints: number;
}

export function ProfileHeader({ fullName, avatarUrl, jobTitle, earnedPoints }: ProfileHeaderProps) {
  const rank = getRank(earnedPoints);
  const next = getNextRank(earnedPoints);

  return (
    <div className="flex flex-col items-center gap-3 py-6">
      <RankedAvatar avatarUrl={avatarUrl} earnedPoints={earnedPoints} size={96} showTitle />
      <div className="text-center">
        <h1 className="text-xl font-bold text-foreground">{fullName}</h1>
        {jobTitle && <p className="text-sm text-muted-foreground">{jobTitle}</p>}
      </div>
      {next && (
        <div className="w-full max-w-[240px] space-y-1">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{rank.title}</span>
            <span>{next.title}</span>
          </div>
          <Progress
            value={100 - (next.pointsNeeded / (earnedPoints + next.pointsNeeded)) * 100}
            className="h-1.5"
          />
          <p className="text-[10px] text-center text-muted-foreground">
            Faltam <span className="font-semibold text-foreground">{formatPoints(next.pointsNeeded)}</span> pts para {next.title}
          </p>
        </div>
      )}
    </div>
  );
}
