import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useUnit } from '@/contexts/UnitContext';
import { AppIcon } from '@/components/ui/app-icon';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { hapticLight } from '@/lib/native';
import type { DashboardStats } from '@/hooks/useDashboardStats';

interface DashboardContextBarProps {
  firstName: string;
  stats: DashboardStats;
}

export function DashboardContextBar({ firstName, stats }: DashboardContextBarProps) {
  const { activeUnit } = useUnit();
  const queryClient = useQueryClient();

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  })();

  const todayFormatted = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });
  const capitalizedDate = todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1);

  const handleRefresh = useCallback(() => {
    hapticLight();
    queryClient.invalidateQueries();
  }, [queryClient]);

  return (
    <div className="flex items-start justify-between">
      <div>
        <h2
          className="text-base font-extrabold text-foreground font-display"
          style={{ letterSpacing: '-0.03em' }}
        >
          {greeting}, {firstName} <span className="animate-wave-hand">👋</span>
        </h2>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
          {capitalizedDate}
          {activeUnit?.name && (
            <> · <span className="text-foreground/70">{activeUnit.name}</span></>
          )}
        </p>
      </div>
      <button
        onClick={handleRefresh}
        className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
          "bg-card/70 border border-border/30",
          "hover:bg-muted/50 active:scale-[0.92] active:rotate-180 transition-all duration-300",
          "touch-manipulation"
        )}
        aria-label="Atualizar dados"
      >
        <AppIcon name="refresh" size={18} className="text-muted-foreground" />
      </button>
    </div>
  );
}
