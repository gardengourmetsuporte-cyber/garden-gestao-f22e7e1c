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

const variantGradients: Record<string, string> = {
  default: 'linear-gradient(135deg, #22C55E, #10B981)',
  success: 'linear-gradient(135deg, #22C55E, #10B981)',
  warning: 'linear-gradient(135deg, #F59E0B, #F97316)',
  destructive: 'linear-gradient(135deg, #EF4444, #F472B6)',
};

export function StatsCard({ title, value, icon, variant = 'default', onClick }: StatsCardProps) {
  const numericValue = typeof value === 'number' ? value : null;
  const animatedValue = useCountUp(numericValue ?? 0);

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-card rounded-lg p-3 hover:bg-secondary active:scale-[0.97] transition-all duration-200 relative overflow-hidden"
    >
      <div className="flex items-center justify-between mb-2 relative z-10">
        <p className="text-[11px] font-medium text-muted-foreground leading-tight uppercase tracking-wide">{title}</p>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center shadow-lg"
          style={{ background: variantGradients[variant] }}
        >
          <AppIcon name={icon} size={16} className="text-white" />
        </div>
      </div>
      <p className="text-2xl font-extrabold text-foreground" style={{ letterSpacing: '-0.03em' }}>
        {numericValue !== null ? animatedValue : value}
      </p>
    </button>
  );
}
