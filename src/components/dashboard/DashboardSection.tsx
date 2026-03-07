import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';

interface DashboardSectionProps {
  title?: string;
  icon?: string;
  iconColor?: string;
  children: React.ReactNode;
  onNavigate?: () => void;
  className?: string;
}

export function DashboardSection({ title, icon, iconColor = 'text-primary', children, onNavigate, className }: DashboardSectionProps) {
  return (
    <div className={cn(className)}>
      {title && (
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-foreground">{title}</span>
          {onNavigate && (
            <button
              onClick={onNavigate}
              className="text-[11px] font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-0.5"
              type="button"
            >
              Ver tudo
              <AppIcon name="ChevronRight" size={12} />
            </button>
          )}
        </div>
      )}
      <div className="dash-section-body" onClick={!title && onNavigate ? onNavigate : undefined} style={!title && onNavigate ? { cursor: 'pointer' } : undefined}>
        {children}
      </div>
    </div>
  );
}
