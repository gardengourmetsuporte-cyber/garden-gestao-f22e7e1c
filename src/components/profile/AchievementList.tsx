import { EloList } from './EloList';

interface AchievementListProps {
  achievements: any[];
  earnedPoints?: number;
}

/**
 * @deprecated Use EloList directly instead
 */
export function AchievementList({ achievements, earnedPoints = 0 }: AchievementListProps) {
  return <EloList earnedPoints={earnedPoints} />;
}
