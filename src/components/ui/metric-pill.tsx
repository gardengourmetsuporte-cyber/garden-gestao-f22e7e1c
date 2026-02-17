import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';

interface MetricPillProps {
  icon?: string;
  label: string;
  value: string | number;
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'primary';
  className?: string;
}

const variantStyles = {
  default: 'bg-secondary/60 text-foreground',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  destructive: 'bg-destructive/10 text-destructive',
  primary: 'bg-primary/10 text-primary',
};

export function MetricPill({ icon, label, value, variant = 'default', className }: MetricPillProps) {
  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold",
      variantStyles[variant],
      className
    )}>
      {icon && <AppIcon name={icon} size={12} />}
      <span className="text-muted-foreground font-medium">{label}</span>
      <span>{value}</span>
    </div>
  );
}
