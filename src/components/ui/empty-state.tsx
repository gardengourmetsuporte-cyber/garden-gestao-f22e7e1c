import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: string;
  };
  className?: string;
  compact?: boolean;
}

export function EmptyState({ icon, title, description, action, className, compact }: EmptyStateProps) {
  return (
    <div className={cn("text-center", compact ? "py-8" : "py-16", className)}>
      <div className="w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center bg-secondary/50">
        <AppIcon name={icon} size={compact ? 22 : 28} className="text-muted-foreground/40" />
      </div>
      <p className="font-semibold text-foreground text-sm mb-1">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground max-w-[240px] mx-auto">{description}</p>
      )}
      {action && (
        <Button
          variant="outline"
          size="sm"
          className="mt-4 gap-1.5"
          onClick={action.onClick}
        >
          {action.icon && <AppIcon name={action.icon} size={14} />}
          {action.label}
        </Button>
      )}
    </div>
  );
}
