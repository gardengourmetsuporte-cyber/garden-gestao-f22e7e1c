import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  icon?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: string;
  };
  className?: string;
  /** Small uppercase label style instead of standard title */
  variant?: 'default' | 'label';
}

export function SectionHeader({ title, icon, action, className, variant = 'default' }: SectionHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="flex items-center gap-2">
        {icon && (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10 border border-primary/20">
            <AppIcon name={icon} size={16} className="text-primary" />
          </div>
        )}
        <h3 className={cn(
          variant === 'label'
            ? "text-xs font-semibold text-muted-foreground uppercase tracking-wider"
            : "text-sm font-bold text-foreground"
        )}>
          {title}
        </h3>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          {action.label}
          <AppIcon name={action.icon || 'ChevronRight'} size={14} />
        </button>
      )}
    </div>
  );
}
