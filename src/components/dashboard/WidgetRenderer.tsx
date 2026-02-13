import { WidgetConfig } from '@/types/dashboard';
import { WelcomeWidget } from './widgets/WelcomeWidget';
import { MetricWidget } from './widgets/MetricWidget';
import { AlertsWidget } from './widgets/AlertsWidget';
import { QuickAccessWidget } from './widgets/QuickAccessWidget';
import { LeaderboardWidget } from './widgets/LeaderboardWidget';
import { NotificationsWidget } from './widgets/NotificationsWidget';
import { PointsWidget } from './widgets/PointsWidget';

interface WidgetRendererProps {
  widget: WidgetConfig;
}

export function WidgetRenderer({ widget }: WidgetRendererProps) {
  switch (widget.type) {
    case 'welcome':
      return <WelcomeWidget size={widget.size as 'medium' | 'large'} />;
    case 'metric_balance':
    case 'metric_orders':
    case 'metric_critical':
    case 'metric_recipes':
      return <MetricWidget type={widget.type} size={widget.size as 'small' | 'medium'} />;
    case 'alerts':
      return <AlertsWidget />;
    case 'quick_access':
      return <QuickAccessWidget />;
    case 'leaderboard':
      return <LeaderboardWidget size={widget.size as 'medium' | 'large'} />;
    case 'notifications':
      return <NotificationsWidget />;
    case 'points':
      return <PointsWidget size={widget.size as 'medium' | 'large'} />;
    default:
      return null;
  }
}
