import { useUnit } from '@/contexts/UnitContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import gardenLogo from '@/assets/logo.png';
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

  return (
    <div
      className="relative -mx-4 -mt-5 lg:-mx-8 lg:-mt-6 px-5 pt-7 pb-8 lg:px-8 lg:pt-10 lg:pb-10 overflow-hidden rounded-b-3xl"
      style={{
        background: `
          radial-gradient(ellipse 160% 70% at 50% -20%, hsl(var(--primary) / 0.55) 0%, transparent 70%),
          radial-gradient(ellipse 100% 50% at 90% 10%, hsl(var(--primary) / 0.35) 0%, transparent 55%),
          radial-gradient(ellipse 70% 40% at 10% 25%, hsl(var(--primary) / 0.25) 0%, transparent 55%),
          linear-gradient(180deg, hsl(var(--primary) / 0.15) 0%, hsl(var(--background)) 100%)
        `,
      }}
    >
      {/* Top row: logo + greeting */}
      <div className="flex items-center gap-3.5 mb-5">
        <img
          src={gardenLogo}
          alt="Garden"
          className="w-12 h-12 rounded-full object-contain bg-primary/10 p-0.5"
        />
        <div>
          <p className="text-xs text-muted-foreground font-medium">{greeting},</p>
          <p className="text-base font-bold text-foreground tracking-tight">{firstName}</p>
        </div>
      </div>

      {/* Hero text — Spotify style */}
      <h1 className="font-display leading-[1.1] tracking-[-0.03em]">
        <span className="text-[28px] lg:text-[36px] font-extrabold text-foreground">
          Bem-vindo ao{' '}
        </span>
        <span className="text-[28px] lg:text-[36px] font-extrabold text-primary">
          Garden
        </span>
        <br />
        <span className="text-[28px] lg:text-[36px] font-extrabold text-foreground">
          {activeUnit?.name || 'Gestão'}
        </span>
      </h1>

      <p className="text-xs text-muted-foreground mt-3 font-medium">
        {capitalizedDate}
      </p>
    </div>
  );
}
