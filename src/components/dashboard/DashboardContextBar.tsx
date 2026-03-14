import { useUnit } from '@/contexts/UnitContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
    <div className="relative -mx-4 -mt-5 lg:-mx-8 lg:-mt-6 px-5 pt-14 pb-6 lg:px-8 lg:pt-16 lg:pb-8 overflow-hidden rounded-b-3xl"
      style={{
        background: `
          radial-gradient(ellipse 120% 80% at 50% -10%, hsl(141 73% 25% / 0.7) 0%, transparent 60%),
          radial-gradient(ellipse 80% 60% at 80% 20%, hsl(141 73% 18% / 0.5) 0%, transparent 50%),
          radial-gradient(ellipse 60% 50% at 20% 30%, hsl(141 73% 15% / 0.4) 0%, transparent 50%),
          linear-gradient(180deg, hsl(141 73% 12% / 0.8) 0%, hsl(var(--background)) 85%)
        `,
      }}
    >
      {/* Hero text */}
      <p className="text-xs text-muted-foreground mb-1">{greeting},</p>
      <h1 className="text-2xl lg:text-3xl font-extrabold text-foreground font-display tracking-tight leading-tight">
        {firstName} <span className="animate-wave-hand">👋</span>
      </h1>

      <h2 className="text-lg lg:text-xl font-bold text-muted-foreground/80 font-display tracking-tight mt-1">
        Bem-vindo ao{' '}
        <span className="text-primary">Garden</span>
      </h2>

      <p className="text-xs text-muted-foreground mt-2">
        {capitalizedDate}
        {activeUnit?.name && (
          <> · <span className="text-foreground/70">{activeUnit.name}</span></>
        )}
      </p>
    </div>
  );
}
