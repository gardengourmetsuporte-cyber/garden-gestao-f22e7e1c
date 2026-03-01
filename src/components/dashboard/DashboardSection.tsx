import { AppIcon } from '@/components/ui/app-icon';

interface DashboardSectionProps {
  title: string;
  icon: string;
  iconColor?: string;
  children: React.ReactNode;
  onNavigate?: () => void;
}

export function DashboardSection({ title, icon, iconColor = 'text-primary', children, onNavigate }: DashboardSectionProps) {
  return (
    <div className="animate-spring-in">
      <button
        onClick={onNavigate}
        className={`dash-section-header ${onNavigate ? 'cursor-pointer' : 'cursor-default'}`}
        disabled={!onNavigate}
        type="button"
      >
        <span className={iconColor}>
          <AppIcon name={icon} size={14} />
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</span>
        {onNavigate && <AppIcon name="ChevronRight" size={12} className="ml-auto text-muted-foreground/40" />}
      </button>
      <div className="dash-section-body">
        {children}
      </div>
    </div>
  );
}
