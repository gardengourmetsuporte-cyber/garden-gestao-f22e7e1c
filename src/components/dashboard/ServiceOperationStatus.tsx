import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import type { OperationPulse, Pulse } from '@/hooks/useServiceDashboard';

const PULSE_STYLE: Record<Pulse, { bg: string; dot: string; text: string; label: string; cardBg: string }> = {
  calm: {
    bg: 'bg-primary/10',
    dot: 'bg-primary',
    text: 'text-primary',
    label: 'Tranquilo',
    cardBg: 'bg-primary/8',
  },
  moderate: {
    bg: 'bg-amber-500/10',
    dot: 'bg-amber-400',
    text: 'text-amber-400',
    label: 'Moderado',
    cardBg: 'bg-amber-500/8',
  },
  intense: {
    bg: 'bg-destructive/10',
    dot: 'bg-destructive',
    text: 'text-destructive',
    label: 'Intenso',
    cardBg: 'bg-destructive/8',
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
    <div className="card-surface p-5 space-y-4 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn('w-2 h-2 rounded-full animate-pulse shrink-0 aspect-square', overall.dot)} />
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pulso Operacional</h3>
        </div>
        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', overall.bg, overall.text)}>
          {overall.label}
        </span>
      </div>

      {/* Summary */}
      <p className={cn('text-sm font-semibold', overall.text)}>{pulse.summary}</p>

      {/* 3 sector cards */}
      <div className="grid grid-cols-3 gap-2.5">
        {SECTORS.map((sector, i) => {
          const p = pulse[sector.key];
          const style = PULSE_STYLE[p];
          return (
            <div
              key={sector.key}
              className={cn(
                'flex flex-col items-center gap-2 py-4 rounded-2xl transition-all duration-300',
                style.cardBg,
                'animate-slide-up',
                `dash-stagger-${i + 2}`,
              )}
            >
              <div className="relative">
                <div className={cn('w-2 h-2 rounded-full shrink-0 aspect-square absolute -top-0.5 -right-0.5', style.dot)} />
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', style.bg)}>
                  <AppIcon name={sector.icon} size={20} className={style.text} />
                </div>
              </div>
              <span className="text-[12px] font-bold text-foreground">{sector.label}</span>
              <span className={cn('text-[10px] font-semibold', style.text)}>{style.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
