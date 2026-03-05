import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';

interface DashboardSectionProps {
  title: string;
  icon: string;
  iconColor?: string;
  children: React.ReactNode;
  onNavigate?: () => void;
  className?: string;
}

export function DashboardSection({ title, icon, iconColor = 'text-primary', children, onNavigate, className }: DashboardSectionProps) {
  return (
    <div className={cn(className)}>
      <button
        onClick={onNavigate}
        className={`dash-section-header ${onNavigate ? 'cursor-pointer' : 'cursor-default'}`}
        disabled={!onNavigate}
        type="button"
      >
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</span>
        {onNavigate && <AppIcon name="ChevronRight" size={12} className="ml-auto text-muted-foreground/40" />}
      </button>
      <div className="dash-section-body">
        {children}
      </div>
    </div>
  );
}
