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
  },
  success: {
    iconBg: 'bg-success/10',
    iconColor: 'text-success',
  },
  warning: {
    iconBg: 'bg-warning/10',
    iconColor: 'text-warning',
  },
  destructive: {
    iconBg: 'bg-destructive/10',
    iconColor: 'text-destructive',
  },
};

export function StatsCard({ title, value, icon, variant = 'default', onClick }: StatsCardProps) {
  const styles = variantStyles[variant];
  const numericValue = typeof value === 'number' ? value : null;
  const animatedValue = useCountUp(numericValue ?? 0);

  return (
    <button
      onClick={onClick}
      className="w-full text-left card-surface p-3 hover:shadow-card-hover active:scale-[0.97] transition-all duration-200"
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-medium text-muted-foreground leading-tight uppercase tracking-wide">{title}</p>
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", styles.iconBg)}>
          <AppIcon name={icon} size={16} className={styles.iconColor} />
        </div>
      </div>
      <p className="text-2xl font-extrabold text-foreground font-display" style={{ letterSpacing: '-0.03em' }}>
        {numericValue !== null ? animatedValue : value}
      </p>
    </button>
  );
}
