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
    iconBg: 'bg-primary/15',
    iconColor: 'text-primary',
  },
  success: {
    iconBg: 'bg-success/15',
    iconColor: 'text-success',
  },
  warning: {
    iconBg: 'bg-warning/15',
    iconColor: 'text-warning',
  },
  destructive: {
    iconBg: 'bg-destructive/15',
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
      className="w-full text-left bg-card rounded-lg p-3 hover:bg-secondary active:scale-[0.97] transition-all duration-200 relative overflow-hidden"
    >
      <div className="flex items-center justify-between mb-2 relative z-10">
        <p className="text-[11px] font-medium text-muted-foreground leading-tight uppercase tracking-wide">{title}</p>
        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-colors", styles.iconBg)}>
          <AppIcon name={icon} size={16} className={styles.iconColor} />
        </div>
      </div>
      <p className="text-2xl font-extrabold text-foreground" style={{ letterSpacing: '-0.03em' }}>
        {numericValue !== null ? animatedValue : value}
      </p>
    </button>
  );
}
