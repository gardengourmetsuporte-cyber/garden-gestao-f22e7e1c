import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
  onClick?: () => void;
}

export function StatsCard({ title, value, icon: Icon, variant = 'default', onClick }: StatsCardProps) {
  const variantStyles = {
    default: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    destructive: 'bg-destructive/10 text-destructive',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "stat-card w-full text-left",
        onClick && "cursor-pointer"
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-label">{title}</p>
          <p className="stat-value mt-1">{value}</p>
        </div>
        <div className={cn("stat-icon", variantStyles[variant])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </button>
  );
}
