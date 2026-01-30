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
        "stock-card w-full text-left transition-all hover:shadow-md active:scale-[0.98]",
        onClick && "cursor-pointer"
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className={cn("p-2.5 rounded-xl", variantStyles[variant])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </button>
  );
}
