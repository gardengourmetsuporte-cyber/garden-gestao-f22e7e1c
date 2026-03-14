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
    <div className="relative -mx-4 -mt-5 lg:-mx-8 lg:-mt-6 px-5 pt-6 pb-6 lg:px-8 lg:pt-8 lg:pb-8 overflow-hidden rounded-b-3xl"
      style={{
        background: `
          radial-gradient(ellipse 120% 80% at 50% -10%, hsl(141 73% 25% / 0.7) 0%, transparent 60%),
          radial-gradient(ellipse 80% 60% at 80% 20%, hsl(141 73% 18% / 0.5) 0%, transparent 50%),
          radial-gradient(ellipse 60% 50% at 20% 30%, hsl(141 73% 15% / 0.4) 0%, transparent 50%),
          linear-gradient(180deg, hsl(141 73% 12% / 0.8) 0%, hsl(var(--background)) 85%)
        `,
      }}
    >
      {/* Top row: logo + greeting */}
      <div className="flex items-center gap-3 mb-4">
        <img
          src={gardenLogo}
          alt="Garden"
          className="w-10 h-10 rounded-full object-contain bg-primary/10 p-0.5"
        />
        <div>
          <p className="text-xs text-muted-foreground">{greeting},</p>
          <p className="text-sm font-bold text-foreground">{firstName}</p>
        </div>
      </div>

      {/* Hero text */}
      <h1 className="text-2xl lg:text-3xl font-extrabold text-foreground font-display tracking-tight leading-tight">
        Bem-vindo ao{' '}
        <span className="text-primary">Garden</span>
        <br />
        {activeUnit?.name || 'Gestão'}
      </h1>

      <p className="text-xs text-muted-foreground mt-2">
        {capitalizedDate}
      </p>
    </div>
  );
}
