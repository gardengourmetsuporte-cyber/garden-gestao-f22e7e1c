import { useNavigate } from 'react-router-dom';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';

interface DashboardEmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionRoute?: string;
  onAction?: () => void;
}

export function DashboardEmptyState({ icon, title, description, actionLabel, actionRoute, onAction }: DashboardEmptyStateProps) {
  const navigate = useNavigate();

  const handleAction = () => {
    if (onAction) return onAction();
    if (actionRoute) navigate(actionRoute);
  };

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
        <AppIcon name={icon} size={28} className="text-muted-foreground/60" />
      </div>
      <h4 className="text-sm font-semibold text-foreground mb-1">{title}</h4>
      <p className="text-xs text-muted-foreground max-w-[240px] leading-relaxed">{description}</p>
      {actionLabel && (
        <Button variant="outline" size="sm" onClick={handleAction} className="mt-3 text-xs h-8">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
