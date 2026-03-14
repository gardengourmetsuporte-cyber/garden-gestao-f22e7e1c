import { useUnit } from '@/contexts/UnitContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppIcon } from '@/components/ui/app-icon';
import type { DashboardStats } from '@/hooks/useDashboardStats';

interface DashboardContextBarProps {
  firstName: string;
  stats: DashboardStats;
}

export function DashboardContextBar({ firstName, stats }: DashboardContextBarProps) {
  const { activeUnit } = useUnit();

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  })();

  const todayFormatted = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });
  const capitalizedDate = todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1);
  const unitName = activeUnit?.name || 'Gestão';

  return (
    <div
      className="relative -mx-4 lg:-mx-8 lg:-mt-6 overflow-hidden rounded-b-[28px]"
      style={{
        marginTop: 'calc(-1 * (env(safe-area-inset-top, 0px) + 3rem + 1.25rem))',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 3rem + 1rem)',
      }}
    >
      {/* Background layers */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 120% 80% at 100% 0%, hsl(var(--primary) / 0.7) 0%, transparent 60%),
            radial-gradient(ellipse 80% 100% at 0% 100%, hsl(var(--primary) / 0.35) 0%, transparent 60%),
            linear-gradient(165deg, hsl(var(--primary) / 0.28) 0%, hsl(var(--primary) / 0.12) 50%, hsl(var(--background)) 100%)
          `,
        }}
      />

      {/* Subtle grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
        }}
      />

      {/* Content */}
      <div className="relative z-10 px-5 pb-7 lg:px-8 lg:pb-10">
        {/* Greeting chip */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-foreground/[0.08] backdrop-blur-sm mb-4">
          <span className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider">
            {greeting}, {firstName}
          </span>
          <span className="text-[11px]">👋</span>
        </div>

        {/* Hero headline */}
        <h1 className="font-display leading-[1.05] tracking-[-0.035em] mb-1">
          <span className="block text-[26px] lg:text-[34px] font-extrabold text-foreground/60">
            Bem-vindo ao
          </span>
          <span className="block text-[32px] lg:text-[40px] font-black text-foreground">
            Garden{' '}
            <span className="text-primary">{unitName}</span>
          </span>
        </h1>

        {/* Date + decorative line */}
        <div className="flex items-center gap-3 mt-4">
          <div className="h-[2px] w-8 rounded-full bg-primary/40" />
          <p className="text-[11px] text-muted-foreground font-medium tracking-wide uppercase">
            {capitalizedDate}
          </p>
        </div>
      </div>
    </div>
  );
}
