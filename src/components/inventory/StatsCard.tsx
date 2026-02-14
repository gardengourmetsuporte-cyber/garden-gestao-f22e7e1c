import { cn } from '@/lib/utils';
import { AppIcon } from '@/components/ui/app-icon';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: string;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
  onClick?: () => void;
}

const variantMap = {
  default: { stat: 'stat-command-cyan', iconCls: 'icon-glow icon-glow-md icon-glow-primary' },
  success: { stat: 'stat-command-green', iconCls: 'icon-glow icon-glow-md icon-glow-success' },
  warning: { stat: 'stat-command-amber', iconCls: 'icon-glow icon-glow-md icon-glow-warning' },
  destructive: { stat: 'stat-command-red', iconCls: 'icon-glow icon-glow-md icon-glow-destructive' },
};

export function StatsCard({ title, value, icon, variant = 'default', onClick }: StatsCardProps) {
  const styles = variantMap[variant];

  return (
    <button
      onClick={onClick}
      className={cn("stat-command w-full text-left", styles.stat)}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-label">{title}</p>
          <p className="stat-value mt-1">{value}</p>
        </div>
        <div className={cn("stat-icon", styles.iconCls)}>
          <AppIcon name={icon} size={20} />
        </div>
      </div>
    </button>
  );
}
