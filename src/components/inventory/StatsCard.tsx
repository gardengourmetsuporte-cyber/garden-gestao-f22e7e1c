import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
  onClick?: () => void;
}

const variantMap = {
  default: { stat: 'stat-command-cyan', iconBg: 'bg-primary/10 text-primary' },
  success: { stat: 'stat-command-green', iconBg: 'bg-success/10 text-success' },
  warning: { stat: 'stat-command-amber', iconBg: 'bg-warning/10 text-warning' },
  destructive: { stat: 'stat-command-red', iconBg: 'bg-destructive/10 text-destructive' },
};

export function StatsCard({ title, value, icon: Icon, variant = 'default', onClick }: StatsCardProps) {
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
        <div className={cn("stat-icon", styles.iconBg)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </button>
  );
}
