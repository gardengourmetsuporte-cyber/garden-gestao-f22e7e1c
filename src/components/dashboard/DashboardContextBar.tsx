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
    <div>
      <h2
        className="text-lg font-extrabold text-foreground font-display tracking-tight"
      >
        {greeting}, {firstName} <span className="animate-wave-hand">👋</span>
      </h2>
      <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
        {capitalizedDate}
        {activeUnit?.name && (
          <> · <span className="text-foreground/70">{activeUnit.name}</span></>
        )}
      </p>
    </div>
  );
}
