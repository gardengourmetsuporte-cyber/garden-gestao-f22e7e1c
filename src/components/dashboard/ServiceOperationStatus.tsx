import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import type { OperationPulse, Pulse } from '@/hooks/useServiceDashboard';

const PULSE_STYLE: Record<Pulse, { bg: string; ring: string; dot: string; text: string; label: string }> = {
  calm: {
    bg: 'bg-emerald-500/10',
    ring: 'ring-emerald-500/30',
    dot: 'bg-emerald-400',
    text: 'text-emerald-400',
    label: 'Tranquilo',
  },
  moderate: {
    bg: 'bg-amber-500/10',
    ring: 'ring-amber-500/30',
    dot: 'bg-amber-400',
    text: 'text-amber-400',
    label: 'Moderado',
  },
  intense: {
    bg: 'bg-destructive/10',
    ring: 'ring-destructive/30',
    dot: 'bg-destructive',
    text: 'text-destructive',
    label: 'Intenso',
  },
};

const SECTORS = [
  { key: 'salon' as const, icon: 'table_restaurant', label: 'Salão' },
  { key: 'kitchen' as const, icon: 'soup_kitchen', label: 'Cozinha' },
  { key: 'delivery' as const, icon: 'delivery_dining', label: 'Delivery' },
];

export function ServiceOperationStatus({ pulse }: { pulse: OperationPulse }) {
  const overall = PULSE_STYLE[pulse.overall];

  return (
    <div className={cn('card-base p-4 border animate-slide-up', overall.ring, 'ring-1')}>
      {/* Summary line */}
      <div className="flex items-center gap-2 mb-3">
        <div className={cn('w-2 h-2 rounded-full animate-pulse shrink-0 aspect-square', overall.dot)} />
        <p className={cn('text-xs font-semibold', overall.text)}>{pulse.summary}</p>
      </div>

      {/* 3 sector indicators */}
      <div className="grid grid-cols-3 gap-2">
        {SECTORS.map((sector, i) => {
          const p = pulse[sector.key];
          const style = PULSE_STYLE[p];
          return (
            <div
              key={sector.key}
              className={cn(
                'flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all duration-300 hover:scale-[1.03]',
                style.bg,
                'animate-slide-up',
                `dash-stagger-${i + 2}`,
              )}
            >
              <div className={cn('w-2 h-2 rounded-full shrink-0 aspect-square animate-pulse', style.dot)} />
              <AppIcon name={sector.icon} size={18} className={cn(style.text, 'transition-transform duration-300')} />
              <span className="text-[11px] font-bold text-foreground">{sector.label}</span>
              <span className={cn('text-[10px] font-semibold', style.text)}>{style.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
