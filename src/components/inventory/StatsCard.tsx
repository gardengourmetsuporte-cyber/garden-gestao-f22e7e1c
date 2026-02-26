import { cn } from '@/lib/utils';
import { AppIcon } from '@/components/ui/app-icon';
import { useCountUp } from '@/hooks/useCountUp';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: string;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
  onClick?: () => void;
}

const variantStyles = {
  default: {
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    border: 'border-primary/20',
  },
  success: {
    iconBg: 'bg-success/10',
    iconColor: 'text-success',
    border: 'border-success/20',
  },
  warning: {
    iconBg: 'bg-warning/10',
    iconColor: 'text-warning',
    border: 'border-warning/20',
  },
  destructive: {
    iconBg: 'bg-destructive/10',
    iconColor: 'text-destructive',
    border: 'border-destructive/20',
  },
};

export function StatsCard({ title, value, icon, variant = 'default', onClick }: StatsCardProps) {
  const styles = variantStyles[variant];
  const numericValue = typeof value === 'number' ? value : null;
  const animatedValue = useCountUp(numericValue ?? 0);

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-3 rounded-xl card-surface transition-all duration-200",
        "hover:bg-card/90 active:scale-[0.97]",
        styles.border
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-medium text-muted-foreground leading-tight uppercase tracking-wide">{title}</p>
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", styles.iconBg)}>
          <AppIcon name={icon} size={16} className={styles.iconColor} />
        </div>
      </div>
      <p className="text-2xl font-extrabold text-foreground font-display" style={{ letterSpacing: '-0.03em' }}>{numericValue !== null ? animatedValue : value}</p>
    </button>
  );
}
