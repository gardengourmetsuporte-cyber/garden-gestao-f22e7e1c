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
    <div className="dash-section animate-spring-in">
      <button
        onClick={onNavigate}
        className={`dash-section-header ${onNavigate ? 'cursor-pointer' : 'cursor-default'}`}
        disabled={!onNavigate}
        type="button"
      >
        <div className={`dash-section-icon ${iconColor}`}>
          <AppIcon name={icon} size={16} />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{title}</span>
        {onNavigate && <AppIcon name="ChevronRight" size={14} className="ml-auto text-muted-foreground/50" />}
      </button>
      <div className="dash-section-body">
        {children}
      </div>
    </div>
  );
}
