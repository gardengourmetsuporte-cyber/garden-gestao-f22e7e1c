import { EloList } from '@/components/profile/EloList';

interface ObjectivesListProps {
  data: {
    earnedPoints: number;
    [key: string]: any;
  };
}

export function ObjectivesList({ data }: ObjectivesListProps) {
  return <EloList earnedPoints={data.earnedPoints} />;
}
