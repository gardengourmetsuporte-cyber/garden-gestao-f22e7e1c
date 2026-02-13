import { UserPointsCard } from '@/components/dashboard/UserPointsCard';

interface PointsWidgetProps {
  size: 'medium' | 'large';
}

export function PointsWidget({ size }: PointsWidgetProps) {
  return <UserPointsCard />;
}
